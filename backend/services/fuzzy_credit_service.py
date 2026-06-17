"""
Fuzzy Logic Credit Scoring Service
===================================
Memberikan bonus kredit kepada user berdasarkan aktivitas mereka.
Sistem ini "fuzzy" — tidak kaku (bukan if/else biasa), tapi menggunakan
membership functions untuk menentukan seberapa "aktif" seorang user.

Fuzzy Sets untuk "Activity Level":
  - kurang_aktif   : 0–5 generasi/minggu
  - cukup_aktif    : 3–12 generasi/minggu
  - sangat_aktif   : 10–20+ generasi/minggu

Output Bonus Kredit (defuzzified):
  - Minimal : 0 kredit
  - Sedang  : 5 kredit
  - Besar   : 15 kredit
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Literal


# ──────────────────────────────────────────────────────────────────────────────
# Data classes
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class ActivityMetrics:
    """Metrik aktivitas user yang dipakai sebagai input fuzzy."""
    generations_this_week: int       # jumlah generate 7 hari terakhir
    success_rate: float              # 0.0 – 1.0
    avg_prompt_length: float         # rata-rata panjang prompt (karakter)
    days_since_last_gen: int         # hari sejak generate terakhir


@dataclass
class FuzzyCreditResult:
    """Hasil scoring fuzzy."""
    bonus_credits: int
    activity_label: Literal["tidak_aktif", "kurang_aktif", "cukup_aktif", "sangat_aktif"]
    activity_score: float            # 0.0 – 1.0 (skor akhir setelah defuzzifikasi)
    membership: dict[str, float]     # derajat keanggotaan tiap kategori
    reasoning: str                   # penjelasan human-readable


# ──────────────────────────────────────────────────────────────────────────────
# Membership Functions (trapezoid & triangle)
# ──────────────────────────────────────────────────────────────────────────────

def _trimf(x: float, a: float, b: float, c: float) -> float:
    """
    Triangle membership function.
    Naik dari a ke b, turun dari b ke c.
    """
    if x <= a or x >= c:
        return 0.0
    if x <= b:
        return (x - a) / (b - a)
    return (c - x) / (c - b)


def _trapmf(x: float, a: float, b: float, c: float, d: float) -> float:
    """
    Trapezoid membership function.
    Naik dari a ke b, datar dari b ke c, turun dari c ke d.
    """
    if x <= a or x >= d:
        return 0.0
    if x <= b:
        return (x - a) / (b - a) if b != a else 1.0
    if x <= c:
        return 1.0
    return (d - x) / (d - c) if d != c else 1.0


# ──────────────────────────────────────────────────────────────────────────────
# Fuzzy Input Membership (Generations per Week)
# ──────────────────────────────────────────────────────────────────────────────

def _membership_tidak_aktif(gen_week: float) -> float:
    """0–3 generasi/minggu → tidak aktif."""
    return _trapmf(gen_week, 0, 0, 1, 4)


def _membership_kurang_aktif(gen_week: float) -> float:
    """2–7 generasi/minggu → kurang aktif."""
    return _trimf(gen_week, 2, 5, 9)


def _membership_cukup_aktif(gen_week: float) -> float:
    """6–15 generasi/minggu → cukup aktif."""
    return _trimf(gen_week, 6, 10, 16)


def _membership_sangat_aktif(gen_week: float) -> float:
    """12+ generasi/minggu → sangat aktif."""
    return _trapmf(gen_week, 12, 16, 9999, 9999)


# ──────────────────────────────────────────────────────────────────────────────
# Modifier: Success Rate & Prompt Quality boost/cut
# ──────────────────────────────────────────────────────────────────────────────

def _quality_modifier(success_rate: float, avg_prompt_len: float) -> float:
    """
    Modifier 0.5 – 1.5 berdasarkan kualitas prompt dan success rate.
    - Success rate tinggi → bonus naik
    - Prompt panjang (>80 char) → sedikit bonus (user lebih serius)
    - Prompt sangat pendek (<20 char) → dikurangi
    """
    sr_score = 0.5 + success_rate  # 0.5 – 1.5
    length_score = 1.0
    if avg_prompt_len >= 80:
        length_score = 1.2
    elif avg_prompt_len >= 40:
        length_score = 1.0
    else:
        length_score = 0.85
    return min(1.5, sr_score * length_score)


def _recency_modifier(days_since: int) -> float:
    """
    Modifier 0.3 – 1.0 berdasarkan seberapa baru user generate.
    User yang lama tidak generate mendapat pengurangan.
    """
    if days_since <= 1:
        return 1.0
    if days_since <= 3:
        return 0.9
    if days_since <= 7:
        return 0.75
    if days_since <= 14:
        return 0.5
    return 0.3


# ──────────────────────────────────────────────────────────────────────────────
# Defuzzification (Centroid / Weighted Average)
# ──────────────────────────────────────────────────────────────────────────────

def _defuzzify(memberships: dict[str, float]) -> float:
    """
    Centroid defuzzification.
    Output values (crisp centers) untuk tiap fuzzy set:
      tidak_aktif  → 0.0
      kurang_aktif → 0.25
      cukup_aktif  → 0.6
      sangat_aktif → 1.0
    """
    centers = {
        "tidak_aktif": 0.0,
        "kurang_aktif": 0.25,
        "cukup_aktif": 0.6,
        "sangat_aktif": 1.0,
    }
    numerator = sum(memberships[k] * centers[k] for k in centers)
    denominator = sum(memberships.values())
    if denominator == 0:
        return 0.0
    return numerator / denominator


# ──────────────────────────────────────────────────────────────────────────────
# Main Scoring Function
# ──────────────────────────────────────────────────────────────────────────────

def compute_fuzzy_credits(metrics: ActivityMetrics) -> FuzzyCreditResult:
    """
    Hitung bonus kredit menggunakan fuzzy logic.

    Args:
        metrics: ActivityMetrics object dengan data aktivitas user

    Returns:
        FuzzyCreditResult dengan bonus_credits dan penjelasan
    """
    gen = float(metrics.generations_this_week)

    # Step 1: Fuzzifikasi (hitung derajat keanggotaan)
    membership = {
        "tidak_aktif": _membership_tidak_aktif(gen),
        "kurang_aktif": _membership_kurang_aktif(gen),
        "cukup_aktif": _membership_cukup_aktif(gen),
        "sangat_aktif": _membership_sangat_aktif(gen),
    }

    # Step 2: Defuzzifikasi → activity score 0–1
    activity_score = _defuzzify(membership)

    # Step 3: Apply modifiers
    quality_mod = _quality_modifier(metrics.success_rate, metrics.avg_prompt_length)
    recency_mod = _recency_modifier(metrics.days_since_last_gen)
    final_score = min(1.0, activity_score * quality_mod * recency_mod)

    # Step 4: Map score ke bonus kredit
    #   0.0 – 0.15 → 0 kredit
    #   0.15 – 0.35 → 2 kredit
    #   0.35 – 0.55 → 5 kredit
    #   0.55 – 0.75 → 10 kredit
    #   0.75 – 1.0  → 15 kredit
    if final_score < 0.15:
        bonus = 0
    elif final_score < 0.35:
        bonus = 2
    elif final_score < 0.55:
        bonus = 5
    elif final_score < 0.75:
        bonus = 10
    else:
        bonus = 15

    # Step 5: Tentukan label dominan
    dominant = max(membership, key=lambda k: membership[k])
    label_map = {
        "tidak_aktif": "tidak_aktif",
        "kurang_aktif": "kurang_aktif",
        "cukup_aktif": "cukup_aktif",
        "sangat_aktif": "sangat_aktif",
    }
    activity_label = label_map[dominant]  # type: ignore[assignment]

    # Step 6: Reasoning
    label_indonesian = {
        "tidak_aktif": "Tidak Aktif",
        "kurang_aktif": "Kurang Aktif",
        "cukup_aktif": "Cukup Aktif",
        "sangat_aktif": "Sangat Aktif",
    }
    dominant_label = label_indonesian[dominant]
    top_memberships = sorted(membership.items(), key=lambda x: -x[1])[:2]
    membership_desc = ", ".join(
        f"{label_indonesian[k]}: {v:.0%}" for k, v in top_memberships if v > 0
    )

    if bonus == 0:
        reasoning = (
            f"Aktivitas kamu minggu ini masih rendah ({metrics.generations_this_week} generate). "
            f"Generate lebih sering untuk mendapatkan bonus kredit!"
        )
    elif bonus <= 5:
        reasoning = (
            f"Kamu dinilai sebagai user '{dominant_label}' ({membership_desc}). "
            f"Tingkatkan frekuensi generate untuk bonus lebih besar."
        )
    else:
        reasoning = (
            f"Kamu adalah user '{dominant_label}'! ({membership_desc}). "
            f"Aktivitas tinggi kamu dihargai dengan {bonus} kredit bonus."
        )

    return FuzzyCreditResult(
        bonus_credits=bonus,
        activity_label=activity_label,
        activity_score=round(final_score, 4),
        membership={k: round(v, 4) for k, v in membership.items()},
        reasoning=reasoning,
    )


def get_activity_breakdown(metrics: ActivityMetrics) -> dict:
    """
    Kembalikan breakdown lengkap untuk UI visualization (radar/bar chart).
    """
    result = compute_fuzzy_credits(metrics)
    return {
        "bonus_credits": result.bonus_credits,
        "activity_label": result.activity_label,
        "activity_score": result.activity_score,
        "membership": result.membership,
        "reasoning": result.reasoning,
        "modifiers": {
            "quality": round(_quality_modifier(metrics.success_rate, metrics.avg_prompt_length), 3),
            "recency": round(_recency_modifier(metrics.days_since_last_gen), 3),
        },
        "input_metrics": {
            "generations_this_week": metrics.generations_this_week,
            "success_rate": metrics.success_rate,
            "avg_prompt_length": metrics.avg_prompt_length,
            "days_since_last_gen": metrics.days_since_last_gen,
        },
    }
