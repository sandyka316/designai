"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ImageIcon,
  Wand2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// ─── DATA ────────────────────────────────────────────────────────
// Untuk menambah gambar baru: tambahkan object ke array `images` di tab yang sesuai
const TABS = [
  {
    id: "recommend",
    label: "AI Recommendation",
    icon: Wand2,
    badge: "Image → Products",
    href: "/recommendation",
    description:
      "Upload any reference image — artwork, mood board, or photo. Our AI reads the style, colors, and mood, then instantly recommends matching fashion products.",
    images: [
      {
        src: "/images/image recommendations.png",
        alt: "AI recommendation demo — galaxy artwork to fashion products",
        caption: "Galaxy artwork → 8 fashion products",
      },
      {
        src: "/images/image recommendations2.png",
        alt: "AI recommendation demo — Medical healthcare to fashion products",
        caption: "Medical healthcare → 8 fashion products",
      },
    ],
  },
  {
    id: "generate",
    label: "AI Image Generator",
    icon: ImageIcon,
    badge: "Text → Image",
    href: "/generate",
    description:
      "Describe your product in words. Our AI generates a photorealistic, studio-quality image ready for commercial use — no photographer needed.",
    images: [
      {
        src: "/images/text to images.png",
        alt: "AI image generator demo — earth tone backpack from text prompt",
        caption: "Text prompt → product photo",
      },
      {
        src: "/images/text to images2.png",
        alt: "AI image generator demo — white sneakers from text prompt",
        caption: "Text prompt → product photo",
      },
    ],
  },
];

// ─── CAROUSEL per tab ────────────────────────────────────────────
function Carousel({
  images,
  paused,
}: {
  images: (typeof TABS)[0]["images"];
  paused: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const total = images.length;

  const goTo = useCallback(
    (index: number, dir: "left" | "right") => {
      if (animating || total <= 1) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent((index + total) % total);
        setAnimating(false);
      }, 280);
    },
    [animating, total],
  );

  const next = useCallback(() => goTo(current + 1, "right"), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, "left"), [current, goTo]);

  // Reset ke slide 0 saat gambar berubah (pindah tab)
  useEffect(() => {
    setCurrent(0);
  }, [images]);

  // Auto-slide tiap 5 detik
  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [paused, next, total]);

  const img = images[current];

  return (
    <div className="relative w-full bg-[var(--bg-secondary)] overflow-hidden">
      {/* ── Gambar ── */}
      <div
        className={`transition-all duration-280 ease-out ${
          animating
            ? direction === "right"
              ? "opacity-0 translate-x-6"
              : "opacity-0 -translate-x-6"
            : "opacity-100 translate-x-0"
        }`}
      >
        <img
          src={img.src}
          alt={img.alt}
          className="w-full h-auto object-contain max-h-[580px]"
        />
      </div>

      {/* Gradient bawah */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[var(--bg-card)] to-transparent pointer-events-none" />

      {/* Caption badge */}
      {img.caption && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)]/80 border border-[var(--border)] backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] whitespace-nowrap">
            {img.caption}
          </span>
        </div>
      )}

      {/* ── Arrow navigasi manual — hanya muncul kalau ada >1 gambar ── */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--bg-card)]/80 border border-[var(--border)] backdrop-blur-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:scale-105 transition-all duration-200"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--bg-card)]/80 border border-[var(--border)] backdrop-blur-sm flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:scale-105 transition-all duration-200"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* ── Dot indicators — hanya muncul kalau ada >1 gambar ── */}
      {total > 1 && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? "right" : "left")}
              aria-label={`Go to image ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                current === i
                  ? "w-5 h-1.5 bg-[var(--accent)]"
                  : "w-1.5 h-1.5 bg-[var(--border)] hover:bg-[var(--text-dim)]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function AiDemoSection() {
  const [activeTab, setActiveTab] = useState<"recommend" | "generate">(
    "recommend",
  );
  const [paused, setPaused] = useState(false);

  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="ai-demo" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      {/* ── Section header ── */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 tag-pill px-4 py-1.5 rounded-full text-xs font-semibold mb-5">
          <Sparkles size={12} />
          Live Demo
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
          What Our AI{" "}
          <span className="text-[var(--accent)] glow-text">Can Do</span>
        </h2>
        <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Two powerful tools, one platform. See real input → output results
          below.
        </p>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "recommend" | "generate")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Demo card ── */}
      <div
        className="feature-card rounded-3xl overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Badge bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--accent)]/4">
          <div className="flex items-center gap-2">
            <active.icon size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
              {active.badge}
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-medium">
            Real output · No filters
          </span>
        </div>

        {/* Carousel */}
        <Carousel images={active.images} paused={paused} />

        {/* Description strip */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-lg">
            {active.description}
          </p>
          <a
            href={active.href}
            className="btn-shimmer flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shrink-0 self-start sm:self-auto"
          >
            Try it yourself
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

      {/* ── Divider before CTA ── */}
      <div className="divider-glow mt-24" />
    </section>
  );
}
