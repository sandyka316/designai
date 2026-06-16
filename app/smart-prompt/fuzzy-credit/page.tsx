"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Sliders,
  Sparkles,
  TrendingUp,
  Award,
  Activity,
  RefreshCw,
  ChevronLeft,
  Info,
  Zap,
  Star,
  AlertCircle,
  CheckCircle,
  Gift,
  XCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

// ─── FUZZY LOGIC ENGINE (Frontend) ────────────────────────────────────────────
function trimf(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) return 0;
  if (x <= b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

function trapmf(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

const fuzzyGenerations = {
  low: (x: number) => trapmf(x, 0, 0, 20, 40),
  medium: (x: number) => trimf(x, 20, 50, 80),
  high: (x: number) => trapmf(x, 60, 80, 100, 100),
};

const fuzzySaves = {
  few: (x: number) => trapmf(x, 0, 0, 8, 15),
  moderate: (x: number) => trimf(x, 10, 20, 35),
  many: (x: number) => trapmf(x, 28, 38, 50, 50),
};

const fuzzyRatings = {
  poor: (x: number) => trapmf(x, 1, 1, 2, 3),
  good: (x: number) => trimf(x, 2, 3, 4),
  excellent: (x: number) => trapmf(x, 3.5, 4, 5, 5),
};

function computeFuzzyCredit(
  generations: number,
  saves: number,
  ratings: number
): { bonus: number; level: string; breakdown: Record<string, number> } {
  const genLow = fuzzyGenerations.low(generations);
  const genMedium = fuzzyGenerations.medium(generations);
  const genHigh = fuzzyGenerations.high(generations);

  const saveFew = fuzzySaves.few(saves);
  const saveModerate = fuzzySaves.moderate(saves);
  const saveMany = fuzzySaves.many(saves);

  const ratPoor = fuzzyRatings.poor(ratings);
  const ratGood = fuzzyRatings.good(ratings);
  const ratExcellent = fuzzyRatings.excellent(ratings);

  const rules: { strength: number; output: number }[] = [
    { strength: Math.min(genHigh, saveMany, ratExcellent), output: 45 },
    { strength: Math.min(genHigh, saveModerate, ratGood), output: 35 },
    { strength: Math.min(genMedium, saveModerate, ratGood), output: 25 },
    { strength: Math.min(genMedium, saveFew), output: 15 },
    { strength: Math.min(genLow, saveFew), output: 5 },
    { strength: Math.min(genHigh, ratExcellent), output: 38 },
    { strength: ratPoor, output: 8 },
    { strength: Math.min(saveMany, ratGood), output: 30 },
  ];

  let numerator = 0;
  let denominator = 0;
  for (const rule of rules) {
    numerator += rule.strength * rule.output;
    denominator += rule.strength;
  }

  const bonus = denominator === 0 ? 5 : Math.round(numerator / denominator);

  const breakdown = {
    "Gen: Low": +genLow.toFixed(2),
    "Gen: Medium": +genMedium.toFixed(2),
    "Gen: High": +genHigh.toFixed(2),
    "Save: Few": +saveFew.toFixed(2),
    "Save: Moderate": +saveModerate.toFixed(2),
    "Save: Many": +saveMany.toFixed(2),
    "Rating: Poor": +ratPoor.toFixed(2),
    "Rating: Good": +ratGood.toFixed(2),
    "Rating: Excellent": +ratExcellent.toFixed(2),
  };

  let level = "Inactive";
  if (bonus >= 40) level = "Super Active";
  else if (bonus >= 30) level = "Very Active";
  else if (bonus >= 20) level = "Active";
  else if (bonus >= 12) level = "Getting Started";

  return { bonus, level, breakdown };
}

// ─── HELPER: hex → rgb ────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
    : { r: 124, g: 109, b: 250 };
}

// ─── GLOWCARD: reusable card dengan efek spotlight + border berwarna ──────────
function GlowCard({
  children,
  color,
  className = "",
}: {
  children: React.ReactNode;
  color: string; // hex
  className?: string;
}) {
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
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, op: 0 })); }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: hovered
          ? `linear-gradient(145deg, ${rgba(0.10)} 0%, var(--bg-card) 50%, ${rgba(0.05)} 100%)`
          : "var(--bg-card)",
        border: hovered ? `2px solid ${rgba(0.70)}` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-5px) scale(1.015)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${rgba(0.25)}, 0 8px 24px rgba(0,0,0,0.35), 0 20px 60px ${rgba(0.25)}, 0 0 80px ${rgba(0.10)}`
          : "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      {/* Spotlight radial */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.op, transition: "opacity 0.15s ease",
          background: `radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.22)}, ${rgba(0.05)} 50%, transparent 70%)` }} />

      {/* Top glow bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: hovered ? "3px" : "0px", opacity: hovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 30%, ${rgba(0.8)} 70%, transparent)`,
          boxShadow: hovered ? `0 0 14px ${rgba(0.9)}, 0 0 28px ${rgba(0.5)}` : "none" }} />

      {/* Left accent bar */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{ width: hovered ? "3px" : "0px", opacity: hovered ? 0.9 : 0,
          background: `linear-gradient(180deg, ${rgba(1)}, ${rgba(0.5)} 60%, transparent)` }} />

      {/* Corner glows */}
      <div className="pointer-events-none absolute top-0 left-0 w-36 h-36 transition-opacity duration-400"
        style={{ opacity: hovered ? 0.9 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.40)}, transparent 65%)` }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-36 h-36 transition-opacity duration-400"
        style={{ opacity: hovered ? 0.7 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba(0.30)}, transparent 65%)` }} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── FUZZY METER COMPONENT ─────────────────────────────────────────────────────
