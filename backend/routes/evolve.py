"""
Route: /api/evolve
==================
Genetic Algorithm Prompt Evolution — user bisa evolve prompt mereka
melalui seleksi alam (init → user pilih → breed → iterasi).

Session disimpan di Redis dengan TTL 24 jam.
"""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, HTTPException

from core.redis import cache_get, cache_set, cache_delete
from schemas.evolve import (
    InitEvolveRequest,
    BreedRequest,
    PopulationResponse,
    PromptGeneResponse,
)
from services.genetic_prompt_service import (
    GeneticPopulation,
    PromptGene,
    generate_initial_population,
    breed_next_generation,
    population_to_dict,
)

router = APIRouter()

_SESSION_TTL = 86400  # 24 jam dalam detik
_SESSION_PREFIX = "evolve:session:"


def _population_from_dict(data: dict) -> GeneticPopulation:
    """Deserialize GeneticPopulation dari dict (Redis)."""
    genes = [
        PromptGene(
            id=g["id"],
            prompt=g["prompt"],
            generation=g["generation"],
            parent_ids=g["parent_ids"],
            fitness=g["fitness"],
            mutation_rate=g["mutation_rate"],
        )
        for g in data["genes"]
    ]
    pop = GeneticPopulation(
        generation_number=data["generation_number"],
        genes=genes,
        original_prompt=data["original_prompt"],
    )
    pop.session_id = data["session_id"]
    return pop


def _pop_to_response(pop: GeneticPopulation) -> PopulationResponse:
    """Convert GeneticPopulation ke PopulationResponse."""
    d = population_to_dict(pop)
    return PopulationResponse(
        session_id=d["session_id"],
        generation_number=d["generation_number"],
        original_prompt=d["original_prompt"],
        genes=[
            PromptGeneResponse(
                id=g["id"],
                prompt=g["prompt"],
                generation=g["generation"],
                parent_ids=g["parent_ids"],
                fitness=g["fitness"],
                mutation_rate=g["mutation_rate"],
                heuristic_score=g["heuristic_score"],
            )
            for g in d["genes"]
        ],
        best_fitness=d["best_fitness"],
        avg_fitness=round(d["avg_fitness"], 4),
    )


@router.post("/init", response_model=PopulationResponse)
async def init_evolution(body: InitEvolveRequest):
    """
    Mulai sesi evolusi baru dari seed prompt.
    Generates N variasi awal menggunakan Gemini.
    Returns session_id untuk digunakan di endpoint /breed.
    """
    try:
        population = await generate_initial_population(
            seed_prompt=body.seed_prompt,
            population_size=body.population_size,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Gagal generate populasi awal: {str(e)}")

    # Simpan ke Redis
    session_key = f"{_SESSION_PREFIX}{population.session_id}"
    pop_dict = population_to_dict(population)
    await cache_set(session_key, pop_dict, ttl=_SESSION_TTL)

    response = _pop_to_response(population)
    response.message = f"Populasi awal ({len(population.genes)} variasi) berhasil di-generate!"
    return response


@router.post("/breed", response_model=PopulationResponse)
async def breed_population(body: BreedRequest):
    """
    Breed generasi baru dari gene-gene yang dipilih user.
    User memilih gene ID terbaik, sistem melakukan crossover + mutasi.
    """
    session_key = f"{_SESSION_PREFIX}{body.session_id}"
    cached = await cache_get(session_key)

    if not cached:
        raise HTTPException(
            status_code=404,
            detail="Sesi evolusi tidak ditemukan atau sudah expired. Mulai sesi baru.",
        )

    population = _population_from_dict(cached)

    # Validasi selected gene IDs
    gene_map = {g.id: g for g in population.genes}
    selected = [gene_map[gid] for gid in body.selected_gene_ids if gid in gene_map]

    if not selected:
        raise HTTPException(
            status_code=400,
            detail="Tidak ada gene valid yang dipilih. Pastikan ID gene benar.",
        )

    try:
        new_population = await breed_next_generation(
            selected_genes=selected,
            original_prompt=population.original_prompt,
            generation_number=population.generation_number + 1,
            population_size=len(population.genes),
            mutation_rate=body.mutation_rate,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Gagal breed generasi baru: {str(e)}")

    # Pertahankan session_id yang sama
    new_population.session_id = body.session_id

    # Update di Redis
    pop_dict = population_to_dict(new_population)
    await cache_set(session_key, pop_dict, ttl=_SESSION_TTL)

    response = _pop_to_response(new_population)
    response.message = (
        f"Generasi {new_population.generation_number} berhasil di-breed "
        f"dari {len(selected)} gene pilihan!"
    )
    return response


@router.get("/session/{session_id}", response_model=PopulationResponse)
async def get_session(session_id: str):
    """Ambil status sesi evolusi dari Redis."""
    session_key = f"{_SESSION_PREFIX}{session_id}"
    cached = await cache_get(session_key)

    if not cached:
        raise HTTPException(
            status_code=404,
            detail="Sesi evolusi tidak ditemukan atau sudah expired.",
        )

    population = _population_from_dict(cached)
    return _pop_to_response(population)


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Hapus sesi evolusi dari Redis."""
    session_key = f"{_SESSION_PREFIX}{session_id}"
    await cache_delete(session_key)
    return {"success": True, "message": "Sesi evolusi dihapus."}
