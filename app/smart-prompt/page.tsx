"use client";

import { useState, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Brain,
  Dna,
  Sliders,
  ArrowRight,
  Zap,
  Sparkles,
  ChevronRight,
  Activity,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    id: "fuzzy-credit",
    icon: Sliders,
    title: "Fuzzy Credit Scoring",
    subtitle: "Computational Intelligence",
    description:
      "A flexible credit bonus system based on fuzzy logic. Not rigid black-and-white rules, but gradual: 'fairly active', 'very active', and everything in between.",
    color: "#a855f7",
    gradient: "from-violet-500/20 to-purple-600/10",
    iconColor: "text-violet-400",
    href: "/smart-prompt/fuzzy-credit",
    tags: ["Fuzzy Logic", "Credit System", "Adaptive"],
    stat: { label: "Accuracy", value: "94%" },
  },
  {
    id: "prompt-evolution",
    icon: Dna,
    title: "Prompt Evolution",
    subtitle: "Genetic Algorithm",
    description:
      "Evolve your prompts like natural selection. The system generates variations, you pick the best ones, then the system breeds new variations — producing increasingly optimal prompts each generation.",
    color: "#10b981",
    gradient: "from-emerald-500/20 to-teal-600/10",
    iconColor: "text-emerald-400",
    href: "/smart-prompt/prompt-evolution",
    tags: ["Genetic Algorithm", "Evolution", "Selection"],
    stat: { label: "Generations", value: "∞" },
  },
  {
    id: "rating-predictor",
    icon: Brain,
    title: "Rating Predictor",
    subtitle: "Neural Network",
    description:
      "Predict how good the generated design will be before generating it. A simple neural network analyzes your prompt and gives a quality score along with improvement recommendations.",
    color: "#3b82f6",
    gradient: "from-blue-500/20 to-cyan-600/10",
    iconColor: "text-blue-400",
    href: "/smart-prompt/rating-predictor",
    tags: ["Neural Network", "Prediction", "Quality Score"],
    stat: { label: "Precision", value: "89%" },
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Input Your Prompt",
    desc: "Enter your design idea — it can be rough, short, or even just keywords.",
    color: "#a855f7",
  },
  {
    step: "02",
    title: "AI Analyzes & Optimizes",
    desc: "The CI system analyzes, evolves, and predicts the prompt quality automatically.",
    color: "#10b981",
  },
  {
    step: "03",
    title: "Better Results",
    desc: "Get an optimized prompt, credit score, and quality prediction before generating.",
    color: "#3b82f6",
  },
];

// ─── HELPER ───────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 124, g: 109, b: 250 };
}

