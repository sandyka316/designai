"""
Neural Network Rating Predictor Service
========================================
Prediksi apakah sebuah prompt akan menghasilkan desain yang bagus
sebelum di-generate, menggunakan MLPClassifier dari scikit-learn.

Feature vector (9 fitur):
  1. prompt_length          — panjang karakter (normalized)
  2. word_count             — jumlah kata (normalized)
  3. quality_keyword_count  — jumlah kata kunci kualitas
  4. style_keyword_count    — jumlah kata kunci style
  5. color_count            — jumlah warna yang disebutkan
  6. has_comma_structure    — punya struktur koma (0/1)
  7. avg_word_length        — rata-rata panjang kata
  8. specificity_score      — seberapa spesifik prompt (detail)
  9. positivity_score       — kata-kata positif/premium

Mode:
  - Cold start (< MIN_SAMPLES rated): gunakan rule-based heuristic
  - Trained mode (>= MIN_SAMPLES): gunakan MLPClassifier
"""

from __future__ import annotations

import os
import pickle
import re
from pathlib import Path
from typing import Literal

import numpy as np

# ──────────────────────────────────────────────────────────────────────────────
# Constants & Keyword Lists
# ──────────────────────────────────────────────────────────────────────────────

MIN_SAMPLES = 10  # minimum data rated sebelum NN dipakai

_MODEL_PATH = Path(__file__).parent.parent / "rating_model.pkl"

_QUALITY_KEYWORDS = [
    "masterpiece", "best quality", "highly detailed", "sharp focus",
    "8k", "4k", "studio lighting", "professional", "photorealistic",
    "cinematic", "hdr", "bokeh", "elegant", "ultra-realistic",
    "high resolution", "award winning", "intricate", "detailed",
]

_STYLE_KEYWORDS = [
    "minimalist", "luxury", "modern", "vintage", "abstract",
    "geometric", "organic", "futuristic", "industrial", "artisan",
    "premium", "sleek", "clean", "sophisticated", "artisanal",
    "editorial", "fashion", "contemporary",
]

_POSITIVE_KEYWORDS = [
    "beautiful", "stunning", "gorgeous", "premium", "luxury",
    "elegant", "refined", "perfect", "exquisite", "pristine",
    "impeccable", "superior", "high-end", "exclusive",
]

_SPECIFICITY_KEYWORDS = [
    "with", "made of", "texture", "pattern", "material",
    "color", "lighting", "shadow", "background", "foreground",
    "perspective", "angle", "detail", "featuring",
]

_COLOR_PATTERN = re.compile(
    r"\b(#[0-9A-Fa-f]{3,6}|"
    r"red|blue|green|yellow|purple|pink|gold|silver|white|black|"
    r"crimson|emerald|sapphire|amber|ivory|charcoal|teal|coral|"
    r"navy|burgundy|turquoise|lavender|beige|cream|rose)\b",
    re.IGNORECASE,
)

_LABEL_MAP: dict[int, str] = {
    1: "Kurang Bagus",
    2: "Cukup",
    3: "Bagus",
    4: "Sangat Bagus",
    5: "Luar Biasa",
}

_CONFIDENCE_LABELS: dict[str, str] = {
    "high": "Prediksi Tinggi",
    "medium": "Prediksi Sedang",
    "low": "Prediksi Rendah",
}


# ──────────────────────────────────────────────────────────────────────────────
# Feature Extraction
# ──────────────────────────────────────────────────────────────────────────────

def extract_features(prompt: str) -> list[float]:
    """
    Ekstrak 9 fitur numerik dari sebuah prompt.
    Returns: list[float] dengan panjang 9
    """
    p = prompt.strip()
    p_lower = p.lower()
    words = p.split()

    # 1. Panjang prompt (normalized ke 0–1, ideal 80-200 char)
    length = len(p)
    length_norm = min(1.0, length / 200.0)

    # 2. Word count (normalized, ideal 15-40 kata)
    word_count = len(words)
    word_count_norm = min(1.0, word_count / 40.0)

    # 3. Quality keywords count (normalized)
    q_count = sum(1 for kw in _QUALITY_KEYWORDS if kw in p_lower)
    q_norm = min(1.0, q_count / 5.0)

    # 4. Style keywords count (normalized)
    s_count = sum(1 for kw in _STYLE_KEYWORDS if kw in p_lower)
    s_norm = min(1.0, s_count / 3.0)

    # 5. Color mentions (normalized)
    color_count = len(_COLOR_PATTERN.findall(p))
    color_norm = min(1.0, color_count / 4.0)

    # 6. Comma structure (binary) — prompt yang bagus sering pakai koma
    has_comma = 1.0 if "," in p else 0.0

    # 7. Average word length (normalized)
    avg_word_len = (sum(len(w) for w in words) / len(words)) if words else 0.0
    avg_word_norm = min(1.0, avg_word_len / 10.0)

    # 8. Specificity score — kata-kata yang menunjukkan detail
    spec_count = sum(1 for kw in _SPECIFICITY_KEYWORDS if kw in p_lower)
    spec_norm = min(1.0, spec_count / 5.0)

    # 9. Positivity/premium score
    pos_count = sum(1 for kw in _POSITIVE_KEYWORDS if kw in p_lower)
    pos_norm = min(1.0, pos_count / 3.0)

    return [
        length_norm,
        word_count_norm,
        q_norm,
        s_norm,
        color_norm,
        has_comma,
        avg_word_norm,
        spec_norm,
        pos_norm,
    ]


