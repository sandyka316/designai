"use client";

import { useState, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Sparkles,
  ArrowRight,
  Lock,
  Wand2,
  X,
  FileText,
  Paperclip,
  ImageIcon,
  Lightbulb,
  Zap,
  Crown,
  Star,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuestLimitModal from "@/components/GuestLimitModal";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";

const MODELS = [
  { id: "hd", label: "HD", locked: false },
  { id: "genius", label: "Genius", locked: true },
  { id: "super-genius", label: "Super Genius", locked: true },
];

// ─── DATA PENJELASAN ──────────────────────────────────────────────
const TIPS = [
  {
    icon: "1",
    title: "Describe in detail",
    desc: "The more specific your prompt, the more accurate the result. Specify style, colors, materials, and the desired mood.",
    example:
      '"Minimalist white sneakers, premium matte leather, clean background, soft studio lighting, 8K"',
  },
  {
    icon: "2",
    title: "Add product context",
    desc: "Include target audience, product category, or intended use so the AI can generate more relevant visuals.",
    example:
      '"Luxury perfume bottle for young women, gold and black, elegant, product photography"',
  },
  {
    icon: "3",
    title: "Use quality keywords",
    desc: "Add terms like 4K, highly detailed, professional photography, and sharp focus to improve output quality.",
    example:
      '"Street fashion hoodie, urban aesthetic, 4K, highly detailed, commercial shoot"',
  },
  {
    icon: "4",
    title: "Remix from an image",
    desc: "Click the Wand icon to upload a base image. AI will use it as the visual foundation — you control the direction with your prompt. Different from Recommendation page which applies designs to specific products.",
    example: "Upload a sneaker photo → type 'premium leather, gold accents' → get a remixed version",
  },
];

const MODEL_INFO = [
  {
    id: "hd",
    label: "HD",
    icon: Zap,
    status: "free",
    speed: "~2–3 detik",
    quality: "high",
    desc: "Standard model with high quality output. Ideal for fast idea exploration, early mockups, and everyday use.",
    features: ["Fast generation", "Commercial quality", "Free for all users"],
    color: "var(--accent)",
  },
  {
    id: "genius",
    label: "Genius",
    icon: Crown,
    status: "pro",
    speed: "~5–8 detik",
    quality: "Very High",
    desc: "Advanced model with deeper contextual understanding. Produces more detailed and photorealistic visuals.",
    features: [
      "Ultra-high detail",
      "Better contextual understanding",
      "Pro & Enterprise only",
    ],
    color: "#f59e0b",
  },
  {
    id: "super-genius",
    label: "Super Genius",
    icon: Star,
    status: "enterprise",
    speed: "~10–15 detik",
    quality: "Ultra",
    desc: "Our flagship model for professional production needs — product catalogs, advertising campaigns, and premium publications.",
    features: [
      "Production-grade quality",
      "Multi-angle generation",
      "Enterprise only",
    ],
    color: "#ec4899",
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Save time & cost",
    desc: "No need to hire photographers or rent studios. Generate hundreds of product visuals in minutes.",
    hex: "#f59e0b", hex2: "#fbbf24", rgb: { r: 245, g: 158, b: 11 },
  },
  {
    icon: ImageIcon,
    title: "Commercial-ready output",
    desc: "High-resolution results ready for e-commerce, catalogs, social media, and advertising materials.",
    hex: "#06b6d4", hex2: "#3b82f6", rgb: { r: 6, g: 182, b: 212 },
  },
  {
    icon: Sparkles,
    title: "Consistent across all products",
    desc: "Maintain a consistent visual style across your entire product line with the same prompt template.",
    hex: "#7c6dfa", hex2: "#9b8dfc", rgb: { r: 124, g: 109, b: 250 },
  },
  {
    icon: Wand2,
    title: "Multi-modal input",
    desc: "Combine text and reference images simultaneously for full control over the desired output.",
    hex: "#10b981", hex2: "#84cc16", rgb: { r: 16, g: 185, b: 129 },
  },
];

// ─── SPOTLIGHT CARD ───────────────────────────────────────────
function SpotlightCard({
  children,
  className = "",
  hex = "#7c6dfa",
  hex2 = "#4facfe",
  rgb = { r: 124, g: 109, b: 250 },
}: {
  children: React.ReactNode;
  className?: string;
  hex?: string;
  hex2?: string;
  rgb?: { r: number; g: number; b: number };
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const { r, g, b } = rgb;
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
  const hex2rgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 79, g: 172, b: 254 };
  };
  const c2 = hex2rgb(hex2);
  const rgba2 = (a: number) => `rgba(${c2.r},${c2.g},${c2.b},${a})`;

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => { setIsHovered(false); setSpotlight((prev) => ({ ...prev, opacity: 0 })); };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}
      style={{
        background: isHovered ? `linear-gradient(135deg, ${rgba(0.10)} 0%, var(--bg-card) 45%, ${rgba2(0.08)} 100%)` : "var(--bg-card)",
        border: isHovered ? `1.5px solid ${rgba(0.80)}` : "1px solid var(--border)",
        transform: isHovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "background 0.35s ease, border-color 0.2s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
        boxShadow: isHovered ? `0 0 0 1px ${rgba(0.4)}, 0 6px 14px rgba(0,0,0,0.3), 0 20px 56px ${rgba(0.28)}, 0 0 80px ${rgba(0.10)}` : "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ opacity: spotlight.opacity, transition: "opacity 0.15s ease", background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, ${rgba(0.32)}, ${rgba(0.08)} 45%, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0" style={{ opacity: spotlight.opacity * 0.6, transition: "opacity 0.2s ease", background: `radial-gradient(160px circle at ${spotlight.x + 20}px ${spotlight.y + 12}px, ${rgba2(0.22)}, transparent 65%)` }} />
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300" style={{ height: isHovered ? "2.5px" : "1px", opacity: isHovered ? 1 : 0, background: `linear-gradient(90deg, transparent 0%, ${rgba(1)} 20%, ${rgba2(0.9)} 50%, ${rgba(1)} 80%, transparent 100%)`, boxShadow: isHovered ? `0 0 12px ${rgba(0.9)}, 0 0 24px ${rgba(0.5)}` : "none" }} />
      <div className="pointer-events-none absolute top-0 left-0 w-32 h-32 transition-opacity duration-300" style={{ opacity: isHovered ? 0.9 : 0, background: `radial-gradient(circle at 0% 0%, ${rgba(0.50)}, ${rgba(0.10)} 50%, transparent 70%)` }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-32 h-32 transition-opacity" style={{ opacity: isHovered ? 0.80 : 0, background: `radial-gradient(circle at 100% 100%, ${rgba2(0.45)}, ${rgba2(0.08)} 50%, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-500" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${rgba(0.16)}, transparent 70%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

interface LimitStatus {
  feature: string;
  used_today: number;
  daily_limit: number;
  remaining: number;
  reset_at: string;
}

// ─── MODEL CARD dengan efek spotlight hover ───────────────────
function ModelCard({
  model,
  isSelected,
}: {
  model: (typeof MODEL_INFO)[0];
  isSelected: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, opacity: 0 });
  const [hovered, setHovered] = useState(false);

  // resolve warna: ganti CSS var jika perlu
  const rawColor = model.color === "var(--accent)" ? "#7c6dfa" : model.color;

  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
      ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
      : { r: 124, g: 109, b: 250 };
  };
  const { r, g, b } = hexToRgb(rawColor);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  const statusBadge = {
    free: { label: "FREE", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    pro: { label: "PRO", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    enterprise: { label: "ENTERPRISE", cls: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  }[model.status] ?? { label: "FREE", cls: "" };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, opacity: 0 })); }}
      className="relative rounded-2xl overflow-hidden cursor-default group"
      style={{
        background: hovered
          ? `linear-gradient(145deg, ${rgba(0.12)} 0%, var(--bg-card) 50%, ${rgba(0.06)} 100%)`
          : "var(--bg-card)",
        border: hovered
          ? `2px solid ${rgba(0.75)}`
          : isSelected
          ? `2px solid ${rgba(0.45)}`
          : "1.5px solid var(--border)",
        transform: hovered ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${rgba(0.3)}, 0 8px 20px rgba(0,0,0,0.35), 0 24px 60px ${rgba(0.3)}, 0 0 100px ${rgba(0.12)}`
          : isSelected
          ? `0 0 0 1px ${rgba(0.2)}, 0 4px 12px ${rgba(0.15)}`
          : "0 1px 4px rgba(0,0,0,0.2)",
        padding: "1.5rem",
      }}
    >
      {/* Spotlight radial */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.opacity, transition: "opacity 0.15s ease",
          background: `radial-gradient(320px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.28)}, ${rgba(0.06)} 50%, transparent 70%)` }} />

      {/* Top glow bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: hovered ? "3px" : "1.5px", opacity: hovered ? 1 : isSelected ? 0.6 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 25%, ${rgba(0.8)} 75%, transparent)`,
          boxShadow: hovered ? `0 0 16px ${rgba(1)}, 0 0 32px ${rgba(0.6)}` : "none" }} />

      {/* Corner glows */}
      <div className="pointer-events-none absolute top-0 left-0 w-40 h-40 transition-opacity duration-400"
        style={{ opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.45)}, transparent 65%)` }} />
      <div className="pointer-events-none absolute bottom-0 right-0 w-40 h-40 transition-opacity duration-400"
        style={{ opacity: hovered ? 0.8 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba(0.35)}, transparent 65%)` }} />

      {/* Left accent bar */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{ width: hovered ? "3px" : "0px", opacity: hovered ? 0.85 : 0,
          background: `linear-gradient(180deg, ${rgba(0.9)}, ${rgba(0.5)} 60%, transparent)` }} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
              style={{
                background: hovered ? `${rawColor}28` : `${rawColor}15`,
                border: `2px solid ${hovered ? rgba(0.7) : rgba(0.3)}`,
                boxShadow: hovered ? `0 0 14px ${rgba(0.5)}, inset 0 0 8px ${rgba(0.15)}` : "none",
              }}>
              <model.icon size={20} style={{ color: rawColor, filter: hovered ? `drop-shadow(0 0 6px ${rgba(0.9)})` : "none" }} />
            </div>
            <span className="text-base font-extrabold text-[var(--text-primary)]"
              style={{ textShadow: hovered ? `0 0 20px ${rgba(0.4)}` : "none" }}>
              {model.label}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Desc */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
          {model.desc}
        </p>

        {/* Meta — speed & quality */}
        <div className="flex items-center gap-4 mb-4 px-3 py-2.5 rounded-xl transition-all duration-300"
          style={{
            background: hovered ? `${rawColor}10` : "var(--bg-secondary)",
            border: `1px solid ${hovered ? rgba(0.3) : "var(--border)"}`,
          }}>
          <div>
            <p className="text-[10px] text-[var(--text-dim)] font-medium mb-0.5 uppercase tracking-wider">Speed</p>
            <p className="text-xs font-bold" style={{ color: hovered ? rawColor : "var(--text-primary)" }}>
              {model.speed}
            </p>
          </div>
          <div className="w-px h-6" style={{ background: hovered ? rgba(0.3) : "var(--border)" }} />
          <div>
            <p className="text-[10px] text-[var(--text-dim)] font-medium mb-0.5 uppercase tracking-wider">Quality</p>
            <p className="text-xs font-bold" style={{ color: hovered ? rawColor : "var(--text-primary)" }}>
              {model.quality}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2">
          {model.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                style={{
                  background: hovered ? `${rawColor}20` : "transparent",
                  border: `1.5px solid ${hovered ? rgba(0.7) : rgba(0.3)}`,
                }}>
                <CheckCircle2 size={10} style={{ color: rawColor }} />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{f}</span>
            </div>
          ))}
        </div>

        {/* Bottom accent bar */}
        <div className="mt-4 h-0.5 rounded-full transition-all duration-500"
          style={{
            width: hovered ? "100%" : "2rem",
            background: `linear-gradient(90deg, ${rawColor}, ${rawColor}66)`,
            boxShadow: hovered ? `0 0 8px ${rgba(0.6)}` : "none",
          }} />
      </div>
    </div>
  );
}

