# Frontend Optimizer Page Design
**Date:** 2026-06-13  
**Route:** `/optimizer`  
**File:** `app/optimizer/page.tsx`

---

## Overview

A Linear Stepper page for the "Smart Optimizer" feature — a Genetic Algorithm-based prompt evolution tool. Users iteratively evolve AI image generation prompts through selection and breeding cycles.

---

## Architecture

Single `app/optimizer/page.tsx` file (`"use client"`). All state is co-located because steps are tightly interdependent. No sub-component files needed for this scope.

Backend: FastAPI at `http://localhost:8000`, routes under `/api/evolve/`.

---

## State Shape

```ts
sessionId: string | null
currentStep: 1 | 2 | 3
population: PopulationResponse | null
selectedGeneIds: string[]
mutationRate: number        // 0.0–1.0, default 0.3
populationSize: number      // 3–8, default 6
isLoading: boolean
error: string | null
```

---

## Step Indicator

Fixed below Navbar. Three steps with connector lines:

```
[✓ 1 Seed Prompt] ──── [● 2 Select & Breed] ──── [○ 3 Results]
```

- Active step: accent color highlight
- Completed step: checkmark ✓ + dimmed
- Pending step: grey circle

---

## Step 1 — Seed Prompt

**UI:**
- Large textarea (min 4 rows) — seed prompt input
- Slider: `population_size` (3–8), default 6 with label "Variants to generate"
- Primary button "Start Evolution →" — disabled when textarea empty or loading
- Loading state: spinner + "Generating {n} variants…"

**API:** `POST http://localhost:8000/api/evolve/init`  
Body: `{ seed_prompt: string, population_size: number }`  
On success → store `sessionId` + `population` → navigate to Step 2.  
On error → show inline error message.

---

## Step 2 — Select & Breed

**UI:**
- Header: `Generation {n}` badge + avg fitness indicator
- Responsive grid (2 cols md, 3 cols lg) of Gene Cards:
  - Prompt text (3-line clamp, expand on click)
  - Heuristic Score bar (0–1, color: green ≥0.7, yellow ≥0.4, red <0.4)
  - Mutation rate badge (shown only if > 0)
  - Selection checkbox (border highlights accent when selected)
- Mutation Rate slider (0.0–1.0, step 0.05), default 0.3
- "Breed Next Generation →" button — disabled if no gene selected or loading
- "← Back to Step 1" link (resets session)
- Loading: spinner + "Breeding generation {n+1}…"

**API:** `POST http://localhost:8000/api/evolve/breed`  
Body: `{ session_id, selected_gene_ids, mutation_rate }`  
On success → update `population` → navigate to Step 3.

---

## Step 3 — Results

**UI:**
- Header: `Generation {n} — New Offspring` + stats bar (Best fitness, Avg fitness)
- Same Gene Card grid as Step 2, with two extra actions per card:
  - "Copy" icon button → copies prompt to clipboard
  - "Use in Generator" button → `router.push('/generate?q=...')`
- Bottom CTA row:
  - "Breed Again" → moves Step 3 population back to Step 2 as new generation (loop)
  - "Start Over" → resets all state to Step 1

**No new API call.** Population from `/breed` response is displayed directly.

---

## Loop Behavior

"Breed Again" sets `currentStep = 2` with current `population` (Step 3 results). User selects genes from the new generation and breeds again. Iterations can repeat indefinitely.

---

## Error Handling

- Inline red error banner below step indicator
- Auto-dismiss on next action or manual close (×)
- Backend 503 → "Service temporarily unavailable, try again"
- Backend 404 → "Session expired. Starting over." + reset to Step 1

---

## Styling

Follows existing design system (`globals.css`):
- `var(--bg-primary/secondary/card)`, `var(--accent)`, `var(--border)`
- Font: Syne
- Card style: `rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]`
- Button primary: `btn-shimmer` class
- Consistent with `/generate` and `/recommendation` pages