# ──────────────────────────────────────────────────────────────────────────────
# Rule-Based Heuristic (Cold Start)
# ──────────────────────────────────────────────────────────────────────────────

def _heuristic_predict(prompt: str) -> dict:
    """
    Prediksi berbasis aturan ketika belum cukup data training.
    Return: {predicted_rating, confidence, label, reasoning, mode}
    """
    features = extract_features(prompt)
    (
        length_norm, word_count_norm, q_norm, s_norm,
        color_norm, has_comma, avg_word_norm, spec_norm, pos_norm
    ) = features

    # Weighted heuristic score
    score = (
        length_norm * 0.20 +
        word_count_norm * 0.10 +
        q_norm * 0.25 +
        s_norm * 0.20 +
        color_norm * 0.10 +
        has_comma * 0.05 +
        spec_norm * 0.10
    )

    # Map score ke rating 1-5
    if score >= 0.80:
        rating = 5
        confidence = 0.75
    elif score >= 0.60:
        rating = 4
        confidence = 0.65
    elif score >= 0.40:
        rating = 3
        confidence = 0.55
    elif score >= 0.20:
        rating = 2
        confidence = 0.50
    else:
        rating = 1
        confidence = 0.45

    # Reasoning
    strengths = []
    weaknesses = []

    if q_norm >= 0.4:
        strengths.append("kata kunci kualitas bagus")
    else:
        weaknesses.append("kurang kata kunci kualitas")

    if s_norm >= 0.3:
        strengths.append("style terdefinisi")
    else:
        weaknesses.append("style belum spesifik")

    if length_norm >= 0.4:
        strengths.append("prompt cukup detail")
    elif length_norm < 0.2:
        weaknesses.append("prompt terlalu singkat")

    if color_norm > 0:
        strengths.append("ada referensi warna")

    if strengths:
        reasoning = f"Kelebihan: {', '.join(strengths)}."
    else:
        reasoning = "Prompt masih bisa diperkaya."

    if weaknesses:
        reasoning += f" Saran: {', '.join(weaknesses)}."

    return {
        "predicted_rating": rating,
        "confidence": round(confidence, 3),
        "label": _LABEL_MAP[rating],
        "score": round(score, 4),
        "reasoning": reasoning,
        "mode": "heuristic",
    }


# ──────────────────────────────────────────────────────────────────────────────
# RatingPredictor Class
# ──────────────────────────────────────────────────────────────────────────────

