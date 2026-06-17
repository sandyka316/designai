"""Schemas untuk Genetic Algorithm Prompt Evolution."""
from __future__ import annotations

from pydantic import BaseModel, Field


class InitEvolveRequest(BaseModel):
    seed_prompt: str = Field(..., min_length=5, max_length=1000)
    population_size: int = Field(default=6, ge=3, le=8)


class BreedRequest(BaseModel):
    session_id: str
    selected_gene_ids: list[str] = Field(..., min_length=1)
    mutation_rate: float = Field(default=0.3, ge=0.0, le=1.0)


class PromptGeneResponse(BaseModel):
    id: str
    prompt: str
    generation: int
    parent_ids: list[str]
    fitness: float
    mutation_rate: float
    heuristic_score: float


class PopulationResponse(BaseModel):
    session_id: str
    generation_number: int
    original_prompt: str
    genes: list[PromptGeneResponse]
    best_fitness: float
    avg_fitness: float
    message: str = "OK"
