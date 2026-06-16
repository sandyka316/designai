"use client";

import { useState, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Dna,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  Info,
  Trophy,
  Heart,
  ArrowRight,
  Zap,
  GitMerge,
  Shuffle,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

// ─── GENETIC ALGORITHM ENGINE ─────────────────────────────────────────────────
const STYLE_GENES = ["minimalist","futuristic","elegant","bold","vibrant","dark","light","vintage","modern","artistic","professional","playful","luxury","clean","dramatic"];
const MEDIUM_GENES = ["photography","illustration","3D render","flat design","watercolor","oil painting","digital art","sketch","vector art","cinematic"];
const LIGHTING_GENES = ["soft studio lighting","dramatic shadows","golden hour","neon glow","natural daylight","high contrast","backlit","diffused light","candlelight","rim lighting"];
const QUALITY_GENES = ["8K ultra HD","highly detailed","sharp focus","professional quality","masterpiece","award-winning","photorealistic","crystal clear","ultra sharp","stunning"];
const COMPOSITION_GENES = ["centered composition","rule of thirds","symmetrical","dynamic angle","close-up","wide shot","bird's eye view","macro shot","panoramic","portrait orientation"];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateVariant(basePrompt: string): string {
  const style = randomFrom(STYLE_GENES);
  const medium = randomFrom(MEDIUM_GENES);
  const lighting = randomFrom(LIGHTING_GENES);
  const quality = randomFrom(QUALITY_GENES);
  const composition = randomFrom(COMPOSITION_GENES);
  const parts = [basePrompt.trim(), `${style} style`, medium, lighting, composition, `(${quality}, masterpiece, best quality)`];
  const middle = parts.slice(1, -1);
  for (let i = middle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [middle[i], middle[j]] = [middle[j], middle[i]];
  }
  return [parts[0], ...middle, parts[parts.length - 1]].join(", ");
}

function crossover(parent1: string, parent2: string): string {
  const words1 = parent1.split(", ");
  const words2 = parent2.split(", ");
  const cutPoint1 = Math.floor(words1.length / 2);
  const cutPoint2 = Math.ceil(words2.length / 2);
  return [...words1.slice(0, cutPoint1), ...words2.slice(cutPoint2)].join(", ");
}

function scorePrompt(prompt: string): number {
  let score = 50;
  const lower = prompt.toLowerCase();
  if (lower.includes("8k") || lower.includes("ultra hd")) score += 10;
  if (lower.includes("highly detailed")) score += 8;
  if (lower.includes("masterpiece")) score += 7;
  if (lower.includes("sharp focus")) score += 6;
  if (lower.includes("photorealistic")) score += 8;
  score += STYLE_GENES.filter(s => lower.includes(s)).length * 3;
  score += LIGHTING_GENES.filter(l => lower.includes(l)).length * 4;
  score += MEDIUM_GENES.filter(m => lower.includes(m)).length * 3;
  score += COMPOSITION_GENES.filter(c => lower.includes(c)).length * 4;
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount < 5) score -= 20;
  if (wordCount > 80) score -= 10;
  score += Math.floor(Math.random() * 8) - 4;
  return Math.min(100, Math.max(0, score));
}

interface Individual { id: string; prompt: string; score: number; selected: boolean; generation: number; }

// ─── HELPER ───────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 16, g: 185, b: 129 };
}