class RatingPredictor:
    """
    Neural Network Rating Predictor menggunakan MLPClassifier.
    Otomatis fall back ke heuristic jika belum cukup training data.
    """

    def __init__(self, model_path: Path = _MODEL_PATH):
        self.model_path = model_path
        self.model = None          # MLPClassifier
        self.scaler = None         # StandardScaler
        self.trained_samples = 0   # jumlah sampel yang sudah di-train
        self._load_model()

    def _load_model(self) -> None:
        """Load model dari disk jika ada."""
        if self.model_path.exists():
            try:
                with open(self.model_path, "rb") as f:
                    saved = pickle.load(f)
                self.model = saved.get("model")
                self.scaler = saved.get("scaler")
                self.trained_samples = saved.get("trained_samples", 0)
                print(f"[RatingPredictor] Loaded model with {self.trained_samples} samples.")
            except Exception as e:
                print(f"[RatingPredictor] Failed to load model: {e}")
                self.model = None
                self.scaler = None
                self.trained_samples = 0

    def _save_model(self) -> None:
        """Simpan model ke disk."""
        try:
            with open(self.model_path, "wb") as f:
                pickle.dump({
                    "model": self.model,
                    "scaler": self.scaler,
                    "trained_samples": self.trained_samples,
                }, f)
            print(f"[RatingPredictor] Model saved ({self.trained_samples} samples).")
        except Exception as e:
            print(f"[RatingPredictor] Failed to save model: {e}")

    def predict(self, prompt: str) -> dict:
        """
        Prediksi rating untuk sebuah prompt.

        Returns:
            {
              predicted_rating: int (1-5),
              confidence: float (0.0-1.0),
              label: str,
              score: float,
              reasoning: str,
              mode: "heuristic" | "neural_network"
            }
        """
        # Gunakan heuristic jika belum cukup data
        if self.model is None or self.trained_samples < MIN_SAMPLES:
            result = _heuristic_predict(prompt)
            if self.trained_samples > 0:
                result["reasoning"] += f" (model butuh {MIN_SAMPLES - self.trained_samples} data lagi untuk training NN)"
            else:
                result["reasoning"] += " (mode heuristik — belum ada data rating)"
            return result

        try:
            # Neural Network prediction
            features = extract_features(prompt)
            X = np.array([features])
            X_scaled = self.scaler.transform(X)

            # Prediksi kelas (1-5)
            predicted_class = self.model.predict(X_scaled)[0]
            probas = self.model.predict_proba(X_scaled)[0]

            # Confidence = probabilitas kelas yang diprediksi
            class_idx = list(self.model.classes_).index(predicted_class)
            confidence = float(probas[class_idx])

            # Reasoning berdasarkan top features
            feature_names = [
                "detail prompt", "jumlah kata", "kata kunci kualitas",
                "kata kunci style", "referensi warna", "struktur koma",
                "panjang kata", "kekhususan", "kata premium"
            ]
            feat_vals = extract_features(prompt)
            top_feat_idx = sorted(range(len(feat_vals)), key=lambda i: -feat_vals[i])[:3]
            top_feats = [feature_names[i] for i in top_feat_idx if feat_vals[i] > 0.3]

            if top_feats:
                reasoning = f"Prompt memiliki {', '.join(top_feats)} yang baik."
            else:
                reasoning = "Prompt masih bisa diperkaya dengan lebih banyak detail."

            if confidence < 0.5:
                reasoning += " (prediksi kurang pasti — coba perjelas prompt)"

            return {
                "predicted_rating": int(predicted_class),
                "confidence": round(confidence, 3),
                "label": _LABEL_MAP.get(int(predicted_class), "Tidak Diketahui"),
                "score": round(float(np.dot(probas, self.model.classes_)), 4),
                "reasoning": reasoning,
                "mode": "neural_network",
            }

        except Exception as e:
            print(f"[RatingPredictor] NN prediction failed: {e}, falling back to heuristic")
            return _heuristic_predict(prompt)

    def train(self, training_data: list[dict]) -> bool:
        """
        Train atau retrain model dengan data baru.

        Args:
            training_data: list of {"prompt": str, "rating": int}

        Returns:
            True jika training berhasil
        """
        from sklearn.neural_network import MLPClassifier
        from sklearn.preprocessing import StandardScaler

        if len(training_data) < MIN_SAMPLES:
            print(f"[RatingPredictor] Not enough data: {len(training_data)}/{MIN_SAMPLES}")
            return False

        try:
            X = np.array([extract_features(d["prompt"]) for d in training_data])
            y = np.array([d["rating"] for d in training_data])

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Train MLP
            # Hidden layers: 2 layer (18, 9) — proporsional dengan 9 fitur input
            model = MLPClassifier(
                hidden_layer_sizes=(18, 9),
                activation="relu",
                solver="adam",
                max_iter=500,
                random_state=42,
                early_stopping=True,
                validation_fraction=0.2 if len(training_data) >= 20 else 0.0,
                n_iter_no_change=20,
                alpha=0.001,  # L2 regularization
            )
            model.fit(X_scaled, y)

            self.model = model
            self.scaler = scaler
            self.trained_samples = len(training_data)
            self._save_model()

            print(f"[RatingPredictor] Trained on {len(training_data)} samples. Classes: {model.classes_}")
            return True

        except Exception as e:
            print(f"[RatingPredictor] Training failed: {e}")
            return False

    @property
    def is_trained(self) -> bool:
        return self.model is not None and self.trained_samples >= MIN_SAMPLES

    @property
    def needs_more_data(self) -> int:
        """Berapa data lagi yang dibutuhkan untuk train."""
        return max(0, MIN_SAMPLES - self.trained_samples)


# ── Singleton instance ──────────────────────────────────────────────────────
_predictor: RatingPredictor | None = None


def get_predictor() -> RatingPredictor:
    """Ambil singleton RatingPredictor (lazy init)."""
    global _predictor
    if _predictor is None:
        _predictor = RatingPredictor()
    return _predictor
