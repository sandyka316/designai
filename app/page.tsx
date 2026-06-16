"use client";

import { useState, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Sparkles,
  ImageIcon,
  ArrowRight,
  Wand2,
  Layers,
  Cpu,
  Star,
  Zap,
  FileText,
  X,
  Paperclip,
  BarChart2,
  PieChart,
  Search,
  Brain,
  Lightbulb,
  TrendingUp,
  SlidersHorizontal,
  GitBranch,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import AiDemoSection from "@/components/AiDemoSection";

const EXAMPLE_PROMPTS = [
  "Minimalist logo for a coffee brand",
  "Futuristic packaging for a tech startup",
  "Elegant UI card for fashion e-commerce",
  "Bold poster for a music festival",
];

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Image Generator",
    desc: "Generate high-quality product visuals from text using Stable Diffusion and GAN models.",
    color: { r: 124, g: 109, b: 250 }, // violet
    hex: "#7c6dfa",
    hex2: "#9b8dfc",
  },
  {
    icon: Wand2,
    title: "AI Recommendations",
    desc: "Hybrid filtering learns your preferences and surfaces designs tailored to your style.",
    color: { r: 45, g: 212, b: 191 }, // teal/cyan
    hex: "#2dd4bf",
    hex2: "#5eead4",
  },
  {
    icon: Layers,
    title: "Multi-Modal Input",
    desc: "Input via text, reference images, or style keywords. Context understood from all sources.",
    color: { r: 251, g: 146, b: 60 }, // orange/amber
    hex: "#fb923c",
    hex2: "#fbbf24",
  },
  {
    icon: Cpu,
    title: "ML-Powered Analysis",
    desc: "Deep learning analyzes design patterns, aesthetic quality, and market fit automatically.",
    color: { r: 167, g: 139, b: 250 }, // purple/rose
    hex: "#a78bfa",
    hex2: "#f472b6",
  },
];

const STEPS = [
  {
    title: "Describe Your Vision",
    desc: "Type a description of the design you need — style, category, target audience, and mood.",
    hex: "#06b6d4", // cyan
    hex2: "#3b82f6", // blue
    color: { r: 6, g: 182, b: 212 },
  },
  {
    title: "AI Generates & Recommends",
    desc: "DesignAI instantly generates visuals and surfaces relevant recommendations tailored to your input.",
    hex: "#8b5cf6", // violet
    hex2: "#ec4899", // pink
    color: { r: 139, g: 92, b: 246 },
  },
  {
    title: "Refine & Export",
    desc: "Iterate with feedback, adjust parameters, and export your final design ready for production.",
    hex: "#10b981", // emerald
    hex2: "#84cc16", // lime
    color: { r: 16, g: 185, b: 129 },
  },
];

const STATS = [
  { value: "10K+", label: "Designs Generated" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "< 3s", label: "Generation Time" },
];

// ─── TYPE ─────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string | null; // null = bukan image
}

