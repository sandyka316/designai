"""
Genetic Algorithm — Prompt Evolution Service
=============================================
User bisa "evolve" prompt mereka layaknya seleksi alam:
  1. INIT   — Sistem men-generate N variasi prompt dari prompt awal
  2. SELECT — User memilih variasi yang paling bagus (manual selection)
  3. BREED  — Sistem mengkawinkan variasi pilihan user → generasi baru
  4. Ulang langkah 2–3 sampai user puas

Komponen GA:
  - Gene     : satu prompt (string)
  - Genome   : koleksi prompt dalam satu generasi
  - Fitness  : dinilai manual oleh user (1–5 stars) atau auto via heuristik
  - Crossover: gabungkan kalimat dari dua "parent" prompt
  - Mutation : Gemini API me-mutate kata-kata kunci secara acak
"""

from __future__ import annotations

import random
import re
import uuid
from dataclasses import dataclass, field
from typing import Optional

from google import genai
from google.genai import types

from core.config import settings

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

_EVOLVE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
]


# ──────────────────────────────────────────────────────────────────────────────
# Data Classes
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class PromptGene:
    """Satu individu dalam populasi genetik."""
    id: str
    prompt: str
    generation: int          # generasi ke berapa (0 = awal)
    parent_ids: list[str]    # ID prompt-prompt yang menjadi orang tua
    fitness: float = 0.0     # 0.0 – 1.0 (diisi setelah user rating)
    mutation_rate: float = 0.0


@dataclass
class GeneticPopulation:
    """Satu generasi penuh prompt."""
    generation_number: int
    genes: list[PromptGene]
    original_prompt: str
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))


# ──────────────────────────────────────────────────────────────────────────────
# Heuristic Fitness (auto-score tanpa user rating)
# ──────────────────────────────────────────────────────────────────────────────

_QUALITY_KEYWORDS = [
    "masterpiece", "best quality", "highly detailed", "sharp focus",
    "8k", "4k", "studio lighting", "professional", "photorealistic",
    "cinematic", "HDR", "bokeh", "elegant", "ultra-realistic",
]

_STYLE_KEYWORDS = [
    "minimalist", "luxury", "modern", "vintage", "abstract",
    "geometric", "organic", "futuristic", "industrial", "artisan",
]

_COLOR_PATTERN = re.compile(
    r'\b(#[0-9A-Fa-f]{3,6}|'
    r'red|blue|green|yellow|purple|pink|gold|silver|white|black|'
    r'crimson|emerald|sapphire|amber|ivory|charcoal|teal|coral)\b',
    re.IGNORECASE
)


def heuristic_fitness(prompt: str) -> float:
    """
    Nilai fitness otomatis berdasarkan heuristik:
    - Panjang prompt (ideal 80–200 chars)
    - Jumlah quality keywords
    - Jumlah style keywords
    - Kehadiran warna/hex
    - Tidak ada kata negatif/ambigu
    """
    score = 0.0
    total = 0.0

    # 1. Panjang prompt (0–1)
    length = len(prompt)
    if 80 <= length <= 200:
        length_score = 1.0
    elif 50 <= length < 80 or 200 < length <= 300:
        length_score = 0.7
    elif 20 <= length < 50:
        length_score = 0.4
    else:
        length_score = 0.2
    score += length_score * 0.25
    total += 0.25

    # 2. Quality keywords (0–1)
    q_count = sum(1 for kw in _QUALITY_KEYWORDS if kw.lower() in prompt.lower())
    quality_score = min(1.0, q_count / 4)
    score += quality_score * 0.30
    total += 0.30

    # 3. Style keywords (0–1)
    s_count = sum(1 for kw in _STYLE_KEYWORDS if kw.lower() in prompt.lower())
    style_score = min(1.0, s_count / 2)
    score += style_score * 0.25
    total += 0.25

    # 4. Warna spesifik (0–1)
    color_matches = len(_COLOR_PATTERN.findall(prompt))
    color_score = min(1.0, color_matches / 3)
    score += color_score * 0.20
    total += 0.20

    return round(score / total if total > 0 else 0.0, 4)


# ──────────────────────────────────────────────────────────────────────────────
# Crossover Operator
# ──────────────────────────────────────────────────────────────────────────────