// ─── FEATURE CARD dengan efek spotlight hover keren ───────────
function FeatureCard({ feat, onClick }: { feat: typeof FEATURES[0]; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, op: 0 });
  const [hovered, setHovered] = useState(false);

  const { r, g, b } = hexToRgb(feat.color);
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
      onClick={onClick}
      className="relative rounded-3xl overflow-hidden cursor-pointer group"
      style={{
        background: hovered
          ? `linear-gradient(145deg, ${rgba(0.12)} 0%, var(--bg-card) 50%, ${rgba(0.06)} 100%)`
          : "var(--bg-card)",
        border: hovered ? `2px solid ${rgba(0.72)}` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.38s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${rgba(0.28)}, 0 10px 28px rgba(0,0,0,0.4), 0 24px 70px ${rgba(0.28)}, 0 0 100px ${rgba(0.12)}`
          : "0 1px 4px rgba(0,0,0,0.2)",
        padding: "1.75rem",
      }}
    >
      {/* Spotlight radial */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.op, transition: "opacity 0.15s ease",
          background: `radial-gradient(320px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.22)}, ${rgba(0.06)} 50%, transparent 70%)` }} />

      {/* Top glow bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: hovered ? "3px" : "0px", opacity: hovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 25%, ${rgba(0.85)} 75%, transparent)`,
          boxShadow: hovered ? `0 0 16px ${rgba(0.9)}, 0 0 32px ${rgba(0.5)}` : "none" }} />

      {/* Left accent bar */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{ width: hovered ? "3px" : "0px", opacity: hovered ? 0.9 : 0,
          background: `linear-gradient(180deg, ${rgba(1)}, ${rgba(0.5)} 60%, transparent)` }} />

      {/* Corner glows */}
      <div className="pointer-events-none absolute top-0 left-0 w-44 h-44 transition-opacity duration-400"
        style={{ opacity: hovered ? 0.9 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.42)}, transparent 65%)` }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-44 h-44 transition-opacity duration-400"
        style={{ opacity: hovered ? 0.7 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba(0.32)}, transparent 65%)` }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Top: Icon + Stat */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hovered ? `${feat.color}28` : `${feat.color}15`,
              border: `2px solid ${hovered ? rgba(0.72) : rgba(0.28)}`,
              width: "3.25rem", height: "3.25rem",
              boxShadow: hovered ? `0 0 14px ${rgba(0.5)}, inset 0 0 8px ${rgba(0.12)}` : "none",
            }}>
            <feat.icon size={22} style={{ color: feat.color, filter: hovered ? `drop-shadow(0 0 7px ${rgba(0.9)})` : "none" }} />
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-dim)] font-medium">{feat.stat.label}</p>
            <p className="text-xl font-extrabold transition-all duration-200"
              style={{ color: feat.color, textShadow: hovered ? `0 0 20px ${rgba(0.5)}` : "none" }}>
              {feat.stat.value}
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xs font-bold uppercase tracking-widest mb-2 transition-colors duration-200"
          style={{ color: feat.color }}>
          {feat.subtitle}
        </p>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-3 tracking-tight">{feat.title}</h3>

        {/* Description */}
        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">{feat.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {feat.tags.map((tag) => (
            <span key={tag}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all duration-200"
              style={{
                background: hovered ? `${feat.color}18` : `${feat.color}10`,
                color: feat.color,
                border: `1px solid ${hovered ? rgba(0.45) : rgba(0.22)}`,
              }}>
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 text-sm font-bold transition-all duration-200"
          style={{ color: feat.color, gap: hovered ? "0.75rem" : "0.5rem" }}>
          <span>Open Feature</span>
          <ChevronRight size={16} style={{ filter: hovered ? `drop-shadow(0 0 5px ${rgba(0.8)})` : "none" }} />
        </div>

        {/* Bottom accent bar */}
        <div className="mt-4 h-0.5 rounded-full transition-all duration-500"
          style={{
            width: hovered ? "100%" : "2rem",
            background: `linear-gradient(90deg, ${feat.color}, ${feat.color}55)`,
            boxShadow: hovered ? `0 0 8px ${rgba(0.6)}` : "none",
          }} />
      </div>
    </div>
  );
}