// ─── FLOATING PARTICLES (full-page, fixed) ────────────────────
// Format: { id, shape, color, size, left, top, duration, delay }
// Using "·", "✦", "✸", "○", "◦" for variety
const PARTICLES = [
  // Stars & dots spread across full page (top + mid + bottom)
  { id: 0,  shape: "✦", color: "rgba(124,109,250,0.95)", size: 26, left: 8,  top: 5,  duration: 7,    delay: 0    },
  { id: 1,  shape: "·", color: "rgba(79,172,254,0.92)",  size: 50, left: 23, top: 12, duration: 11,   delay: -1.5 },
  { id: 2,  shape: "✸", color: "rgba(45,212,191,0.92)",  size: 34, left: 55, top: 8,  duration: 9.5,  delay: -2.8 },
  { id: 3,  shape: "○", color: "rgba(192,132,252,0.90)", size: 43, left: 80, top: 6,  duration: 14,   delay: -0.7 },
  { id: 4,  shape: "◦", color: "rgba(124,109,250,0.90)", size: 66, left: 92, top: 15, duration: 18,   delay: -3.2 },
  { id: 5,  shape: "✦", color: "rgba(251,191,36,0.95)",  size: 26, left: 6,  top: 30, duration: 6.5,  delay: -5.0 },
  { id: 6,  shape: "·", color: "rgba(167,139,250,0.95)", size: 55, left: 38, top: 22, duration: 13,   delay: -1.2 },
  { id: 7,  shape: "✸", color: "rgba(79,172,254,0.92)",  size: 29, left: 68, top: 35, duration: 8,    delay: -4.1 },
  { id: 8,  shape: "○", color: "rgba(45,212,191,0.90)",  size: 84, left: 15, top: 48, duration: 20,   delay: -0.4 },
  { id: 9,  shape: "◦", color: "rgba(124,109,250,0.92)", size: 36, left: 85, top: 42, duration: 10.5, delay: -6.3 },
  { id: 10, shape: "✦", color: "rgba(192,132,252,0.92)", size: 26, left: 47, top: 55, duration: 7.5,  delay: -2.0 },
  { id: 11, shape: "·", color: "rgba(251,191,36,0.92)",  size: 62, left: 72, top: 60, duration: 15,   delay: -3.8 },
  { id: 12, shape: "✸", color: "rgba(167,139,250,0.92)", size: 31, left: 28, top: 65, duration: 9,    delay: -7.5 },
  { id: 13, shape: "○", color: "rgba(79,172,254,0.90)",  size: 96, left: 5,  top: 72, duration: 22,   delay: -1.9 },
  { id: 14, shape: "◦", color: "rgba(124,109,250,0.92)", size: 40, left: 60, top: 78, duration: 12,   delay: -4.7 },
  { id: 15, shape: "✦", color: "rgba(45,212,191,0.95)",  size: 26, left: 90, top: 70, duration: 6,    delay: -0.3 },
  { id: 16, shape: "·", color: "rgba(192,132,252,0.92)", size: 46, left: 44, top: 85, duration: 11.5, delay: -5.6 },
  { id: 17, shape: "✸", color: "rgba(251,191,36,0.92)",  size: 34, left: 18, top: 90, duration: 8.5,  delay: -2.4 },
  { id: 18, shape: "○", color: "rgba(167,139,250,0.90)", size: 72, left: 75, top: 88, duration: 17,   delay: -6.8 },
  { id: 19, shape: "◦", color: "rgba(124,109,250,0.92)", size: 31, left: 52, top: 95, duration: 10,   delay: -1.0 },
  // Extra layer — denser spread
  { id: 20, shape: "✦", color: "rgba(79,172,254,0.92)",  size: 26, left: 33, top: 40, duration: 7,    delay: -3.5 },
  { id: 21, shape: "·", color: "rgba(124,109,250,0.95)", size: 41, left: 97, top: 52, duration: 12.5, delay: -0.9 },
  { id: 22, shape: "✸", color: "rgba(45,212,191,0.92)",  size: 26, left: 10, top: 58, duration: 9,    delay: -4.4 },
  { id: 23, shape: "○", color: "rgba(192,132,252,0.90)", size: 108,left: 63, top: 20, duration: 25,   delay: -7.1 },
  { id: 24, shape: "◦", color: "rgba(251,191,36,0.92)",  size: 36, left: 40, top: 72, duration: 11,   delay: -2.7 },
  { id: 25, shape: "✦", color: "rgba(167,139,250,0.95)", size: 26, left: 87, top: 28, duration: 6.5,  delay: -5.9 },
  { id: 26, shape: "·", color: "rgba(79,172,254,0.92)",  size: 55, left: 2,  top: 82, duration: 14,   delay: -1.6 },
  { id: 27, shape: "✸", color: "rgba(124,109,250,0.92)", size: 29, left: 56, top: 45, duration: 8,    delay: -3.0 },
  { id: 28, shape: "○", color: "rgba(45,212,191,0.90)",  size: 78, left: 78, top: 95, duration: 19,   delay: -0.5 },
  { id: 29, shape: "◦", color: "rgba(192,132,252,0.95)", size: 38, left: 31, top: 3,  duration: 10,   delay: -6.0 },
];

