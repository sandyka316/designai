"""
lstm_service.py — LSTM-based Prompt Suggestion
================================================
Menggunakan LSTM (Long Short-Term Memory) untuk mempelajari pola dari
histori prompt user, lalu memberikan saran/variasi prompt berikutnya.

Architecture:
- Character-level LSTM (tidak butuh dataset eksternal)
- Train on-the-fly dari histori prompt yang ada di database
- Generate suggestions berdasarkan partial prompt input
"""

from __future__ import annotations

import logging
import random
import re
from collections import Counter
from typing import Optional

import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)

# ── LSTM Model Definition ────────────────────────────────────────────────────

class PromptLSTM(nn.Module):
    """Character-level LSTM untuk prompt generation."""

    def __init__(self, vocab_size: int, embed_dim: int = 64, hidden_dim: int = 128, num_layers: int = 2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim,
            hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3 if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x: torch.Tensor, hidden=None):
        embed = self.dropout(self.embedding(x))
        out, hidden = self.lstm(embed, hidden)
        out = self.dropout(out)
        logits = self.fc(out)
        return logits, hidden

    def init_hidden(self, batch_size: int = 1):
        return (
            torch.zeros(self.num_layers, batch_size, self.hidden_dim),
            torch.zeros(self.num_layers, batch_size, self.hidden_dim),
        )


# ── Vocab & Tokenizer ────────────────────────────────────────────────────────

class CharVocab:
    """Character-level vocabulary."""

    PAD = 0
    UNK = 1

    def __init__(self):
        self.char2idx: dict[str, int] = {"<PAD>": 0, "<UNK>": 1}
        self.idx2char: dict[int, str] = {0: "<PAD>", 1: "<UNK>"}

    def build(self, texts: list[str]) -> None:
        chars = set()
        for text in texts:
            chars.update(text.lower())
        for i, ch in enumerate(sorted(chars), start=2):
            self.char2idx[ch] = i
            self.idx2char[i] = ch

    def encode(self, text: str) -> list[int]:
        return [self.char2idx.get(ch, self.UNK) for ch in text.lower()]

    def decode(self, indices: list[int]) -> str:
        return "".join(self.idx2char.get(i, "?") for i in indices if i not in (self.PAD,))

    @property
    def size(self) -> int:
        return len(self.char2idx)


# ── Trainer ─────────────────────────────────────────────────────────────────