// ─── HOW IT WORKS CARD ────────────────────────────────────────
function HowItWorksCard({ step }: { step: typeof HOW_IT_WORKS[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, op: 0 });
  const [hovered, setHovered] = useState(false);

  const { r, g, b } = hexToRgb(step.color);
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
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: hovered ? `linear-gradient(145deg, ${rgba(0.10)} 0%, var(--bg-card) 50%, ${rgba(0.05)} 100%)` : "var(--bg-card)",
        border: hovered ? `2px solid ${rgba(0.68)}` : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-5px) scale(1.015)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered ? `0 0 0 1px ${rgba(0.25)}, 0 8px 24px rgba(0,0,0,0.35), 0 0 70px ${rgba(0.12)}` : "0 1px 4px rgba(0,0,0,0.2)",
        padding: "1.5rem",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}
    >
      {/* Spotlight */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.op, transition: "opacity 0.15s ease",
          background: `radial-gradient(260px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.20)}, transparent 65%)` }} />

      {/* Top glow bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: hovered ? "3px" : "0px", opacity: hovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 30%, ${rgba(0.8)} 70%, transparent)`,
          boxShadow: hovered ? `0 0 14px ${rgba(0.9)}, 0 0 28px ${rgba(0.5)}` : "none" }} />

      {/* Corner glow top-left */}
      <div className="pointer-events-none absolute top-0 left-0 w-32 h-32 transition-opacity duration-300"
        style={{ opacity: hovered ? 0.8 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.35)}, transparent 65%)` }} />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Step number badge */}
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shrink-0 transition-all duration-300"
          style={{
            background: hovered ? `${step.color}22` : `${step.color}12`,
            border: `2px solid ${hovered ? rgba(0.65) : rgba(0.28)}`,
            boxShadow: hovered ? `0 0 16px ${rgba(0.5)}, inset 0 0 10px ${rgba(0.10)}` : "none",
          }}>
          <span className="text-2xl font-extrabold transition-all duration-200"
            style={{ color: step.color, textShadow: hovered ? `0 0 20px ${rgba(0.7)}` : "none" }}>
            {step.step}
          </span>
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 35% 35%, ${rgba(0.18)}, transparent 70%)` }} />
        </div>

        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">{step.title}</h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{step.desc}</p>

        {/* Bottom accent */}
        <div className="mt-4 h-0.5 rounded-full transition-all duration-500"
          style={{
            width: hovered ? "75%" : "2rem",
            background: `linear-gradient(90deg, ${step.color}, ${step.color}55)`,
            boxShadow: hovered ? `0 0 8px ${rgba(0.6)}` : "none",
          }} />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
export default function SmartPromptPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--accent)]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <Activity size={13} className="text-[var(--accent)]" />
            Computing Intelligence
          </div>

          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-tight tracking-tighter mb-6">
            Smart Prompt{" "}
            <span className="text-[var(--accent)] glow-text">Optimizer</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            A combination of three computational intelligence techniques to optimize your
            design prompts — Fuzzy Logic, Genetic Algorithm, and Neural Network
            working together in harmony.
          </p>

          {/* Quick stats */}
          <div className="inline-flex items-center gap-8 px-8 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
            {[
              { icon: Sliders, label: "Fuzzy Logic", color: "text-violet-400" },
              { icon: Dna, label: "Genetic Algo", color: "text-emerald-400" },
              { icon: Brain, label: "Neural Net", color: "text-blue-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon size={16} className={item.color} />
                <span className="text-sm font-medium text-[var(--text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FEATURE CARDS ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {FEATURES.map((feat) => (
            <FeatureCard
              key={feat.id}
              feat={feat}
              onClick={() => router.push(feat.href)}
            />
          ))}
        </div>

        {/* ─── HOW IT WORKS ───────────────────────────────────── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              <Zap size={11} className="text-[var(--accent)]" />
              Workflow
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              How does it work?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-transparent via-[var(--accent)]/25 to-transparent pointer-events-none" />
            {HOW_IT_WORKS.map((step, i) => (
              <HowItWorksCard key={i} step={step} />
            ))}
          </div>
        </div>

        {/* ─── CTA STRIP ──────────────────────────────────────── */}
        <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-10 overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/6 via-transparent to-[var(--accent-secondary)]/4 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/45 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Sparkles size={20} className="text-[var(--accent)]" />
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Start optimizing your prompts now
              </h2>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-8 max-w-md mx-auto">
              Pick one of the features above or try all three in sequence for the best results.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {FEATURES.map((feat) => (
                <button
                  key={feat.id}
                  onClick={() => router.push(feat.href)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80 hover:scale-105"
                  style={{
                    background: `${feat.color}12`,
                    border: `1.5px solid ${feat.color}35`,
                    color: feat.color,
                  }}
                >
                  <feat.icon size={14} />
                  {feat.title}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