def crossover(parent_a: str, parent_b: str) -> str:
    """
    Single-point crossover pada level kalimat/frasa.
    Split kedua prompt berdasarkan koma, ambil bagian depan A + bagian belakang B.
    """
    parts_a = [p.strip() for p in parent_a.split(",") if p.strip()]
    parts_b = [p.strip() for p in parent_b.split(",") if p.strip()]

    if len(parts_a) < 2 or len(parts_b) < 2:
        # Fallback: alternating words
        words_a = parent_a.split()
        words_b = parent_b.split()
        mid = len(words_a) // 2
        child_words = words_a[:mid] + words_b[mid:]
        return " ".join(child_words)

    # Crossover point
    cut_a = random.randint(1, max(1, len(parts_a) - 1))
    cut_b = random.randint(1, max(1, len(parts_b) - 1))

    child_parts = parts_a[:cut_a] + parts_b[cut_b:]
    return ", ".join(child_parts)


# ──────────────────────────────────────────────────────────────────────────────
# Mutation via Gemini
# ──────────────────────────────────────────────────────────────────────────────

_MUTATION_SYSTEM = """You are an AI prompt mutation engine for image generation.
Your job: take a prompt and apply ONE small creative mutation to it.

Types of mutations (pick one randomly):
1. STYLE SWAP — replace the visual style with a different, complementary style
2. COLOR SHIFT — change or add specific color details
3. MOOD CHANGE — alter the emotional tone (elegant→dramatic, calm→energetic)
4. DETAIL ADD — add one specific material, texture, or lighting detail
5. QUALITY BOOST — add or replace quality tags

RULES:
- Output ONLY the mutated prompt — no explanation
- Keep the core subject/object unchanged
- Maximum 200 words
- Keep quality tags at the end"""


async def mutate_prompt(prompt: str, mutation_strength: float = 0.3) -> str:
    """
    Mutasi satu prompt menggunakan Gemini.

    Args:
        prompt: Prompt asli
        mutation_strength: 0.0 (minimal) – 1.0 (radikal)

    Returns:
        Mutated prompt string
    """
    strength_desc = (
        "minor (one tiny change)" if mutation_strength < 0.4
        else "moderate (a few changes)" if mutation_strength < 0.7
        else "significant (multiple bold changes)"
    )

    try:
        for model_name in _EVOLVE_MODELS:
            try:
                response = await _client.aio.models.generate_content(
                    model=model_name,
                    contents=(
                        f"Apply a {strength_desc} mutation to this image generation prompt:\n\n"
                        f"{prompt}"
                    ),
                    config=types.GenerateContentConfig(
                        system_instruction=_MUTATION_SYSTEM,
                        temperature=0.4 + mutation_strength * 0.5,
                        max_output_tokens=300,
                    ),
                )
                mutated = response.text.strip()
                if mutated:
                    return mutated
            except Exception as e:
                err = str(e)
                if any(code in err for code in ["429", "404", "RESOURCE_EXHAUSTED"]):
                    continue
                break
    except Exception:
        pass

    return prompt  # fallback: return original


# ──────────────────────────────────────────────────────────────────────────────
# Initial Population Generation
# ──────────────────────────────────────────────────────────────────────────────

_INIT_SYSTEM = """You are an AI prompt evolution engine for image generation.

Given a seed prompt, generate EXACTLY {n} diverse variations of it.
Each variation should explore a different creative direction:
- Different visual styles (minimalist, luxury, abstract, photorealistic, etc.)
- Different lighting/mood combinations
- Different material/texture emphasis
- Different color palettes

OUTPUT FORMAT (JSON array only, no markdown, no explanation):
[
  "variation 1 prompt here...",
  "variation 2 prompt here...",
  ...
]

Rules:
- Each variation must be complete and stand-alone
- Keep the core subject/object from the original prompt
- Add professional quality tags to each: (masterpiece, best quality, highly detailed, sharp focus, 8k)
- Max 150 words per variation"""