function FuzzyMeter({
  label,
  value,
  max,
  step,
  unit,
  onChange,
  color,
  desc,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  color: string;
  desc: string;
}) {
  const pct = (value / max) * 100;
  const { r, g, b } = hexToRgb(color);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  return (
    <GlowCard color={color} className="p-5 cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <span className="text-2xl font-extrabold" style={{ color }}>
            {value}
          </span>
          <span className="text-xs text-[var(--text-dim)] ml-1">{unit}</span>
        </div>
      </div>
      <div className="relative mt-4 mb-2">
        {/* Track */}
        <div className="h-2.5 rounded-full overflow-hidden"
          style={{ background: `${color}18`, border: `1px solid ${rgba(0.25)}` }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${color}bb, ${color})`,
              boxShadow: `0 0 8px ${rgba(0.6)}`,
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2.5"
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-dim)]">
        <span>0</span>
        <span>{max / 2}</span>
        <span>{max}</span>
      </div>
    </GlowCard>
  );
}

// ─── MEMBERSHIP BAR ────────────────────────────────────────────────────────────
function MembershipBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--text-muted)] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

// ─── TIP CARD (Generate more / Save more / Keep ratings high) ─────────────────
const TIP_CARD_DATA = [
  { icon: Zap,       label: "Generate more",       tip: "Generate ≥80 designs for maximum bonus", color: "#f59e0b" },
  { icon: Award,     label: "Save more",            tip: "Save ≥38 designs for the 'many' category", color: "#10b981" },
  { icon: TrendingUp,label: "Keep ratings high",    tip: "Maintain rating ≥4 for full bonus", color: "#3b82f6" },
];

function TipCard({ icon: Icon, label, tip, color }: typeof TIP_CARD_DATA[0]) {
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
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, op: 0 })); }}
      className="relative overflow-hidden rounded-xl p-4 cursor-default"
      style={{
        background: hovered ? `linear-gradient(145deg, ${rgba(0.12)}, var(--bg-card))` : "var(--bg-card)",
        border: hovered ? `2px solid ${rgba(0.65)}` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${rgba(0.2)}, 0 6px 18px rgba(0,0,0,0.3), 0 0 50px ${rgba(0.15)}`
          : "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {/* Spotlight */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.op, transition: "opacity 0.15s ease",
          background: `radial-gradient(200px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.22)}, transparent 70%)` }} />
      {/* Top bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: hovered ? "2.5px" : "0px", opacity: hovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 40%, ${rgba(0.8)} 60%, transparent)`,
          boxShadow: hovered ? `0 0 10px ${rgba(0.9)}, 0 0 20px ${rgba(0.5)}` : "none" }} />

      <div className="relative z-10">
        {/* Icon badge */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
          style={{
            background: hovered ? `${color}25` : `${color}12`,
            border: `2px solid ${hovered ? rgba(0.7) : rgba(0.25)}`,
            boxShadow: hovered ? `0 0 10px ${rgba(0.5)}` : "none",
          }}>
          <Icon size={15} style={{ color, filter: hovered ? `drop-shadow(0 0 5px ${rgba(0.9)})` : "none" }} />
        </div>
        <p className="text-[11px] font-bold mb-1 transition-colors duration-200"
          style={{ color: hovered ? color : "var(--text-primary)" }}>
          {label}
        </p>
        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{tip}</p>

        {/* Bottom accent */}
        <div className="mt-3 h-0.5 rounded-full transition-all duration-500"
          style={{
            width: hovered ? "100%" : "1.5rem",
            background: `linear-gradient(90deg, ${color}, ${color}55)`,
            boxShadow: hovered ? `0 0 6px ${rgba(0.7)}` : "none",
          }} />
      </div>
    </div>
  );
}

