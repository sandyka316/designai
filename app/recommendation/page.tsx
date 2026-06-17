"use client";

import { useState, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Sparkles,
  Upload,
  X,
  ImageIcon,
  Wand2,
  ArrowRight,
  Copy,
  Check,
  Palette,
  Tag,
  Eye,
  ShoppingBag,
  ChevronRight,
  Lightbulb,
  Zap,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuestLimitModal from "@/components/GuestLimitModal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── TYPES ─────────────────────────────────────────────────────
interface ProductResult {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  image_url: string;
  success: boolean;
}

interface AnalysisResult {
  dominantColors: string[];
  style: string;
  keyElements: string;
  mood: string;
  keywords: string[];
  generatedPrompt: string;
  products: ProductResult[];
}

interface ManualResult {
  dominantColors: string[];
  style: string;
  keyElements: string;
  mood: string;
  keywords: string[];
  generatedPrompt: string;
  products: ProductResult[];
}

const FEATURES = [
  { icon: Eye, label: "AI-Powered Image Understanding" },
  { icon: Palette, label: "Style & Color Extraction" },
  { icon: Sparkles, label: "Smart Recommendation Engine" },
  { icon: ShoppingBag, label: "Multi-Product Generation" },
  { icon: Lightbulb, label: "Trend-Aware Suggestions" },
];

// ─── FLOATING STARS BACKGROUND ───────────────────────────────
// Static values (no Math.random) to avoid hydration mismatch
const STARS_REC = [
  { id:0,  shape:"✦", color:"rgba(45,212,191,0.93)",  size:20, left:7,  top:13, duration:7,    delay:0    },
  { id:1,  shape:"✸", color:"rgba(139,92,246,0.90)",  size:28, left:48, top:72, duration:9.5,  delay:-1.7 },
  { id:2,  shape:"✺", color:"rgba(6,182,212,0.92)",   size:38, left:89, top:31, duration:12,   delay:-3.4 },
  { id:3,  shape:"·", color:"rgba(167,139,250,0.93)", size:20, left:30, top:86, duration:7,    delay:-5.1 },
  { id:4,  shape:"✦", color:"rgba(94,234,212,0.91)",  size:28, left:71, top:54, duration:9.5,  delay:-6.8 },
  { id:5,  shape:"✸", color:"rgba(196,181,253,0.92)", size:38, left:13, top:42, duration:12,   delay:-8.5 },
  { id:6,  shape:"✺", color:"rgba(45,212,191,0.90)",  size:48, left:55, top:20, duration:14.5, delay:-0.5 },
  { id:7,  shape:"·", color:"rgba(139,92,246,0.93)",  size:20, left:96, top:65, duration:7,    delay:-2.2 },
  { id:8,  shape:"✦", color:"rgba(6,182,212,0.91)",   size:28, left:22, top:95, duration:9.5,  delay:-3.9 },
  { id:9,  shape:"✸", color:"rgba(167,139,250,0.92)", size:38, left:63, top:38, duration:12,   delay:-5.6 },
  { id:10, shape:"✺", color:"rgba(94,234,212,0.90)",  size:48, left:38, top:77, duration:14.5, delay:-7.3 },
  { id:11, shape:"·", color:"rgba(196,181,253,0.93)", size:56, left:80, top:10, duration:19.5, delay:-9.0 },
  { id:12, shape:"✦", color:"rgba(45,212,191,0.91)",  size:20, left:5,  top:58, duration:7,    delay:-1.2 },
  { id:13, shape:"✸", color:"rgba(139,92,246,0.92)",  size:28, left:46, top:27, duration:9.5,  delay:-4.6 },
  { id:14, shape:"✺", color:"rgba(6,182,212,0.93)",   size:38, left:74, top:83, duration:12,   delay:-6.3 },
  { id:15, shape:"·", color:"rgba(167,139,250,0.90)", size:48, left:18, top:49, duration:14.5, delay:-8.0 },
  { id:16, shape:"✦", color:"rgba(94,234,212,0.91)",  size:56, left:92, top:71, duration:19.5, delay:-2.7 },
  { id:17, shape:"✸", color:"rgba(196,181,253,0.92)", size:66, left:35, top:16, duration:26.2, delay:-4.4 },
  { id:18, shape:"✺", color:"rgba(45,212,191,0.93)",  size:20, left:58, top:93, duration:7,    delay:-6.1 },
  { id:19, shape:"·", color:"rgba(139,92,246,0.91)",  size:28, left:2,  top:35, duration:9.5,  delay:-7.8 },
];

function FloatingStarsRec() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes star-float-rec {
          0%   { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0; }
          12%  { opacity: 1; }
          50%  { transform: translateY(-32px) scale(1.2) rotate(180deg); }
          88%  { opacity: 1; }
          100% { transform: translateY(0px) scale(1) rotate(360deg); opacity: 0; }
        }
        @keyframes star-blink-rec {
          0%, 100% { opacity: 0.12; transform: scale(0.65) rotate(0deg); }
          30%  { opacity: 1; transform: scale(1.35) rotate(108deg); }
          55%  { opacity: 0.35; transform: scale(0.85) rotate(216deg); }
          80%  { opacity: 0.95; transform: scale(1.15) rotate(324deg); }
        }
        @keyframes star-drift-rec {
          0%   { transform: translate(0px, 0px) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          35%  { transform: translate(-20px, -25px) rotate(130deg); }
          65%  { transform: translate(15px, -38px) rotate(260deg); }
          90%  { opacity: 1; }
          100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0; }
        }
      `}</style>
      {STARS_REC.map((star) => {
        const anim = star.id % 3 === 0
          ? `star-float-rec ${star.duration}s ${star.delay}s ease-in-out infinite`
          : star.id % 3 === 1
          ? `star-blink-rec ${star.duration * 0.85}s ${star.delay}s ease-in-out infinite`
          : `star-drift-rec ${star.duration * 1.15}s ${star.delay}s ease-in-out infinite`;
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
              filter: `blur(${star.id % 5 === 0 ? 0.6 : 0}px) drop-shadow(0 0 ${star.size / 3}px ${star.color.replace(/,[\d.]+\)$/, ",0.9)")})`,
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
          ? "translateY(-6px) scale(1.02)"
          : "translateY(0) scale(1)",
        transition:
          "background 0.35s ease, border-color 0.2s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
        boxShadow: isHovered
          ? `0 0 0 1px ${rgba(0.4)}, 0 6px 14px rgba(0,0,0,0.3), 0 20px 56px ${rgba(0.28)}, 0 0 80px ${rgba(0.1)}`
          : "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity,
          transition: "opacity 0.15s ease",
          background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, ${rgba(0.32)}, ${rgba(0.08)} 45%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity * 0.6,
          transition: "opacity 0.2s ease",
          background: `radial-gradient(160px circle at ${spotlight.x + 20}px ${spotlight.y + 12}px, ${rgba2(0.22)}, transparent 65%)`,
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300"
        style={{
          height: isHovered ? "2.5px" : "1px",
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent 0%, ${rgba(1)} 20%, ${rgba2(0.9)} 50%, ${rgba(1)} 80%, transparent 100%)`,
          boxShadow: isHovered
            ? `0 0 12px ${rgba(0.9)}, 0 0 24px ${rgba(0.5)}`
            : "none",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 left-0 w-32 h-32 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.9 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.5)}, ${rgba(0.1)} 50%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-32 h-32 transition-opacity duration-350"
        style={{
          opacity: isHovered ? 0.8 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba2(0.45)}, ${rgba2(0.08)} 50%, transparent 70%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${rgba(0.16)}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recLimit, setRecLimit] = useState<{ used_today: number; daily_limit: number; remaining: number } | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Dual mode state ───────────────────────────────────────────────────────
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualPrompt, setManualPrompt] = useState("");
  const [isManualAnalyzing, setIsManualAnalyzing] = useState(false);
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/recommendation");
    }
  }, [status, router]);

  const token = (session as any)?.accessToken as string | undefined;

  // ── Fetch daily limit status on mount ────────────────────────────────
  const fetchRecLimit = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/limits/status/recommendation", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRecLimit(await res.json());
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    if (token) fetchRecLimit();
  }, [token]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    if (!token) {
      router.replace("/login?redirect=/recommendation");
      return;
    }

    // Daily limit check
    try {
      const limitRes = await fetch("http://127.0.0.1:8000/api/limits/check/recommendation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (limitRes.status === 429) {
        const limitErr = await limitRes.json();
        setErrorMessage(limitErr.detail ?? "Daily limit reached (2/day). Try again tomorrow.");
        return;
      }
    } catch {
      // silent — if backend unreachable, allow proceed
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("http://localhost:8000/api/recommendation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        const msg = err.detail ?? "Terjadi kesalahan. Silakan coba lagi.";
        console.error("Recommendation error:", msg);
        setErrorMessage(msg);
        setIsAnalyzing(false);
        return;
      }

      const data = await res.json();

      setAnalysisResult({
        dominantColors: data.dominant_colors ?? [],
        style: data.style ?? "",
        keyElements: data.key_elements ?? "",
        mood: data.mood ?? "",
        keywords: data.keywords ?? [],
        generatedPrompt:
          data.products?.find((p: ProductResult) => p.success)?.prompt ?? "",
        products: data.products ?? [],
      });
      fetchRecLimit();
    } catch (e) {
      console.error("Network error:", e);
      setErrorMessage("Gagal terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  // ── Manual Mode: gambar + arahan user → AI pilih produk ─────────────────
  const handleManualAnalyze = async () => {
    if (!uploadedFile || !manualPrompt.trim()) return;
    if (!token) {
      router.replace("/login?redirect=/recommendation");
      return;
    }

    // Daily limit check
    try {
      const limitRes = await fetch("http://127.0.0.1:8000/api/limits/check/recommendation", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (limitRes.status === 429) {
        const limitErr = await limitRes.json();
        setManualError(limitErr.detail ?? "Daily limit reached. Try again tomorrow.");
        return;
      }
    } catch { /* silent */ }

    setIsManualAnalyzing(true);
    setManualResult(null);
    setManualError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("prompt", manualPrompt.trim());

      const res = await fetch("http://127.0.0.1:8000/api/recommendation/manual", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setManualError(err.detail ?? "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      const data = await res.json();
      setManualResult({
        dominantColors: data.dominant_colors ?? [],
        style: data.style ?? "",
        keyElements: data.key_elements ?? "",
        mood: data.mood ?? "",
        keywords: data.keywords ?? [],
        generatedPrompt:
          data.products?.find((p: ProductResult) => p.success)?.prompt ?? "",
        products: data.products ?? [],
      });
      fetchRecLimit();
    } catch (e) {
      setManualError("Gagal terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setIsManualAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] relative">
      <FloatingStarsRec />
      <Navbar hideCenterNav />

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="relative pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Decorative background orbs */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{
            background:
              "radial-gradient(ellipse, rgba(124,109,250,0.5), transparent 70%)",
          }}
        />
        <div
          className="absolute top-10 left-1/3 w-[300px] h-[200px] rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(45,212,191,0.6), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            {/* Animated icon badge */}
            <div
              className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,109,250,0.2), rgba(45,212,191,0.1))",
                border: "1px solid rgba(124,109,250,0.4)",
                boxShadow:
                  "0 0 20px rgba(124,109,250,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <Wand2 size={20} className="text-[var(--accent)]" />
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-xl animate-ping opacity-20"
                style={{ background: "rgba(124,109,250,0.3)" }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-0.5">
                AI-Powered
              </p>
              <h1 className="text-xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                AI Recommendations
              </h1>
            </div>
          </div>
          <div className="hidden md:block w-px h-12 bg-[var(--border)] -ml-2" />
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-sm">
            Upload a reference image and let AI analyze its style, colors, and
            mood.
          </p>
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────────────── */}
      <div className="px-6 md:px-12 pb-20 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* ── LEFT PANEL: Input ── */}
            <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-[var(--border)]">

              {/* ── MODE TOGGLE ────────────────────────────────────── */}
              <div
                className="flex items-center gap-1 p-1 rounded-xl mb-7"
                style={{
                  background: "rgba(124,109,250,0.06)",
                  border: "1px solid rgba(124,109,250,0.15)",
                }}
              >
                <button
                  id="btn-mode-auto"
                  onClick={() => { setMode("auto"); setManualResult(null); setManualError(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
                  style={mode === "auto" ? {
                    background: "linear-gradient(135deg, rgba(124,109,250,0.25), rgba(45,212,191,0.12))",
                    color: "var(--accent)",
                    border: "1px solid rgba(124,109,250,0.3)",
                    boxShadow: "0 2px 8px rgba(124,109,250,0.15)",
                  } : {
                    color: "var(--text-muted)",
                    border: "1px solid transparent",
                  }}
                >
                  <ImageIcon size={13} />
                  Auto Mode
                </button>
                <button
                  id="btn-mode-manual"
                  onClick={() => { setMode("manual"); setAnalysisResult(null); setManualResult(null); setManualError(null); setErrorMessage(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
                  style={mode === "manual" ? {
                    background: "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(124,109,250,0.12))",
                    color: "var(--accent-teal, #2dd4bf)",
                    border: "1px solid rgba(45,212,191,0.3)",
                    boxShadow: "0 2px 8px rgba(45,212,191,0.12)",
                  } : {
                    color: "var(--text-muted)",
                    border: "1px solid transparent",
                  }}
                >
                  <Wand2 size={13} />
                  Manual Mode
                </button>
              </div>

              <div className="flex items-center gap-2 mb-6">
                {mode === "auto" ? (
                  <>
                    <ImageIcon size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">Input</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">— Reference Image</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">Input</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">— Image + Direction</span>
                  </>
                )}
              </div>

              {/* ── MANUAL MODE: prompt textarea (appears below image upload) ── */}
              {mode === "manual" && (
                <div className="mb-5">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 block">
                    🎯 Arahan / Direction
                  </label>
                  <textarea
                    id="manual-prompt-input"
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="Contoh: buat versi streetwear modern, jadikan gothic dark, ubah jadi batik premium..."
                    rows={4}
                    className="w-full rounded-2xl p-4 text-sm resize-none outline-none transition-all duration-200"
                    style={{
                      background: "rgba(124,109,250,0.04)",
                      border: "1.5px solid rgba(124,109,250,0.2)",
                      color: "var(--text-primary)",
                      lineHeight: "1.6",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(124,109,250,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,109,250,0.08)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(124,109,250,0.2)"; e.target.style.boxShadow = "none"; }}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleManualAnalyze(); }}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Gambar memberi visual, arahan memberi arah produk. AI menggabungkan keduanya ✨
                  </p>

                  <button
                    id="btn-manual-analyze"
                    onClick={handleManualAnalyze}
                    disabled={isManualAnalyzing || !uploadedFile || !manualPrompt.trim()}
                    className="w-full mt-4 relative flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                    style={{
                      background: isManualAnalyzing
                        ? "rgba(124,109,250,0.3)"
                        : "linear-gradient(135deg, #7c6dfa, #2dd4bf)",
                      color: "white",
                      boxShadow: isManualAnalyzing ? "none" : "0 4px 20px rgba(124,109,250,0.35)",
                    }}
                  >
                    {isManualAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI Analyzing with Direction...
                      </>
                    ) : (
                      <>
                        <Wand2 size={15} />
                        {!uploadedFile ? "Upload image first" : "Analyze with Direction"}
                      </>
                    )}
                  </button>

                  {/* Manual error */}
                  {manualError && (
                    <div
                      className="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    >
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>{manualError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload area — both Auto and Manual mode */}
              {!uploadedImage ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[280px] mb-6 ${
                    isDragging
                      ? "border-[var(--accent)] bg-[var(--accent)]/8"
                      : "border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/4"
                  }`}
                >
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                      <Upload
                        size={28}
                        className="text-[var(--accent)] opacity-70"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                        Drop your image here
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        or click to browse · PNG, JPG, WEBP
                      </p>
                    </div>
                    <div className="tag-pill text-xs font-semibold px-3 py-1.5 rounded-full">
                      Supports up to 10MB
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] mb-6 group">
                  <img
                    src={uploadedImage}
                    alt="Reference"
                    className="w-full object-cover max-h-[280px]"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/60 hover:bg-red-500/70 flex items-center justify-center transition-colors backdrop-blur-sm"
                  >
                    <X size={14} className="text-white" />
                  </button>
                  </div>
              )}

              {/* Image Analysis Result — shown for both auto (analysisResult) and manual (manualResult) */}
              {(analysisResult ?? manualResult) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={13} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                      {mode === "manual" ? "AI Direction Analysis" : "Image Analysis"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Dominant Colors */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[var(--text-muted)] w-32 shrink-0">
                        Dominant Colors
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(analysisResult?.dominantColors ?? manualResult?.dominantColors ?? []).map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white/10 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    {[
                      { label: "Style", value: analysisResult?.style ?? manualResult?.style },
                      { label: "Key Elements", value: analysisResult?.keyElements ?? manualResult?.keyElements },
                      { label: "Mood", value: analysisResult?.mood ?? manualResult?.mood },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <span className="text-xs font-semibold text-[var(--text-muted)] w-32 shrink-0">
                          {item.label}
                        </span>
                        <span className="text-xs text-[var(--text-primary)]">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Keywords */}
              {(analysisResult ?? manualResult) && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={13} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                      Extracted Keywords
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult?.keywords ?? manualResult?.keywords ?? []).map((kw) => (
                      <span
                        key={kw}
                        className="tag-pill text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze button — Auto mode only */}
              {mode === "auto" && uploadedImage && !analysisResult && (
                <>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || recLimit?.remaining === 0}
                    className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mb-3"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles size={16} className="animate-pulse" />
                        Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Analyze & Recommend
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Daily limit badge */}
                  {recLimit && (
                    <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border mb-3 ${
                      recLimit.remaining === 0
                        ? "bg-red-500/8 border-red-500/20"
                        : "bg-[var(--bg-secondary)] border-[var(--border)]"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Zap size={12} className={recLimit.remaining === 0 ? "text-red-400" : "text-[var(--accent)]"} />
                        <span className={`text-xs font-semibold ${recLimit.remaining === 0 ? "text-red-400" : "text-[var(--text-muted)]"}`}>
                          {recLimit.remaining === 0
                            ? "Daily limit reached · resets midnight UTC"
                            : `${recLimit.used_today}/${recLimit.daily_limit} uses today`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (recLimit.used_today / recLimit.daily_limit) * 100)}%`,
                              background: recLimit.remaining === 0
                                ? "linear-gradient(90deg, #ef4444, #f97316)"
                                : "var(--accent)",
                            }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${recLimit.remaining === 0 ? "text-red-400" : "text-[var(--text-muted)]"}`}>
                          {recLimit.remaining} left
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error message */}
              {errorMessage && !isAnalyzing && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                  <X size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-400 mb-0.5">
                      Analisis Gagal
                    </p>
                    <p className="text-xs text-red-300/80 leading-relaxed">
                      {errorMessage}
                    </p>
                    <button
                      onClick={handleAnalyze}
                      className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
                    >
                      Coba lagi →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT PANEL: Output ── */}
            <div className="p-8 md:p-10">
              {/* OUTPUT label */}
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                  Output
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  — AI Product Recommendations
                </span>
              </div>

              {!(analysisResult || manualResult) ? (
                /* Empty state */
                <div className="relative flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="absolute inset-0 grid-bg opacity-40 rounded-2xl" />
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/8 border border-[var(--accent)]/15 flex items-center justify-center">
                        <ShoppingBag
                          size={36}
                          className="text-[var(--accent)] opacity-50"
                        />
                      </div>
                      <div className="absolute inset-0 rounded-3xl bg-[var(--accent)]/5 blur-xl pointer-events-none" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">
                        Product recommendations will appear here
                      </p>
                      <p className="text-xs text-[var(--text-dim)]">
                        {mode === "auto"
                          ? "Upload an image and click Analyze"
                          : "Upload an image, type your direction, then click Analyze with Direction"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Product grid — 3 produk dari AI (dinamis) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {(analysisResult?.products ?? manualResult?.products ?? []).map((product, i) => (
                      <div
                        key={product.id}
                        className="group feature-card rounded-2xl overflow-hidden cursor-pointer"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Product image area */}
                        <div className="relative aspect-square bg-[var(--bg-secondary)] flex flex-col items-center justify-center overflow-hidden">
                          {product.success && product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.label}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                  backgroundImage: `url(${uploadedImage})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  filter: "blur(2px)",
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)]/60 to-transparent" />
                              <span className="relative z-10 text-3xl">
                                {product.emoji}
                              </span>
                            </>
                          )}
                        </div>
                        {/* Label */}
                        <div className="px-2 py-2 border-t border-[var(--border)]">
                          <p className="text-[9px] font-bold text-[var(--text-muted)] tracking-wider uppercase text-center leading-tight">
                            {i + 1}. {product.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Generated Prompt */}
                  <div className="relative rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/6 to-transparent pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Wand2 size={14} className="text-[var(--accent)]" />
                          <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                            Generated Prompt
                          </span>
                        </div>
                        <button
                          onClick={handleCopyPrompt}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--accent)]/25 hover:bg-[var(--accent)]/10 transition-colors text-xs font-semibold text-[var(--accent)]"
                        >
                          {copied ? <Check size={11} /> : <Copy size={11} />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed italic mb-4">
                        {analysisResult?.generatedPrompt ?? manualResult?.generatedPrompt}
                      </p>
                      <a
                        href={`/generate?q=${encodeURIComponent(analysisResult?.generatedPrompt ?? manualResult?.generatedPrompt ?? "")}`}
                        className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                      >
                        <Sparkles size={12} />
                        Generate with this prompt
                        <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* Loading overlay — Auto and Manual mode */}
              {(isAnalyzing || isManualAnalyzing) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[var(--bg-card)]/80 backdrop-blur-sm rounded-r-3xl z-20">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Sparkles
                      size={28}
                      className="text-[var(--accent)] animate-pulse"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {isManualAnalyzing ? "Analyzing with your direction..." : "Analyzing your image..."}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isManualAnalyzing ? "Combining image + arahan, choosing 3 products" : "Extracting colors, style & mood"}
                    </p>
                  </div>
                  <div className="w-48 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        animation: "shimmer 1.5s ease-in-out infinite",
                        background:
                          "linear-gradient(90deg, var(--accent) 0%, #9b8dfc 50%, var(--accent) 100%)",
                        backgroundSize: "200% auto",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── FEATURES BAR ─────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                  <feat.icon size={13} className="text-[var(--accent)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {feat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <p className="text-lg font-bold text-[var(--accent)] tracking-widest uppercase mb-2">
              How It Works
            </p>
            <h2 className="text-xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              3 Steps to Smart Recommendations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload a Reference Image",
                desc: "Drop any image — artwork, mood board, photo, or inspiration. The AI accepts any visual style.",
                hex: "#06b6d4",
                hex2: "#3b82f6",
                rgb: { r: 6, g: 182, b: 212 },
              },
              {
                step: "02",
                icon: Wand2,
                title: "AI Analyzes Style & Mood",
                desc: "Our AI extracts dominant colors, style keywords, mood, and aesthetic elements from your image.",
                hex: "#8b5cf6",
                hex2: "#ec4899",
                rgb: { r: 139, g: 92, b: 246 },
              },
              {
                step: "03",
                icon: ShoppingBag,
                title: "Get Product Recommendations",
                desc: "Instantly receive 3 AI-generated product mockups matched to your image's vibe — Tote Bag, Sneakers, and T-Shirt — plus a ready-to-use AI prompt.",
                hex: "#10b981",
                hex2: "#84cc16",
                rgb: { r: 16, g: 185, b: 129 },
              },
            ].map((item, i) => (
              <SpotlightCard
                key={i}
                className="p-6"
                hex={item.hex}
                hex2={item.hex2}
                rgb={item.rgb}
              >
                {/* Step number watermark */}
                <div
                  className="absolute top-4 right-5 text-6xl font-black leading-none select-none pointer-events-none"
                  style={{ color: `${item.hex}12` }}
                >
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `${item.hex}18`,
                      border: `1px solid ${item.hex}35`,
                    }}
                  >
                    <item.icon size={18} style={{ color: item.hex }} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <div
                    className="h-0.5 rounded-full w-8 transition-all duration-500 group-hover:w-full"
                    style={{
                      background: `linear-gradient(90deg, ${item.hex}, ${item.hex2})`,
                    }}
                  />
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>

        {/* ─── WHY USE THIS ──────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Sparkles,
              title: "Skip the Guesswork",
              desc: "No need to manually match colors or brainstorm products. AI does the heavy lifting in seconds.",
              hex: "#7c6dfa",
              hex2: "#9b8dfc",
              rgb: { r: 124, g: 109, b: 250 },
            },
            {
              icon: Lightbulb,
              title: "Prompt Ready for Generation",
              desc: "Every analysis outputs a polished AI prompt you can directly use in the Image Generator.",
              hex: "#fb923c",
              hex2: "#fbbf24",
              rgb: { r: 251, g: 146, b: 60 },
            },
            {
              icon: Palette,
              title: "Style-Accurate Results",
              desc: "Recommendations are based on real style analysis — not random suggestions.",
              hex: "#2dd4bf",
              hex2: "#5eead4",
              rgb: { r: 45, g: 212, b: 191 },
            },
          ].map((item, i) => (
            <SpotlightCard
              key={i}
              className="p-6"
              hex={item.hex}
              hex2={item.hex2}
              rgb={item.rgb}
            >
              <div className="flex gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: `${item.hex}18`,
                    border: `1px solid ${item.hex}35`,
                  }}
                >
                  <item.icon size={15} style={{ color: item.hex }} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          ))}
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