function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes particle-float {
          0%   { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateY(-30px) scale(1.2) rotate(180deg); }
          90%  { opacity: 1; }
          100% { transform: translateY(0px) scale(1) rotate(360deg); opacity: 0; }
        }
        @keyframes particle-blink {
          0%, 100% { opacity: 0.1; transform: scale(0.6) rotate(0deg); }
          25%  { opacity: 0.95; transform: scale(1.4) rotate(90deg); }
          50%  { opacity: 0.35; transform: scale(0.85) rotate(180deg); }
          75%  { opacity: 1;    transform: scale(1.25) rotate(270deg); }
        }
        @keyframes particle-drift {
          0%   { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          40%  { transform: translate(20px, -25px) rotate(120deg); }
          60%  { transform: translate(-14px, -40px) rotate(240deg); }
          92%  { opacity: 1; }
          100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0; }
        }
        @keyframes particle-orbit {
          0%   { transform: translate(0,0) scale(1); opacity: 0; }
          10%  { opacity: 0.8; }
          25%  { transform: translate(12px, -18px) scale(1.1); }
          50%  { transform: translate(22px, 0px) scale(0.9); opacity: 0.6; }
          75%  { transform: translate(10px, 16px) scale(1.05); }
          90%  { opacity: 0.8; }
          100% { transform: translate(0,0) scale(1); opacity: 0; }
        }
      `}</style>
      {PARTICLES.map((p) => {
        const animType = p.id % 4;
        const anim =
          animType === 0 ? `particle-float  ${p.duration}s ${p.delay}s ease-in-out infinite` :
          animType === 1 ? `particle-blink  ${p.duration * 0.85}s ${p.delay}s ease-in-out infinite` :
          animType === 2 ? `particle-drift  ${p.duration * 1.15}s ${p.delay}s ease-in-out infinite` :
                           `particle-orbit  ${p.duration * 1.3}s ${p.delay}s ease-in-out infinite`;
        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              color: p.color,
              fontSize: `${p.size}px`,
              animation: anim,
              userSelect: "none",
              lineHeight: 1,
              filter: `blur(${p.id % 5 === 0 ? 0.6 : 0}px) drop-shadow(0 0 ${Math.max(3, p.size / 4)}px ${p.color.replace(/,[\d.]+\)$/, ",0.9)")})`,
              willChange: "transform, opacity",
            }}
          >
            {p.shape}
          </div>
        );
      })}
    </div>
  );
}

// ─── SPOTLIGHT CARD ───────────────────────────────────────────
// Card dengan efek spotlight/glow BERWARNA yang mengikuti posisi kursor
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

  // Parse hex2 to rgb for secondary glow
  const hex2rgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 79, g: 172, b: 254 };
  };
  const c2 = hex2rgb(hex2);
  const rgba2 = (a: number) => `rgba(${c2.r},${c2.g},${c2.b},${a})`;

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}
      style={{
        background: isHovered
          ? `linear-gradient(135deg, ${rgba(0.1)} 0%, var(--bg-card) 45%, ${rgba2(0.08)} 100%)`
          : "var(--bg-card)",
        border: isHovered
          ? `1.5px solid ${rgba(0.8)}`
          : "1px solid var(--border)",
        transform: isHovered
          ? "translateY(-8px) scale(1.03)"
          : "translateY(0) scale(1)",
        transition:
          "background 0.35s ease, border-color 0.2s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
        boxShadow: isHovered
          ? `0 0 0 1px ${rgba(0.4)}, 0 6px 14px rgba(0,0,0,0.35), 0 20px 56px ${rgba(0.32)}, 0 0 90px ${rgba(0.12)}`
          : "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {/* Primary spotlight — card's own color */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity,
          transition: "opacity 0.15s ease",
          background: `radial-gradient(300px circle at ${spotlight.x}px ${spotlight.y}px, ${rgba(0.35)}, ${rgba(0.1)} 45%, transparent 70%)`,
        }}
      />

      {/* Secondary spotlight — complementary color, offset */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity * 0.65,
          transition: "opacity 0.2s ease",
          background: `radial-gradient(180px circle at ${spotlight.x + 25}px ${spotlight.y + 15}px, ${rgba2(0.25)}, transparent 65%)`,
        }}
      />

      {/* Top edge glow — card color gradient */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-250"
        style={{
          height: isHovered ? "2.5px" : "1px",
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent 0%, ${rgba(1)} 20%, ${rgba2(0.9)} 50%, ${rgba(1)} 80%, transparent 100%)`,
          boxShadow: isHovered
            ? `0 0 14px ${rgba(0.9)}, 0 0 28px ${rgba(0.5)}, 0 0 48px ${rgba(0.25)}`
            : "none",
        }}
      />

      {/* Bottom edge glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 transition-all duration-400"
        style={{
          height: isHovered ? "1.5px" : "1px",
          opacity: isHovered ? 0.65 : 0,
          background: `linear-gradient(90deg, transparent 15%, ${rgba2(0.8)} 50%, transparent 85%)`,
        }}
      />

      {/* Left edge accent line */}
      <div
        className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{
          width: isHovered ? "2px" : "0px",
          opacity: isHovered ? 0.7 : 0,
          background: `linear-gradient(180deg, ${rgba(0.8)}, ${rgba2(0.6)}, transparent)`,
        }}
      />

      {/* Corner glow — top left (primary color) */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-36 h-36 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.55)}, ${rgba(0.12)} 50%, transparent 70%)`,
        }}
      />

      {/* Corner glow — bottom right (secondary color) */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-36 h-36 transition-opacity duration-350"
        style={{
          opacity: isHovered ? 0.85 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba2(0.5)}, ${rgba2(0.1)} 50%, transparent 70%)`,
        }}
      />

      {/* Center bloom from bottom */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${rgba(0.18)}, transparent 70%)`,
        }}
      />

      {/* Subtle inner tint on the card body */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(145deg, ${rgba(0.06)} 0%, transparent 40%, ${rgba2(0.05)} 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState<number | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    // Encode prompt lalu redirect ke /generate dengan query ?q=
    router.push(`/generate?q=${encodeURIComponent(prompt.trim())}`);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Tutup menu saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target as Node)
      ) {
        setShowUploadMenu(false);
      }
    };
    if (showUploadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUploadMenu]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Proses file yang dipilih
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

  // Hapus file
  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Format ukuran file
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <FloatingParticles />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center grid-bg spotlight overflow-hidden pt-20 pb-36">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[var(--accent)]/3 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[var(--accent-secondary)]/3 rounded-full blur-[130px] pointer-events-none" />
        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 text-center">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-4 tag-pill text-xs font-semibold px-4 py-2 rounded-full mt-16 mb-10 tracking-widest">
            <Zap size={16} className="text-[var(--accent)]" />
            POWERED BY GENERATIVE AI & MACHINE LEARNING
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up delay-100 text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.85] tracking-tighter mb-10">
            Design<span className="text-[var(--accent)] glow-text">AI</span>
          </h1>

          {/* Subheading */}
          <p className="animate-slide-up delay-200 text-lg text-[var(--text-muted)] max-w-[44rem] mx-auto leading-relaxed mb-12">
            Transform your ideas into stunning visuals instantly.
            <br className="hidden md:block" />
            AI-powered design recommendations tailored for you.
          </p>

          {/* ─── PROMPT INPUT ─────────────────────────────────── */}
          <div
            className="animate-slide-up delay-400 w-full max-w-[780px] mx-auto mb-10"
            id="generator"
          >
            <div className="prompt-input rounded-3xl p-2 shadow-2xl">
              {/* ── File Preview Area (muncul di atas textarea) ── */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                  {uploadedFiles.map((uf) =>
                    uf.previewUrl ? (
                      /* IMAGE PREVIEW */
                      <div
                        key={uf.id}
                        className="relative group w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] shrink-0"
                      >
                        <img
                          src={uf.previewUrl}
                          alt={uf.file.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay nama */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-[8px] text-white leading-tight truncate w-full">
                            {uf.file.name}
                          </span>
                        </div>
                        {/* Tombol hapus */}
                        <button
                          onClick={() => removeFile(uf.id)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <X size={8} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      /* FILE (NON-IMAGE) PREVIEW */
                      <div
                        key={uf.id}
                        className="relative group flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] max-w-[200px] shrink-0"
                      >
                        <FileText
                          size={18}
                          className="text-[var(--accent)] shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                            {uf.file.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatSize(uf.file.size)}
                          </span>
                        </div>
                        {/* Tombol hapus */}
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

              {/* ── Row: Wand + Textarea + Button ── */}
              <div className="flex items-center gap-3">
                {/* Wand + Upload Menu */}
                <div
                  className="relative flex items-center pl-4 shrink-0"
                  ref={uploadMenuRef}
                >
                  <button
                    onClick={() => setShowUploadMenu((v) => !v)}
                    className={`transition-colors duration-200 ${
                      showUploadMenu
                        ? "text-[var(--accent)]"
                        : "text-[var(--accent)] hover:text-[var(--accent)]/70"
                    }`}
                    title="Upload file or photo"
                  >
                    <Wand2 size={28} />
                  </button>

                  {/* ── Popup Menu ── */}
                  {showUploadMenu && (
                    <div
                      className="absolute bottom-full left-0 mb-3 w-48 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden z-50"
                      style={{
                        boxShadow:
                          "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.1)",
                      }}
                    >
                      {/* Judul menu */}
                      <div className="px-4 py-2.5 border-b border-[var(--border)]">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                          Attach
                        </span>
                      </div>

                      {/* Add Files */}
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
                        <span className="font-medium">Add Files</span>
                      </button>

                      {/* Add Photo */}
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
                        <span className="font-medium">Add Photo</span>
                      </button>
                    </div>
                  )}

                  {/* Hidden file inputs */}
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
                    ref={textareaRef}
                    value={prompt}
                    onChange={handleChange}
                    placeholder="Describe what you'd like to generate..."
                    rows={1}
                    className="w-full bg-transparent outline-none border-none resize-none text-xl text-[var(--text-primary)] placeholder:text-[var(--text-dim)] leading-relaxed py-5"
                    style={{ caretColor: "var(--accent)" }}
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="btn-shimmer flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0"
                >
                  Generate <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Example prompts */}
          <div className="animate-slide-up delay-500 flex flex-wrap justify-center gap-2 mt-2 mb-10">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(p);
                  setActivePrompt(i);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  activePrompt === i && prompt === p
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="animate-slide-up delay-600 flex items-center justify-center gap-24 md:gap-32 mb-24">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tighter">
                  {stat.value}
                </span>
                <span className="text-sm text-[var(--text-muted)] mt-2 font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 text-[var(--text-dim)]">
          <span className="text-sm font-semibold tracking-[0.35em] uppercase">
            Scroll to explore
          </span>
          <div
            className="w-px h-14 bg-gradient-to-b from-[var(--accent)]/80 via-[var(--accent)]/40 to-transparent"
            style={{ animation: "scroll-indicator 2.8s ease-in-out infinite" }}
          />
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              <Star size={11} className="text-[var(--accent)]" />
              Core Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
              Everything you need to design
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto leading-relaxed">
              From concept to final output — DesignAI handles every step of the
              creative process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => (
              <SpotlightCard
                key={i}
                className="p-7"
                hex={feat.hex}
                hex2={feat.hex2}
                rgb={feat.color}
              >
                {/* Icon box — warna unik per card */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
                  style={{
                    background: `${feat.hex}18`,
                    border: `1px solid ${feat.hex}35`,
                  }}
                >
                  <feat.icon size={18} style={{ color: feat.hex }} />
                </div>
                {/* Title dengan warna card */}
                <h3
                  className="text-base font-bold mb-2.5 transition-colors duration-200"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feat.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {feat.desc}
                </p>
                {/* Bottom accent bar */}
                <div
                  className="mt-5 h-0.5 rounded-full w-12 transition-all duration-500 group-hover:w-full"
                  style={{
                    background: `linear-gradient(90deg, ${feat.hex}, ${feat.hex2})`,
                  }}
                />
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ADVANCED FEATURES ────────────────────────────────── */}
      <section className="py-20 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              <Sparkles size={11} className="text-[var(--accent)]" />
              Advanced Tools
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
              Powerful features at your fingertips
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto leading-relaxed">
              Go beyond generation — explore AI-powered analytics, insights, and intelligent design tools.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: BarChart2,
                title: "Analytics Dashboard",
                desc: "Track your design generation history, usage trends, model performance metrics, and generation time insights — all in one beautiful dashboard.",
                href: "/analytics",
                hex: "#06b6d4",
                hex2: "#3b82f6",
                rgb: { r: 6, g: 182, b: 212 },
                tag: "Analytics",
              },
              {
                icon: PieChart,
                title: "BI Dashboard",
                desc: "Business intelligence powered by Apriori association rules and statistical analysis. Discover design patterns, popular style combinations, and market trends.",
                href: "/admin/bi",
                hex: "#f59e0b",
                hex2: "#ef4444",
                rgb: { r: 245, g: 158, b: 11 },
                tag: "Business Intel",
              },
              {
                icon: Search,
                title: "Semantic Search",
                desc: "Find designs by meaning, not just keywords. Uses CLIP embeddings (512-dim) and Vector Space Model cosine similarity to retrieve semantically related designs.",
                href: "/semantic-search",
                hex: "#8b5cf6",
                hex2: "#6366f1",
                rgb: { r: 139, g: 92, b: 246 },
                tag: "VSM · CLIP",
              },
              {
                icon: Lightbulb,
                title: "Smart Prompt",
                desc: "AI-enhanced prompt engineering tools: evolve your prompts, predict ratings before generating, and estimate credit scores with fuzzy logic.",
                href: "/smart-prompt",
                hex: "#10b981",
                hex2: "#84cc16",
                rgb: { r: 16, g: 185, b: 129 },
                tag: "Prompt AI",
              },
              {
                icon: Brain,
                title: "Deep Learning Insights",
                desc: "LSTM-based time-series forecasting of design trends combined with CLIP image analysis. Understand aesthetic patterns and predict future design directions.",
                href: "/deep-learning",
                hex: "#ec4899",
                hex2: "#f43f5e",
                rgb: { r: 236, g: 72, b: 153 },
                tag: "LSTM · CLIP",
              },
              {
                icon: SlidersHorizontal,
                title: "Rating Predictor",
                desc: "Predict the quality rating of a design prompt before generating it. Uses a trained ML model to score prompts from 1–5 based on historical patterns.",
                href: "/smart-prompt/rating-predictor",
                hex: "#f97316",
                hex2: "#fbbf24",
                rgb: { r: 249, g: 115, b: 22 },
                tag: "ML Score",
              },
              {
                icon: GitBranch,
                title: "Prompt Evolution",
                desc: "Automatically evolve and improve your design prompts using AI-driven mutation and selection. Generate multiple prompt variants and pick the best.",
                href: "/smart-prompt/prompt-evolution",
                hex: "#a78bfa",
                hex2: "#7c3aed",
                rgb: { r: 167, g: 139, b: 250 },
                tag: "Genetic AI",
              },
              {
                icon: TrendingUp,
                title: "AI Recommendations",
                desc: "Hybrid collaborative + content-based filtering learns your aesthetic preferences over time and surfaces design recommendations tailored to your unique style.",
                href: "/recommendation",
                hex: "#2dd4bf",
                hex2: "#5eead4",
                rgb: { r: 45, g: 212, b: 191 },
                tag: "Hybrid Filter",
              },
              {
                icon: Layers,
                title: "Fuzzy Credit Score",
                desc: "Estimate your design credit score using fuzzy logic membership functions. Understand how your usage patterns and design quality translate into a trust score.",
                href: "/smart-prompt/fuzzy-credit",
                hex: "#64748b",
                hex2: "#94a3b8",
                rgb: { r: 100, g: 116, b: 139 },
                tag: "Fuzzy Logic",
              },
            ].map((feat) => (
              <a
                key={feat.title}
                href={feat.href}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 transition-all duration-400 hover:border-opacity-80 hover:shadow-2xl hover:-translate-y-1 block"
                style={
                  {
                    "--feat-hex": feat.hex,
                    "--feat-hex2": feat.hex2,
                    "--feat-r": feat.rgb.r,
                    "--feat-g": feat.rgb.g,
                    "--feat-b": feat.rgb.b,
                  } as React.CSSProperties
                }
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = feat.hex + "80";
                  el.style.boxShadow = `0 0 0 1px ${feat.hex}40, 0 8px 32px rgba(0,0,0,0.4), 0 20px 60px rgba(${feat.rgb.r},${feat.rgb.g},${feat.rgb.b},0.25)`;
                  el.style.background = `linear-gradient(135deg, rgba(${feat.rgb.r},${feat.rgb.g},${feat.rgb.b},0.08) 0%, var(--bg-card) 50%)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = "";
                  el.style.boxShadow = "";
                  el.style.background = "";
                }}
              >
                {/* Top edge glow */}
                <div
                  className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feat.hex}, ${feat.hex2}, transparent)`,
                    boxShadow: `0 0 12px ${feat.hex}`,
                  }}
                />

                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${feat.hex}18`,
                    border: `1px solid ${feat.hex}35`,
                  }}
                >
                  <feat.icon size={18} style={{ color: feat.hex }} />
                </div>

                {/* Tag */}
                <div className="mb-3">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                    style={{
                      color: feat.hex,
                      background: `${feat.hex}18`,
                      border: `1px solid ${feat.hex}30`,
                    }}
                  >
                    {feat.tag}
                  </span>
                </div>

                {/* Title — gets bold/bright on hover */}
                <h3
                  className="text-base font-semibold mb-2.5 transition-all duration-200 group-hover:font-extrabold"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent transition-all duration-200"
                    style={
                      {
                        "--tw-gradient-from": feat.hex,
                        "--tw-gradient-to": feat.hex2,
                      } as React.CSSProperties
                    }
                  >
                    {feat.title}
                  </span>
                </h3>

                {/* Desc — slightly brighter on hover */}
                <p className="text-sm text-[var(--text-muted)] leading-relaxed transition-colors duration-200 group-hover:text-zinc-300">
                  {feat.desc}
                </p>

                {/* Bottom accent bar */}
                <div
                  className="mt-5 h-0.5 rounded-full w-10 transition-all duration-500 group-hover:w-full"
                  style={{
                    background: `linear-gradient(90deg, ${feat.hex}, ${feat.hex2})`,
                  }}
                />

                {/* Arrow hint */}
                <div
                  className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: feat.hex }}
                >
                  <ArrowRight size={16} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
              How it works
            </h2>
            <p className="text-[var(--text-muted)] text-lg">
              Three simple steps to your perfect design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-transparent via-[var(--accent)]/25 to-transparent pointer-events-none" />

            {STEPS.map((step, i) => (
              <SpotlightCard
                key={i}
                className="p-7 flex flex-col items-center text-center"
                hex={step.hex}
                hex2={step.hex2}
                rgb={step.color}
              >
                {/* Step number badge — warna unik */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-md shrink-0 transition-all duration-300"
                  style={{
                    background: `${step.hex}14`,
                    border: `1.5px solid ${step.hex}40`,
                  }}
                >
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: step.hex }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${step.hex}20, transparent 70%)`,
                    }}
                  />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {step.desc}
                </p>
                {/* Bottom accent bar */}
                <div
                  className="mt-5 h-0.5 rounded-full w-10 transition-all duration-500 group-hover:w-3/4"
                  style={{
                    background: `linear-gradient(90deg, ${step.hex}, ${step.hex2})`,
                  }}
                />
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <AiDemoSection />

      {/* ─── CTA BOTTOM ───────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-14 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/6 via-transparent to-[var(--accent-secondary)]/4 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/45 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 tracking-wide uppercase">
                <Sparkles size={11} className="text-[var(--accent)]" />
                Start Free Today
              </div>

              <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-5 tracking-tight">
                Ready to design smarter?
              </h2>
              <p className="text-[var(--text-muted)] text-base leading-relaxed mb-10 max-w-sm mx-auto">
                Join thousands of designers, UMKM owners, and creatives already
                using DesignAI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push("/generate")}
                  className="btn-shimmer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white"
                >
                  Start Generating for Free
                  <ArrowRight size={14} />
                </button>
                <a
                  href="#ai-demo"
                  className="btn-outline flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                >
                  View Examples
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