// ─── EXPLANATION CARD (What is Fuzzy Logic? / Activity Levels) ────────────────
function ExplainCard({
  children,
  color = "#8b5cf6",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <GlowCard color={color} className="p-6">
      {children}
    </GlowCard>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function FuzzyCreditPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState(45);
  const [saves, setSaves] = useState(18);
  const [ratings, setRatings] = useState(3.5);
  const [result, setResult] = useState<ReturnType<typeof computeFuzzyCredit> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [claimed, setClaimed] = useState(false);

  const compute = useCallback(() => {
    setIsCalculating(true);
    setTimeout(() => {
      setResult(computeFuzzyCredit(generations, saves, ratings));
      setIsCalculating(false);
    }, 600);
  }, [generations, saves, ratings]);

  useEffect(() => {
    compute();
  }, []);

  const claimBonus = async () => {
    setIsClaiming(true);
    setClaimStatus(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/credits/status");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.credits_awarded) {
        setClaimStatus({ success: true, message: data.message || `+${data.bonus_credits} credits berhasil ditambahkan!` });
        setClaimed(true);
      } else {
        setClaimStatus({ success: false, message: "Tidak ada bonus kredit yang dapat diklaim saat ini." });
      }
    } catch (err) {
      setClaimStatus({ success: false, message: "Gagal terhubung ke server. Pastikan backend berjalan." });
    } finally {
      setIsClaiming(false);
    }
  };

  const resetDefaults = () => {
    setGenerations(45);
    setSaves(18);
    setRatings(3.5);
    setClaimed(false);
    setClaimStatus(null);
  };

  const levelColors: Record<string, string> = {
    "Super Active": "#a855f7",
    "Very Active": "#8b5cf6",
    "Active": "#6366f1",
    "Getting Started": "#3b82f6",
    "Inactive": "#64748b",
  };

  const currentColor = result ? (levelColors[result.level] ?? "#7c6dfa") : "#7c6dfa";

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/smart-prompt")}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Smart Prompt Optimizer
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center">
              <Sliders size={20} className="text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400">
                Computational Intelligence
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Fuzzy Credit Scoring
              </h1>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-2xl">
            A flexible credit bonus system powered by fuzzy logic.
            Not rigid binary rules — it uses gradual membership degrees
            to determine the right bonus based on your activity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Inputs ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[var(--text-primary)]">Activity Inputs</h2>
              <button
                onClick={resetDefaults}
                className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>

            <FuzzyMeter
              label="Generations Count"
              value={generations}
              max={100}
              step={1}
              unit="times"
              onChange={setGenerations}
              color="#a855f7"
              desc="How many designs you have generated"
            />
            <FuzzyMeter
              label="Saved Designs"
              value={saves}
              max={50}
              step={1}
              unit="items"
              onChange={setSaves}
              color="#8b5cf6"
              desc="How many designs you saved to your collection"
            />
            <FuzzyMeter
              label="Average Rating"
              value={ratings}
              max={5}
              step={0.1}
              unit="/ 5"
              onChange={setRatings}
              color="#6366f1"
              desc="Average rating you gave to generated designs"
            />

            <button
              onClick={compute}
              disabled={isCalculating}
              className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCalculating ? (
                <>
                  <Activity size={16} className="animate-pulse" />
                  Computing Fuzzy Logic...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Calculate Credit Bonus
                </>
              )}
            </button>

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
              <Info size={14} className="text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Fuzzy logic uses triangular and trapezoidal membership functions
                to model linguistic concepts like "fairly active" or "very active"
                without rigid boundaries.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Result ── */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">Inference Result</h2>

            <div
              className="relative rounded-3xl border p-8 overflow-hidden"
              style={{ borderColor: `${currentColor}40` }}
            >
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${currentColor}, transparent 70%)` }}
              />

              {isCalculating ? (
                <div className="relative z-10 flex flex-col items-center gap-4 py-8">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${currentColor}15`, border: `1px solid ${currentColor}30` }}
                  >
                    <Sliders size={28} className="animate-pulse" style={{ color: currentColor }} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">Running fuzzy inference...</p>
                </div>
              ) : result ? (
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] mb-2">
                      Credit Bonus
                    </p>
                    <div className="flex items-end justify-center gap-2 mb-2">
                      <span className="text-7xl font-extrabold tracking-tighter" style={{ color: currentColor }}>
                        +{result.bonus}
                      </span>
                      <span className="text-lg text-[var(--text-muted)] mb-2">credits</span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold"
                      style={{
                        background: `${currentColor}15`,
                        border: `1px solid ${currentColor}30`,
                        color: currentColor,
                      }}
                    >
                      <Star size={12} />
                      {result.level}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-[var(--text-dim)] mb-1.5">
                      <span>0 credits</span>
                      <span>50 credits</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(result.bonus / 50) * 100}%`,
                          background: `linear-gradient(90deg, ${currentColor}, ${currentColor}aa)`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="divider-glow my-5" />

                  {/* ── Claim Bonus Button ── */}
                  {!claimed ? (
                    <button
                      onClick={claimBonus}
                      disabled={isClaiming}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold text-white mb-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: isClaiming
                          ? `linear-gradient(135deg, ${currentColor}80, ${currentColor}50)`
                          : `linear-gradient(135deg, ${currentColor}, ${currentColor}bb)`,
                        boxShadow: isClaiming ? "none" : `0 4px 20px ${currentColor}50, 0 0 40px ${currentColor}20`,
                        border: `1px solid ${currentColor}60`,
                      }}
                    >
                      {isClaiming ? (
                        <>
                          <Activity size={15} className="animate-pulse" />
                          Claiming bonus...
                        </>
                      ) : (
                        <>
                          <Gift size={15} />
                          Claim +{result.bonus} Credits to Dashboard
                        </>
                      )}
                    </button>
                  ) : (
                    <div
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold mb-2"
                      style={{
                        background: "#10b98115",
                        border: "1px solid #10b98140",
                        color: "#10b981",
                      }}
                    >
                      <CheckCircle size={15} />
                      Bonus Claimed! Check your Dashboard
                    </div>
                  )}

                  {/* ── Note: slider is for simulation, actual claim uses real activity ── */}
                  {!claimed && (
                    <p className="text-[10px] text-[var(--text-dim)] text-center mb-3 leading-relaxed">
                      💡 Sliders above simulate the scoring. Actual bonus is calculated from your real activity data.
                    </p>
                  )}

                  {/* ── Claim status message ── */}
                  {claimStatus && (
                    <div
                      className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-4 text-xs"
                      style={{
                        background: claimStatus.success ? "#10b98110" : "#ef444410",
                        border: `1px solid ${claimStatus.success ? "#10b98130" : "#ef444430"}`,
                        color: claimStatus.success ? "#10b981" : "#ef4444",
                      }}
                    >
                      {claimStatus.success ? (
                        <CheckCircle size={14} className="shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={14} className="shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{claimStatus.message}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setShowBreakdown((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-3"
                  >
                    <span>Fuzzy Membership Degrees</span>
                    <span className="text-[var(--accent)]">{showBreakdown ? "Hide ▲" : "Show ▼"}</span>
                  </button>

                  {showBreakdown && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Generations</p>
                      <MembershipBar label="Low" value={result.breakdown["Gen: Low"]} color="#94a3b8" />
                      <MembershipBar label="Medium" value={result.breakdown["Gen: Medium"]} color="#8b5cf6" />
                      <MembershipBar label="High" value={result.breakdown["Gen: High"]} color="#a855f7" />

                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3 mt-4">Saves</p>
                      <MembershipBar label="Few" value={result.breakdown["Save: Few"]} color="#94a3b8" />
                      <MembershipBar label="Moderate" value={result.breakdown["Save: Moderate"]} color="#6366f1" />
                      <MembershipBar label="Many" value={result.breakdown["Save: Many"]} color="#8b5cf6" />

                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3 mt-4">Rating</p>
                      <MembershipBar label="Poor" value={result.breakdown["Rating: Poor"]} color="#ef4444" />
                      <MembershipBar label="Good" value={result.breakdown["Rating: Good"]} color="#6366f1" />
                      <MembershipBar label="Excellent" value={result.breakdown["Rating: Excellent"]} color="#a855f7" />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* ── Tips cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIP_CARD_DATA.map((t, i) => (
                <TipCard key={i} {...t} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── EXPLANATION SECTION ── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* What is Fuzzy Logic */}
          <ExplainCard color="#8b5cf6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#8b5cf615", border: "2px solid #8b5cf640" }}>
                <AlertCircle size={16} className="text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">What is Fuzzy Logic?</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
              Fuzzy logic is a reasoning system that works with truth degree values
              between 0 and 1, not just true or false. This enables modeling of
              ambiguous linguistic concepts like "fairly active" or "very active".
            </p>
            <div className="space-y-2.5">
              {[
                { label: "Fuzzification", desc: "Convert numeric inputs to membership degrees" },
                { label: "Inference", desc: "Apply fuzzy rule-base (Mamdani method)" },
                { label: "Defuzzification", desc: "Convert fuzzy output to credit value (centroid)" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: "#8b5cf608", border: "1px solid #8b5cf620" }}>
                  <span className="text-violet-400 font-extrabold text-xs shrink-0 mt-0.5">{i + 1}.</span>
                  <div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{step.label}: </span>
                    <span className="text-xs text-[var(--text-muted)]">{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </ExplainCard>

          {/* Activity Levels */}
          <ExplainCard color="#6366f1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "#6366f115", border: "2px solid #6366f140" }}>
                <TrendingUp size={16} className="text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Activity Levels & Bonuses</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { level: "Super Active", bonus: "40-50", color: "#a855f7", req: "Gen≥80, Save≥38, Rating≥4" },
                { level: "Very Active", bonus: "30-39", color: "#8b5cf6", req: "Gen≥60, Save≥28, Rating≥3.5" },
                { level: "Active", bonus: "20-29", color: "#6366f1", req: "Gen≥20, Save≥10, Rating≥2.5" },
                { level: "Getting Started", bonus: "12-19", color: "#3b82f6", req: "Gen≥20, moderate activity" },
                { level: "Inactive", bonus: "0-11", color: "#64748b", req: "Low activity" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}80` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.level}</span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">+{item.bonus} credits</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">{item.req}</p>
                  </div>
                </div>
              ))}
            </div>
          </ExplainCard>
        </div>
      </div>
      <Footer />
    </main>
  );
}