// ─── GLOW CARD ────────────────────────────────────────────────
function GlowCard({ children, color, className = "" }: { children: React.ReactNode; color: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, op: 0 });
  const [hovered, setHovered] = useState(false);
  const { r, g, b } = hexToRgb(color);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, op: 1 });
  };
  return (
    <div ref={ref} onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, op: 0 })); }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: hovered ? `linear-gradient(145deg,${rgba(0.10)} 0%,var(--bg-card) 50%,${rgba(0.05)} 100%)` : "var(--bg-card)",
        border: hovered ? `2px solid ${rgba(0.68)}` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-5px) scale(1.015)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered ? `0 0 0 1px ${rgba(0.25)},0 8px 24px rgba(0,0,0,0.35),0 20px 60px ${rgba(0.22)},0 0 80px ${rgba(0.10)}` : "0 1px 4px rgba(0,0,0,0.2)",
      }}>
      <div className="pointer-events-none absolute inset-0" style={{ opacity: mouse.op, transition: "opacity 0.15s ease", background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px,${rgba(0.22)},${rgba(0.05)} 50%,transparent 70%)` }} />
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300" style={{ height: hovered ? "3px" : "0px", opacity: hovered ? 1 : 0, background: `linear-gradient(90deg,transparent,${rgba(1)} 30%,${rgba(0.8)} 70%,transparent)`, boxShadow: hovered ? `0 0 14px ${rgba(0.9)},0 0 28px ${rgba(0.5)}` : "none" }} />
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300" style={{ width: hovered ? "3px" : "0px", opacity: hovered ? 0.9 : 0, background: `linear-gradient(180deg,${rgba(1)},${rgba(0.5)} 60%,transparent)` }} />
      <div className="pointer-events-none absolute top-0 left-0 w-36 h-36 transition-opacity" style={{ opacity: hovered ? 0.85 : 0, background: `radial-gradient(circle at 0% 0%,${rgba(0.38)},transparent 65%)` }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-36 h-36 transition-opacity" style={{ opacity: hovered ? 0.65 : 0, background: `radial-gradient(circle at 100% 100%,${rgba(0.28)},transparent 65%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── INDIVIDUAL CARD dengan hover effect ──────────────────────
function IndividualCard({
  ind, idx, isSelected, isBest, onToggle, onCopy, onUse, copiedId,
}: {
  ind: Individual; idx: number; isSelected: boolean; isBest: boolean;
  onToggle: () => void; onCopy: (p: string, id: string) => void;
  onUse: (p: string) => void; copiedId: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, op: 0 });
  const [hovered, setHovered] = useState(false);

  const color = isSelected ? "#10b981" : isBest ? "#f59e0b" : "#6366f1";
  const { r, g, b } = hexToRgb(color);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  const scoreColor = ind.score >= 80 ? "#10b981" : ind.score >= 65 ? "#6366f1" : ind.score >= 50 ? "#f59e0b" : "#ef4444";

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, op: 1 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, op: 0 })); }}
      onClick={onToggle}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: isSelected
          ? `linear-gradient(145deg,rgba(16,185,129,0.08),var(--bg-card))`
          : hovered ? `linear-gradient(145deg,${rgba(0.08)},var(--bg-card))` : "var(--bg-card)",
        border: isSelected
          ? `2px solid rgba(16,185,129,0.55)`
          : hovered ? `2px solid ${rgba(0.55)}` : isBest ? `1.5px solid rgba(245,158,11,0.3)` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.28s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: isSelected
          ? `0 0 0 1px rgba(16,185,129,0.2),0 6px 18px rgba(0,0,0,0.3),0 0 40px rgba(16,185,129,0.1)`
          : hovered ? `0 0 0 1px ${rgba(0.15)},0 4px 14px rgba(0,0,0,0.25)` : "0 1px 3px rgba(0,0,0,0.15)",
        padding: "1rem",
      }}
    >
      {/* Spotlight */}
      <div className="pointer-events-none absolute inset-0" style={{ opacity: mouse.op, transition: "opacity 0.15s ease", background: `radial-gradient(220px circle at ${mouse.x}px ${mouse.y}px,${rgba(0.18)},transparent 65%)` }} />
      {/* Top bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: isSelected || hovered ? "2.5px" : "0px", opacity: isSelected || hovered ? 1 : 0, background: isSelected ? "linear-gradient(90deg,transparent,rgba(16,185,129,1) 30%,rgba(16,185,129,0.8) 70%,transparent)" : `linear-gradient(90deg,transparent,${rgba(1)} 30%,${rgba(0.8)} 70%,transparent)`, boxShadow: isSelected ? "0 0 10px rgba(16,185,129,0.8),0 0 20px rgba(16,185,129,0.4)" : "none" }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {isBest && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy size={9} /> Best
            </span>
          )}
          <span className="text-[10px] text-[var(--text-dim)]">Individual #{idx + 1}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}30` }}>
            <Zap size={9} />
            {ind.score}/100
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-[var(--border)]"}`}
            style={{ boxShadow: isSelected ? "0 0 8px rgba(16,185,129,0.6)" : "none" }}>
            {isSelected && <Heart size={10} className="text-white fill-white" />}
          </div>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3 line-clamp-3">{ind.prompt}</p>

        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${ind.score}%`, background: scoreColor, boxShadow: hovered ? `0 0 6px ${scoreColor}80` : "none" }} />
        </div>

        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => onCopy(ind.prompt, ind.id)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/30 transition-all">
            {copiedId === ind.id ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
          </button>
          <button onClick={() => onUse(ind.prompt)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-all">
            <Sparkles size={11} />
            Use in Generator
            <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PromptEvolutionPage() {
  const router = useRouter();
  const [basePrompt, setBasePrompt] = useState("A product design for a coffee brand");
  const [population, setPopulation] = useState<Individual[]>([]);
  const [generation, setGeneration] = useState(0);
  const [isEvolving, setIsEvolving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ gen: number; best: number }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initPopulation = useCallback(() => {
    if (!basePrompt.trim()) return;
    setIsEvolving(true);
    setGeneration(0);
    setSelectedIds(new Set());
    setHistory([]);
    setTimeout(() => {
      const pop: Individual[] = Array.from({ length: 6 }, (_, i) => {
        const prompt = generateVariant(basePrompt);
        return { id: `gen0-${i}`, prompt, score: scorePrompt(prompt), selected: false, generation: 0 };
      });
      pop.sort((a, b) => b.score - a.score);
      setPopulation(pop);
      setHistory([{ gen: 0, best: pop[0].score }]);
      setIsEvolving(false);
    }, 800);
  }, [basePrompt]);

  const evolve = useCallback(() => {
    if (selectedIds.size === 0) return;
    setIsEvolving(true);
    setTimeout(() => {
      const parents = population.filter(p => selectedIds.has(p.id));
      const nextGen = generation + 1;
      const newPop: Individual[] = [];
      parents.forEach((p, i) => {
        let child = generateVariant(basePrompt);
        if (parents.length >= 2 && Math.random() > 0.5) {
          const otherParent = parents[(i + 1) % parents.length];
          child = crossover(p.prompt, otherParent.prompt);
          const childWords = child.split(", ");
          childWords[Math.floor(Math.random() * childWords.length)] = randomFrom(QUALITY_GENES);
          child = childWords.join(", ");
        }
        newPop.push({ id: `gen${nextGen}-${i}`, prompt: child, score: scorePrompt(child), selected: false, generation: nextGen });
      });
      while (newPop.length < 6) {
        const prompt = generateVariant(basePrompt);
        newPop.push({ id: `gen${nextGen}-${newPop.length}`, prompt, score: scorePrompt(prompt), selected: false, generation: nextGen });
      }
      newPop.sort((a, b) => b.score - a.score);
      setPopulation(newPop);
      setGeneration(nextGen);
      setSelectedIds(new Set());
      setHistory(prev => [...prev, { gen: nextGen, best: newPop[0].score }]);
      setIsEvolving(false);
    }, 1000);
  }, [population, selectedIds, generation, basePrompt]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const copyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const usePrompt = (prompt: string) => router.push(`/generate?q=${encodeURIComponent(prompt)}`);
  const bestScore = population.length > 0 ? population[0].score : 0;

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
        <button onClick={() => router.push("/smart-prompt")}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Smart Prompt Optimizer
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
              <Dna size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Genetic Algorithm</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Prompt Evolution</h1>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-2xl">
            Evolve your prompts like natural selection. The system generates prompt variations,
            you select the best ones, then the system produces a new generation through
            crossover and genetic mutation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Controls ── */}
          <div className="space-y-4">
            <GlowCard color="#10b981" className="p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Base Prompt</h2>
              <div className="prompt-input rounded-xl p-3 mb-3">
                <textarea value={basePrompt} onChange={e => setBasePrompt(e.target.value)}
                  placeholder="Enter your base prompt idea..."
                  rows={3}
                  className="w-full bg-transparent outline-none border-none resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] leading-relaxed"
                  style={{ caretColor: "var(--accent)" }} />
              </div>
              <button onClick={initPopulation} disabled={!basePrompt.trim() || isEvolving}
                className="btn-shimmer w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {isEvolving && generation === 0 ? <><Sparkles size={14} className="animate-pulse" /> Generating...</> : <><Dna size={14} /> Initialize Population</>}
              </button>
            </GlowCard>

            {population.length > 0 && (
              <GlowCard color="#10b981" className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Evolution Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Generation", value: `#${generation}`, color: "text-emerald-400" },
                    { label: "Population", value: `${population.length} individuals`, color: "text-[var(--text-primary)]" },
                    { label: "Best Score", value: `${bestScore}/100`, color: "text-amber-400" },
                    { label: "Selected", value: `${selectedIds.size} individuals`, color: "text-blue-400" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                      <span className={`text-xs font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                <div className="divider-glow my-3" />
                <button onClick={evolve} disabled={selectedIds.size === 0 || isEvolving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  {isEvolving && generation > 0 ? <><GitMerge size={14} className="animate-pulse" /> Evolving...</> : <><GitMerge size={14} /> Evolve Generation {generation + 1}</>}
                </button>
                <p className="text-[10px] text-[var(--text-dim)] text-center mt-2">Select ≥1 best prompt, then click Evolve</p>
              </GlowCard>
            )}

            {history.length > 1 && (
              <GlowCard color="#10b981" className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Fitness History</h3>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-[var(--text-dim)] w-10 shrink-0">Gen {h.gen}</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${h.best}%`, background: "linear-gradient(90deg,#10b981,#34d399)" }} />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 w-8 text-right">{h.best}</span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            )}

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Select the prompt(s) that best match your vision (can be multiple),
                then click Evolve to generate a new generation combining
                the strengths of your selections.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Population ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--text-primary)]">Generation {generation} Population</h2>
                {population.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {population.length} individuals
                  </span>
                )}
              </div>
              {population.length > 0 && (
                <button onClick={initPopulation}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <RefreshCw size={12} /> Regenerate
                </button>
              )}
            </div>

            {population.length === 0 ? (
              <GlowCard color="#10b981" className="p-12">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Dna size={28} className="text-emerald-400 opacity-60" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">No population yet</p>
                    <p className="text-xs text-[var(--text-dim)]">Enter a base prompt and click "Initialize Population"</p>
                  </div>
                </div>
              </GlowCard>
            ) : isEvolving ? (
              <GlowCard color="#10b981" className="p-12">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <GitMerge size={28} className="text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Running genetic evolution...</p>
                    <p className="text-xs text-[var(--text-muted)]">Crossover & mutation in progress</p>
                  </div>
                </div>
              </GlowCard>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {population.map((ind, idx) => (
                  <IndividualCard
                    key={ind.id}
                    ind={ind}
                    idx={idx}
                    isSelected={selectedIds.has(ind.id)}
                    isBest={idx === 0}
                    onToggle={() => toggleSelect(ind.id)}
                    onCopy={copyPrompt}
                    onUse={usePrompt}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── EXPLANATION SECTION ── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Shuffle, title: "Initialization", color: "#10b981", border: "border-emerald-500/20", bg: "bg-emerald-500/10", desc: "The system generates an initial population with random variations from available genes: style, medium, lighting, composition, and quality keywords." },
            { icon: Heart, title: "Selection (User)", color: "#f43f5e", border: "border-rose-500/20", bg: "bg-rose-500/10", desc: "You act as the 'fitness function'. Select individuals that best match your design vision. The system preserves the best ones for the next generation." },
            { icon: GitMerge, title: "Crossover & Mutation", color: "#3b82f6", border: "border-blue-500/20", bg: "bg-blue-500/10", desc: "Selected individuals are crossed over (combining elements from two prompts) and mutated (replacing random genes) to produce better offspring." },
          ].map((item, i) => (
            <GlowCard key={i} color={item.color} className="p-6">
              <div className={`w-9 h-9 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center mb-4`}
                style={{ border: `2px solid ${item.color}35` }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
            </GlowCard>
          ))}
        </div>

        <GlowCard color="#10b981" className="p-6 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#10b98115", border: "2px solid #10b98140" }}>
              <AlertCircle size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Why Genetic Algorithm for Prompts?</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
            The prompt search space is vast and non-linear — there is no fixed formula for the "perfect" prompt.
            Genetic Algorithm is well-suited because it can efficiently explore large search spaces using
            biological evolution mechanisms. Each generation produces offspring that inherit the best characteristics
            from parents, while mutations maintain diversity to avoid local optima.
          </p>
        </GlowCard>
      </div>
      <Footer />
    </main>
  );
}