async def generate_initial_population(
    seed_prompt: str,
    population_size: int = 6,
) -> GeneticPopulation:
    """
    Generate populasi awal (Generasi 0) dari seed prompt.

    Args:
        seed_prompt: Prompt awal dari user
        population_size: Jumlah variasi yang di-generate (default 6)

    Returns:
        GeneticPopulation dengan genes hasil generate
    """
    n = max(3, min(population_size, 8))  # clamp 3–8

    system_prompt = _INIT_SYSTEM.replace("{n}", str(n))
    variations: list[str] = []

    for model_name in _EVOLVE_MODELS:
        try:
            response = await _client.aio.models.generate_content(
                model=model_name,
                contents=(
                    f"Generate {n} diverse prompt variations for this design concept:\n\n"
                    f"{seed_prompt}"
                ),
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.9,
                    max_output_tokens=800,
                ),
            )

            text = response.text.strip()
            # Parse JSON array
            import json
            # Cari array JSON di response
            start = text.find("[")
            end = text.rfind("]") + 1
            if start != -1 and end > start:
                json_str = text[start:end]
                parsed = json.loads(json_str)
                if isinstance(parsed, list):
                    variations = [str(v) for v in parsed if v][:n]
                    break
        except Exception as e:
            err = str(e)
            if any(code in err for code in ["429", "404", "RESOURCE_EXHAUSTED"]):
                continue
            break

    # Fallback: jika Gemini gagal, buat variasi sederhana dengan mutasi ringan
    if not variations:
        variations = [seed_prompt] * n

    # Buat PromptGene objects
    genes = [
        PromptGene(
            id=str(uuid.uuid4()),
            prompt=v,
            generation=0,
            parent_ids=[],
            fitness=heuristic_fitness(v),
        )
        for v in variations
    ]

    return GeneticPopulation(
        generation_number=0,
        genes=genes,
        original_prompt=seed_prompt,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Breeding (next generation)
# ──────────────────────────────────────────────────────────────────────────────

async def breed_next_generation(
    selected_genes: list[PromptGene],
    original_prompt: str,
    generation_number: int,
    population_size: int = 6,
    mutation_rate: float = 0.3,
) -> GeneticPopulation:
    """
    Dari gene-gene yang dipilih user, breed generasi berikutnya.

    Strategi:
    1. Elitism: pertahankan 1 gene terbaik langsung
    2. Crossover: pasangkan gene-gene secara acak → anak baru
    3. Mutation: beberapa anak di-mutate menggunakan Gemini

    Args:
        selected_genes: Gene yang dipilih user (fitness dianggap tinggi)
        original_prompt: Prompt asli (seed)
        generation_number: Nomor generasi baru
        population_size: Jumlah individu generasi baru
        mutation_rate: Probabilitas mutasi (0.0–1.0)

    Returns:
        GeneticPopulation generasi baru
    """
    if not selected_genes:
        return await generate_initial_population(original_prompt, population_size)

    # Update fitness dari selected genes (user selected = high fitness)
    for gene in selected_genes:
        gene.fitness = max(gene.fitness, 0.7)  # minimum 0.7 untuk yang dipilih

    new_genes: list[PromptGene] = []

    # 1. ELITISM: ambil gene terbaik langsung
    best = max(selected_genes, key=lambda g: g.fitness)
    elite = PromptGene(
        id=str(uuid.uuid4()),
        prompt=best.prompt,
        generation=generation_number,
        parent_ids=[best.id],
        fitness=heuristic_fitness(best.prompt),
        mutation_rate=0.0,
    )
    new_genes.append(elite)

    # 2. CROSSOVER + MUTATION
    n_children = population_size - 1
    parents = selected_genes if len(selected_genes) >= 2 else selected_genes * 2

    for i in range(n_children):
        # Pilih 2 parent secara acak
        p1, p2 = random.sample(parents, 2) if len(parents) >= 2 else (parents[0], parents[0])

        # Crossover
        child_prompt = crossover(p1.prompt, p2.prompt)

        # Mutation berdasarkan mutation_rate
        actual_mutation = mutation_rate
        should_mutate = random.random() < mutation_rate
        if should_mutate:
            child_prompt = await mutate_prompt(child_prompt, actual_mutation)

        child = PromptGene(
            id=str(uuid.uuid4()),
            prompt=child_prompt,
            generation=generation_number,
            parent_ids=[p1.id, p2.id],
            fitness=heuristic_fitness(child_prompt),
            mutation_rate=actual_mutation if should_mutate else 0.0,
        )
        new_genes.append(child)

    return GeneticPopulation(
        generation_number=generation_number,
        genes=new_genes,
        original_prompt=original_prompt,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Serialization helpers (untuk API response)
# ──────────────────────────────────────────────────────────────────────────────

def gene_to_dict(gene: PromptGene) -> dict:
    return {
        "id": gene.id,
        "prompt": gene.prompt,
        "generation": gene.generation,
        "parent_ids": gene.parent_ids,
        "fitness": gene.fitness,
        "mutation_rate": gene.mutation_rate,
        "heuristic_score": heuristic_fitness(gene.prompt),
    }


def population_to_dict(pop: GeneticPopulation) -> dict:
    return {
        "session_id": pop.session_id,
        "generation_number": pop.generation_number,
        "original_prompt": pop.original_prompt,
        "genes": [gene_to_dict(g) for g in pop.genes],
        "best_fitness": max((g.fitness for g in pop.genes), default=0.0),
        "avg_fitness": (
            sum(g.fitness for g in pop.genes) / len(pop.genes) if pop.genes else 0.0
        ),
    }