// ─── TIP ACCORDION dengan efek hover keren ────────────────────
const TIP_COLORS = ["#7c6dfa", "#06b6d4", "#10b981", "#f59e0b"];

function TipAccordion({
  tip,
  index,
  isOpen,
  onToggle,
}: {
  tip: (typeof TIPS)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const color = TIP_COLORS[index % TIP_COLORS.length];
  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 124, g: 109, b: 250 };
  };
  const { r, g, b } = hexToRgb(color);
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  const onMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMouse(p => ({ ...p, opacity: 0 })); }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: hovered || isOpen
          ? `linear-gradient(135deg, ${rgba(0.08)} 0%, var(--bg-card) 50%, ${rgba(0.04)} 100%)`
          : "var(--bg-card)",
        border: isOpen
          ? `2px solid ${rgba(0.65)}`
          : hovered
          ? `2px solid ${rgba(0.45)}`
          : "1.5px solid var(--border)",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: isOpen
          ? `0 0 0 1px ${rgba(0.2)}, 0 6px 20px rgba(0,0,0,0.25), 0 0 60px ${rgba(0.12)}`
          : hovered
          ? `0 0 0 1px ${rgba(0.15)}, 0 4px 14px rgba(0,0,0,0.2)`
          : "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      {/* Spotlight */}
      <div className="pointer-events-none absolute inset-0"
        style={{ opacity: mouse.opacity, transition: "opacity 0.15s ease",
          background: `radial-gradient(280px circle at ${mouse.x}px ${mouse.y}px, ${rgba(0.18)}, transparent 65%)` }} />

      {/* Top glow bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{ height: isOpen || hovered ? "2.5px" : "0px",
          opacity: isOpen ? 1 : hovered ? 0.7 : 0,
          background: `linear-gradient(90deg, transparent, ${rgba(1)} 30%, ${rgba(0.8)} 70%, transparent)`,
          boxShadow: isOpen ? `0 0 12px ${rgba(0.8)}, 0 0 24px ${rgba(0.4)}` : "none" }} />

      {/* Left accent bar */}
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{ width: isOpen || hovered ? "3px" : "0px",
          opacity: isOpen ? 1 : 0.6,
          background: `linear-gradient(180deg, ${rgba(1)}, ${rgba(0.4)} 80%, transparent)` }} />

      {/* Accordion header / button */}
      <button
        onClick={onToggle}
        className="relative z-10 w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          {/* Number badge */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: hovered || isOpen ? `${color}20` : `${color}10`,
              border: `2px solid ${hovered || isOpen ? rgba(0.7) : rgba(0.25)}`,
              boxShadow: isOpen ? `0 0 10px ${rgba(0.5)}, inset 0 0 6px ${rgba(0.1)}` : "none",
            }}>
            <span className="text-sm font-extrabold" style={{ color, filter: isOpen ? `drop-shadow(0 0 6px ${rgba(0.9)})` : "none" }}>
              {tip.icon}
            </span>
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)] transition-all duration-200"
            style={{ color: isOpen || hovered ? "var(--text-primary)" : "var(--text-primary)" }}>
            {tip.title}
          </span>
        </div>
        <div className="shrink-0 transition-all duration-300"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: isOpen || hovered ? color : "var(--text-muted)",
            filter: isOpen ? `drop-shadow(0 0 6px ${rgba(0.8)})` : "none",
          }}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="relative z-10 px-6 pb-5"
          style={{ borderTop: `1px solid ${rgba(0.2)}` }}>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-4 mb-3">
            {tip.desc}
          </p>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              background: `${color}08`,
              border: `1px solid ${rgba(0.25)}`,
            }}>
            <span className="text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5"
              style={{ color }}>
              Contoh
            </span>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
              {tip.example}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FLOATING STARS BACKGROUND ───────────────────────────────