class LSTMTrainer:
    """Train LSTM pada histori prompt, lalu generate suggestions."""

    def __init__(self):
        self.vocab = CharVocab()
        self.model: Optional[PromptLSTM] = None
        self.is_trained = False
        self.train_prompts: list[str] = []

    def train(self, prompts: list[str], epochs: int = 30, seq_len: int = 40) -> dict:
        """
        Train model LSTM dari kumpulan prompt.

        Args:
            prompts: list prompt dari histori user
            epochs: jumlah epoch training
            seq_len: panjang sequence untuk training
        """
        if not prompts:
            return {"success": False, "message": "Tidak ada prompt untuk training."}

        # Filter prompt yang valid (tidak terlalu pendek, bukan enhanced)
        clean = [p.strip().lower() for p in prompts if 5 <= len(p) <= 120]
        if not clean:
            return {"success": False, "message": "Tidak ada prompt valid (5–120 karakter)."}

        self.train_prompts = clean
        logger.info(f"[LSTM] Training on {len(clean)} prompts...")

        # Build vocabulary
        self.vocab.build(clean)

        # Gabungkan semua prompt jadi satu corpus
        corpus = " | ".join(clean) + " | "
        encoded = self.vocab.encode(corpus)

        if len(encoded) < seq_len + 1:
            return {"success": False, "message": f"Data terlalu sedikit (hanya {len(encoded)} karakter setelah encoding)."}

        # Build training sequences
        X, Y = [], []
        for i in range(len(encoded) - seq_len):
            X.append(encoded[i : i + seq_len])
            Y.append(encoded[i + 1 : i + seq_len + 1])

        X_tensor = torch.tensor(X, dtype=torch.long)
        Y_tensor = torch.tensor(Y, dtype=torch.long)

        # Buat model
        self.model = PromptLSTM(
            vocab_size=self.vocab.size,
            embed_dim=64,
            hidden_dim=128,
            num_layers=2,
        )
        self.model.train()

        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.003)
        criterion = nn.CrossEntropyLoss(ignore_index=CharVocab.PAD)

        # Training loop
        batch_size = min(32, len(X_tensor))
        losses = []

        for epoch in range(epochs):
            # Shuffle
            perm = torch.randperm(len(X_tensor))
            epoch_loss = 0.0
            n_batches = 0

            for start in range(0, len(X_tensor), batch_size):
                batch_idx = perm[start : start + batch_size]
                xb = X_tensor[batch_idx]
                yb = Y_tensor[batch_idx]

                optimizer.zero_grad()
                logits, _ = self.model(xb)
                # logits: [B, T, V]  →  reshape untuk CrossEntropyLoss
                loss = criterion(
                    logits.reshape(-1, self.vocab.size),
                    yb.reshape(-1),
                )
                loss.backward()
                nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                optimizer.step()

                epoch_loss += loss.item()
                n_batches += 1

            avg_loss = epoch_loss / max(n_batches, 1)
            losses.append(avg_loss)

            if (epoch + 1) % 10 == 0:
                logger.info(f"[LSTM] Epoch {epoch+1}/{epochs} — loss={avg_loss:.4f}")

        self.model.eval()
        self.is_trained = True

        logger.info(f"[LSTM] Training complete. Final loss={losses[-1]:.4f}")
        return {
            "success": True,
            "vocab_size": self.vocab.size,
            "train_prompts": len(clean),
            "corpus_length": len(encoded),
            "epochs": epochs,
            "final_loss": round(losses[-1], 4),
            "initial_loss": round(losses[0], 4),
        }

    def generate(
        self,
        seed_text: str = "",
        max_len: int = 80,
        temperature: float = 0.8,
        num_suggestions: int = 5,
    ) -> list[str]:
        """
        Generate prompt suggestions berdasarkan seed text.

        Args:
            seed_text: awal prompt (bisa kosong = random)
            max_len: panjang max suggestion yang dihasilkan
            temperature: kreativitas (0.5=konservatif, 1.0=kreatif)
            num_suggestions: jumlah variasi yang dihasilkan
        """
        if not self.is_trained or self.model is None:
            return []

        suggestions = set()
        attempts = 0

        while len(suggestions) < num_suggestions and attempts < num_suggestions * 3:
            attempts += 1

            # Pilih seed: pakai input atau ambil random dari training data
            if seed_text.strip():
                seed = seed_text.strip().lower()
            else:
                seed = random.choice(self.train_prompts)[:20]

            generated = self._generate_one(seed, max_len, temperature)

            # Bersihkan hasil
            clean = self._clean_suggestion(generated, seed_text)
            if clean and len(clean) >= 10 and clean not in suggestions:
                suggestions.add(clean)

        result = list(suggestions)[:num_suggestions]

        # Jika LSTM tidak menghasilkan cukup, tambahkan rule-based fallback
        if len(result) < num_suggestions:
            fallback = self._rule_based_suggestions(seed_text, num_suggestions - len(result))
            result.extend(fallback)

        return result[:num_suggestions]

    def _generate_one(self, seed: str, max_len: int, temperature: float) -> str:
        """Generate satu suggestion dari seed text."""
        self.model.eval()

        encoded = self.vocab.encode(seed)
        if not encoded:
            encoded = [self.vocab.UNK]

        generated = list(seed)
        input_tensor = torch.tensor([encoded], dtype=torch.long)

        with torch.no_grad():
            hidden = self.model.init_hidden(1)

            # Feed seed ke model
            if len(encoded) > 1:
                _, hidden = self.model(input_tensor[:, :-1], hidden)

            # Generate karakter berikutnya
            x = input_tensor[:, -1:]

            for _ in range(max_len):
                logits, hidden = self.model(x, hidden)
                logits = logits[:, -1, :] / temperature  # [1, V]

                # Sample dari distribusi
                probs = torch.softmax(logits, dim=-1).squeeze()
                next_idx = torch.multinomial(probs, 1).item()

                next_char = self.vocab.idx2char.get(next_idx, "")

                # Stop di separator
                if next_char in ("|", "\n"):
                    break

                generated.append(next_char)
                x = torch.tensor([[next_idx]], dtype=torch.long)

        return "".join(generated)

    def _clean_suggestion(self, text: str, seed: str) -> str:
        """Bersihkan dan format suggestion."""
        # Ambil hanya teks setelah seed
        if seed and text.lower().startswith(seed.lower()):
            full = text
        else:
            full = text

        # Hapus karakter aneh
        clean = re.sub(r"[^\w\s,.:;!?'-]", "", full)
        clean = re.sub(r"\s+", " ", clean).strip()

        # Capitalize first letter
        if clean:
            clean = clean[0].upper() + clean[1:]

        return clean

    def _rule_based_suggestions(self, seed: str, n: int) -> list[str]:
        """Fallback rule-based suggestions jika LSTM kurang."""
        styles = ["minimalist", "futuristic", "vintage", "elegant", "cyberpunk", "modern"]
        colors = ["navy blue", "emerald green", "gold", "white", "dark"]
        mediums = ["on canvas", "digital art", "watercolor", "3D render"]
        moods = ["with dramatic lighting", "high resolution", "ultra detailed", "premium quality"]

        base = seed.strip() if seed.strip() else random.choice(self.train_prompts) if self.train_prompts else "design"

        results = []
        for i in range(n):
            style = random.choice(styles)
            color = random.choice(colors)
            medium = random.choice(mediums)
            mood = random.choice(moods)
            suggestion = f"{base}, {style} style, {color} color, {medium}, {mood}"
            results.append(suggestion[:120])

        return results