// Opacity values fixed (no Math.random) to avoid hydration mismatch
const STARS_GENERATE = [
  { id:0,  shape:"✦", color:"rgba(124,109,250,0.93)", size:20, left:11, top:7,  duration:6,    delay:0    },
  { id:1,  shape:"✸", color:"rgba(245,158,11,0.90)",  size:28, left:48, top:60, duration:8.8,  delay:-1.3 },
  { id:2,  shape:"·", color:"rgba(79,172,254,0.92)",  size:38, left:72, top:23, duration:11.6, delay:-2.6 },
  { id:3,  shape:"✦", color:"rgba(167,139,250,0.93)", size:20, left:22, top:80, duration:6,    delay:-3.9 },
  { id:4,  shape:"✸", color:"rgba(251,191,36,0.91)",  size:28, left:85, top:45, duration:8.8,  delay:-5.2 },
  { id:5,  shape:"·", color:"rgba(139,92,246,0.92)",  size:38, left:5,  top:35, duration:11.6, delay:-6.5 },
  { id:6,  shape:"✦", color:"rgba(124,109,250,0.90)", size:48, left:60, top:15, duration:14.5, delay:-7.8 },
  { id:7,  shape:"✸", color:"rgba(245,158,11,0.93)",  size:20, left:33, top:90, duration:6,    delay:-9.1 },
  { id:8,  shape:"·", color:"rgba(79,172,254,0.91)",  size:28, left:90, top:70, duration:8.8,  delay:-2.4 },
  { id:9,  shape:"✦", color:"rgba(167,139,250,0.92)", size:38, left:15, top:50, duration:11.6, delay:-4.7 },
  { id:10, shape:"✸", color:"rgba(251,191,36,0.90)",  size:48, left:55, top:82, duration:14.5, delay:-1.0 },
  { id:11, shape:"·", color:"rgba(139,92,246,0.93)",  size:56, left:78, top:30, duration:18.5, delay:-3.3 },
  { id:12, shape:"✦", color:"rgba(124,109,250,0.91)", size:20, left:40, top:5,  duration:6,    delay:-5.6 },
  { id:13, shape:"✸", color:"rgba(245,158,11,0.92)",  size:28, left:95, top:55, duration:8.8,  delay:-7.9 },
  { id:14, shape:"·", color:"rgba(79,172,254,0.93)",  size:38, left:28, top:68, duration:11.6, delay:-0.6 },
  { id:15, shape:"✦", color:"rgba(167,139,250,0.90)", size:48, left:65, top:40, duration:14.5, delay:-2.9 },
  { id:16, shape:"✸", color:"rgba(251,191,36,0.91)",  size:56, left:8,  top:92, duration:18.5, delay:-4.2 },
  { id:17, shape:"·", color:"rgba(139,92,246,0.92)",  size:66, left:50, top:18, duration:25.8, delay:-6.5 },
  { id:18, shape:"✦", color:"rgba(124,109,250,0.93)", size:20, left:82, top:75, duration:6,    delay:-8.8 },
  { id:19, shape:"✸", color:"rgba(245,158,11,0.91)",  size:28, left:3,  top:48, duration:8.8,  delay:-1.1 },
];