# ── Global trainer singleton ─────────────────────────────────────────────────

_trainer: Optional[LSTMTrainer] = None


def get_trainer() -> LSTMTrainer:
    """Ambil atau buat LSTMTrainer singleton."""
    global _trainer
    if _trainer is None:
        _trainer = LSTMTrainer()
    return _trainer


def train_on_prompts(prompts: list[str]) -> dict:
    """Train LSTM dari list prompt. Dipanggil dari route."""
    trainer = get_trainer()
    return trainer.train(prompts)


def suggest_prompts(
    seed_text: str = "",
    num_suggestions: int = 5,
    temperature: float = 0.8,
) -> dict:
    """
    Generate prompt suggestions.

    Returns:
        {
            "suggestions": list[str],
            "is_trained": bool,
            "seed": str,
            "model": str,
        }
    """
    trainer = get_trainer()

    if not trainer.is_trained:
        return {
            "suggestions": [],
            "is_trained": False,
            "seed": seed_text,
            "model": "LSTM-char-level",
            "message": "Model belum ditraining. Klik 'Train Model' terlebih dahulu.",
        }

    suggestions = trainer.generate(
        seed_text=seed_text,
        max_len=80,
        temperature=temperature,
        num_suggestions=num_suggestions,
    )

    return {
        "suggestions": suggestions,
        "is_trained": True,
        "seed": seed_text,
        "model": "LSTM-char-level",
        "message": f"Generated {len(suggestions)} suggestions.",
    }


def get_training_status() -> dict:
    """Kembalikan status training model saat ini."""
    trainer = get_trainer()
    return {
        "is_trained": trainer.is_trained,
        "train_prompts_count": len(trainer.train_prompts),
        "vocab_size": trainer.vocab.size,
        "model": "LSTM-char-level (2 layers, hidden=128)",
    }