function FloatingStarsGenerate() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes star-float-gen {
          0%   { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateY(-28px) scale(1.15) rotate(180deg); }
          90%  { opacity: 1; }
          100% { transform: translateY(0px) scale(1) rotate(360deg); opacity: 0; }
        }
        @keyframes star-blink-gen {
          0%, 100% { opacity: 0.15; transform: scale(0.7) rotate(0deg); }
          25%  { opacity: 0.9; transform: scale(1.3) rotate(90deg); }
          50%  { opacity: 0.4; transform: scale(0.9) rotate(180deg); }
          75%  { opacity: 1; transform: scale(1.2) rotate(270deg); }
        }
        @keyframes star-drift-gen {
          0%   { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          40%  { transform: translate(18px, -22px) rotate(120deg); }
          60%  { transform: translate(-12px, -35px) rotate(240deg); }
          92%  { opacity: 1; }
          100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {STARS_GENERATE.map((star) => {
        const anim = star.id % 3 === 0
          ? `star-float-gen ${star.duration}s ${star.delay}s ease-in-out infinite`
          : star.id % 3 === 1
          ? `star-blink-gen ${star.duration * 0.8}s ${star.delay}s ease-in-out infinite`
          : `star-drift-gen ${star.duration * 1.1}s ${star.delay}s ease-in-out infinite`;
        return (
          <div
            key={star.id}
            style={{
              position: "absolute",
              left: `${star.left}%`,
              top: `${star.top}%`,
              color: star.color,
              fontSize: `${star.size}px`,
              animation: anim,
              userSelect: "none",
              lineHeight: 1,
              filter: `blur(${star.id % 4 === 0 ? 0.5 : 0}px) drop-shadow(0 0 ${star.size / 3}px ${star.color.replace(/,[\d.]+\)$/, ",0.8)")})`,
              willChange: "transform, opacity",
            }}
          >
            {star.shape}
          </div>
        );
      })}
    </div>
  );
}

function ImageGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState("hd");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const [genLimit, setGenLimit] = useState<LimitStatus | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState(searchParams.get("q") ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

  // ── Auth guard — redirect ke login jika belum login ────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/generate");
    }
  }, [status, router]);

  const token = (session as any)?.accessToken as string | undefined;

  // ── Fetch daily limit status on mount ──────────────────────────────────
  const fetchGenLimit = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/limits/status/generate", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setGenLimit(await res.json());
    } catch {
      // silent fail — limit badge simply won't show
    }
  };

  useEffect(() => {
    if (token) fetchGenLimit();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target as Node)
      ) {
        setShowUploadMenu(false);
      }
    };
    if (showUploadMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUploadMenu]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setShowUploadMenu(false);
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) => [
            ...prev,
            { id, file, previewUrl: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFiles((prev) => [...prev, { id, file, previewUrl: null }]);
      }
    });
  };

  const removeFile = (id: string) =>
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!token) {
      router.replace("/login?redirect=/generate");
      return;
    }

    // Daily limit check
    try {
      const limitRes = await fetch("http://127.0.0.1:8000/api/limits/check/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (limitRes.status === 429) {
        const limitErr = await limitRes.json();
        setErrorMessage(limitErr.detail ?? "Daily limit reached. Try again tomorrow.");
        return;
      }
    } catch {
      // If backend offline, skip limit check gracefully
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setErrorMessage(null);

    try {
      // Pakai FormData agar bisa kirim text + file sekaligus
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("model", selectedModel);

      // Lampirkan gambar referensi pertama jika ada (hanya ambil 1 gambar)
      const refImage = uploadedFiles.find((f) => f.file.type.startsWith("image/"));
      if (refImage) {
        formData.append("reference_image", refImage.file);
      }

      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMessage(err.detail ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }

      const data = await res.json();
      setGeneratedImage(data.image_url ?? null);
      // Refresh limit status after successful generation
      fetchGenLimit();
    } catch (e) {
      setErrorMessage("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] relative">
      <FloatingStarsGenerate />
      <Navbar hideCenterNav />

      {/* ─── HEADER ───────────────────────────────────────────── */}
      <div className="relative pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Background orbs */}
        <div
          className="absolute top-0 left-0 w-[600px] h-[350px] rounded-full blur-[130px] pointer-events-none opacity-25"
          style={{
            background:
              "radial-gradient(ellipse, rgba(124,109,250,0.6), transparent 70%)",
          }}
        />
        <div
          className="absolute top-10 right-1/4 w-[400px] h-[250px] rounded-full blur-[110px] pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(79,172,254,0.5), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            {/* Glowing icon badge */}
            <div
              className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,109,250,0.25), rgba(79,172,254,0.12))",
                border: "1px solid rgba(124,109,250,0.45)",
                boxShadow:
                  "0 0 24px rgba(124,109,250,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <Sparkles size={20} className="text-[var(--accent)]" />
              <div
                className="absolute inset-0 rounded-xl animate-ping opacity-15"
                style={{ background: "rgba(124,109,250,0.4)" }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-0.5">
                Generative AI
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                AI Image Generator
              </h1>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-[var(--border)] ml-12" />
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-sm">
            Create stunning product visuals from a text prompt using Stable
            Diffusion and GAN models.
          </p>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="px-6 md:px-12 pb-10 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* ── LEFT PANEL: Controls ── */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-[var(--border)]">
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-5">
                Create an image from text prompt
              </h2>

              {/* Prompt input */}
              <div className="prompt-input rounded-2xl p-2 mb-5">
                {/* File previews */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-2 pt-2 pb-1">
                    {uploadedFiles.map((uf) =>
                      uf.previewUrl ? (
                        <div
                          key={uf.id}
                          className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[var(--border)] shrink-0"
                        >
                          <img
                            src={uf.previewUrl}
                            alt={uf.file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                            <span className="text-[8px] text-white leading-tight truncate w-full">
                              {uf.file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(uf.id)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                          >
                            <X size={8} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <div
                          key={uf.id}
                          className="relative group flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] max-w-[180px] shrink-0"
                        >
                          <FileText
                            size={16}
                            className="text-[var(--accent)] shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[100px]">
                              {uf.file.name}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {formatSize(uf.file.size)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(uf.id)}
                            className="ml-1 w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-red-500/80 transition-colors shrink-0"
                          >
                            <X size={8} className="text-white" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {/* Row: Wand + Textarea */}
                <div className="flex items-center gap-3">
                  {/* Wand + Upload Menu */}
                  <div
                    className="relative flex items-center pl-3 shrink-0"
                    ref={uploadMenuRef}
                  >
                    <button
                      onClick={() => setShowUploadMenu((v) => !v)}
                      className={`transition-colors duration-200 ${showUploadMenu ? "text-[var(--accent)]" : "text-[var(--accent)] hover:text-[var(--accent)]/70"}`}
                      title="Upload file or photo"
                    >
                      <Wand2 size={22} />
                    </button>

                    {/* Popup Menu */}
                    {showUploadMenu && (
                      <div
                        className="absolute bottom-full left-0 mb-3 w-44 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden z-50"
                        style={{
                          boxShadow:
                            "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.1)",
                        }}
                      >
                        <div className="px-4 py-2.5 border-b border-[var(--border)]">
                          <p className="text-[10px] font-bold text-[var(--accent)] tracking-widest uppercase">
                            🎨 Remix / Style from
                          </p>
                          <p className="text-[9px] text-[var(--text-dim)] mt-0.5">
                            AI will use this as visual base
                          </p>
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/8 transition-colors duration-150"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                            <Paperclip
                              size={13}
                              className="text-[var(--accent)]"
                            />
                          </div>
                          <span className="font-medium">Remix from file</span>
                        </button>
                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/8 transition-colors duration-150"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                            <ImageIcon
                              size={13}
                              className="text-[var(--accent)]"
                            />
                          </div>
                          <span className="font-medium">Remix from photo</span>
                        </button>
                      </div>
                    )}

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <input
                      ref={photoInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>

                  {/* Textarea */}
                  <div className="flex-1 flex items-center py-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        uploadedFiles.some((f) =>
                          f.file.type.startsWith("image/"),
                        )
                          ? "Describe how to remix or transform this image..."
                          : "Describe what you'd like to generate..."
                      }
                      className="w-full bg-transparent outline-none border-none resize-none text-xl text-[var(--text-primary)] placeholder:text-[var(--text-dim)] leading-relaxed py-5"
                      rows={1}
                      style={{ caretColor: "var(--accent)" }}
                    />
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                {isGenerating ? (
                  <>
                    <Wand2 size={16} className="animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Daily Limit Badge */}
              {genLimit && (
                <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border mb-3 ${
                  genLimit.remaining === 0
                    ? "bg-red-500/8 border-red-500/20"
                    : "bg-[var(--bg-secondary)] border-[var(--border)]"
                }`}>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className={genLimit.remaining === 0 ? "text-red-400" : "text-[var(--accent)]"} />
                    <span className={`text-xs font-semibold ${genLimit.remaining === 0 ? "text-red-400" : "text-[var(--text-muted)]"}`}>
                      {genLimit.remaining === 0
                        ? "Daily limit reached · resets midnight UTC"
                        : `${genLimit.used_today}/${genLimit.daily_limit} uses today`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (genLimit.used_today / genLimit.daily_limit) * 100)}%`,
                          background: genLimit.remaining === 0
                            ? "linear-gradient(90deg, #ef4444, #f97316)"
                            : "var(--accent)",
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${genLimit.remaining === 0 ? "text-red-400" : "text-[var(--accent)]"}`}>
                      {genLimit.remaining} left
                    </span>
                  </div>
                </div>
              )}

              {/* Badge referensi gambar aktif */}
              {uploadedFiles.some((f) => f.file.type.startsWith("image/")) && (
                <div className="flex items-start gap-2 mb-8 px-3 py-2.5 rounded-xl bg-[var(--accent)]/8 border border-[var(--accent)]/20">
                  <Wand2
                    size={13}
                    className="text-[var(--accent)] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-[var(--accent)] font-bold leading-snug">
                      Remix Mode Enabled
                    </p>
                    <p className="text-[10px] text-[var(--accent)]/70 leading-relaxed mt-0.5">
                      AI will generate new visual variations based on this
                      image. Use a prompt to guide the output.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Choose a model ── */}
              <div className="mb-2">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Choose a model
                </p>
                <div className="flex items-center gap-2">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() =>
                        !model.locked && setSelectedModel(model.id)
                      }
                      disabled={model.locked}
                      className={`
                        relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                        ${
                          selectedModel === model.id && !model.locked
                            ? "btn-shimmer text-white"
                            : model.locked
                              ? "border border-[var(--border)] text-[var(--text-dim)] cursor-not-allowed opacity-60"
                              : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
                        }
                      `}
                    >
                      {model.locked && <Lock size={11} />}
                      {model.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL: Preview ── */}
            <div className="relative flex items-center justify-center p-8 md:p-10 min-h-[400px] md:min-h-0">
              <div className="absolute inset-0 grid-bg opacity-60 rounded-r-3xl" />

              {isGenerating ? (
                <div className="relative z-10 flex flex-col items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Sparkles
                      size={28}
                      className="text-[var(--accent)] animate-pulse"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Generating your image...
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      This may take a few seconds
                    </p>
                  </div>
                  <div className="w-48 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full 
                      ounded-full bg-[var(--accent)]"
                      style={{
                        animation: "shimmer 1.5s ease-in-out infinite",
                        background:
                          "linear-gradient(90deg, var(--accent) 0%, #9b8dfc 50%, var(--accent) 100%)",
                        backgroundSize: "200% auto",
                      }}
                    />
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <X size={28} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-400 mb-1">
                      Generation Failed
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-xs text-[var(--accent)] font-semibold hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : generatedImage ? (
                <div className="relative z-10 w-full max-w-sm">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-2xl border border-[var(--border)] shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/8 border border-[var(--accent)]/15 flex items-center justify-center">
                      <Sparkles
                        size={36}
                        className="text-[var(--accent)] opacity-60"
                      />
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-[var(--accent)]/5 blur-xl pointer-events-none" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">
                      Your image will appear here
                    </p>
                    <p className="text-xs text-[var(--text-dim)]">
                      Enter a prompt and click Generate
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ─── SECTION PENJELASAN ────────────────────────────────────
      ═══════════════════════════════════════════════════════════ */}
      <div className="px-6 md:px-12 pb-20 max-w-7xl mx-auto space-y-8 mt-6">
        {/* ── 1. KEUNGGULAN FITUR ── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Zap size={15} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Why use an AI Image Generator?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b, i) => (
              <SpotlightCard
                key={i}
                className="p-5"
                hex={b.hex}
                hex2={b.hex2}
                rgb={b.rgb}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `${b.hex}18`,
                    border: `1px solid ${b.hex}35`,
                  }}
                >
                  <b.icon size={16} style={{ color: b.hex }} />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                  {b.desc}
                </p>
                <div
                  className="h-0.5 rounded-full w-8 transition-all duration-500 group-hover:w-full"
                  style={{
                    background: `linear-gradient(90deg, ${b.hex}, ${b.hex2})`,
                  }}
                />
              </SpotlightCard>
            ))}
          </div>
        </div>

        {/* ── 2. PENJELASAN MODEL ── */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Crown size={15} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Pilih model yang tepat
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MODEL_INFO.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                isSelected={selectedModel === m.id}
              />
            ))}
          </div>
        </div>

        {/* ── 3. TIPS CARA PAKAI ── */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
              <Lightbulb size={15} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              How to write better prompts
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {TIPS.map((tip, i) => (
              <TipAccordion
                key={i}
                tip={tip}
                index={i}
                isOpen={openTip === i}
                onToggle={() => setOpenTip(openTip === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
      <Footer />
      <GuestLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense>
      <ImageGeneratorPage />
    </Suspense>
  );
}
