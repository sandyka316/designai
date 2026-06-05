"use client";

import { useState, useRef, useEffect } from "react";
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
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
    title: "Upload reference images",
    desc: "Click the Wand icon in the prompt input to upload a reference image. The AI will follow its style and mood.",
    example: "Tap the wand icon → choose a reference image → add your prompt",
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
  },
  {
    icon: ImageIcon,
    title: "Commercial-ready output",
    desc: "High-resolution results ready for e-commerce, catalogs, social media, and advertising materials.",
  },
  {
    icon: Sparkles,
    title: "Consistent across all products",
    desc: "Maintain a consistent visual style across your entire product line with the same prompt template.",
  },
  {
    icon: Wand2,
    title: "Multi-modal input",
    desc: "Combine text and reference images simultaneously for full control over the desired output.",
  },
];

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

function ImageGeneratorPage() {
  const [selectedModel, setSelectedModel] = useState("hd");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState(searchParams.get("q") ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);

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
    setIsGenerating(true);
    setGeneratedImage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("http://localhost:8000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), model: selectedModel }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMessage(err.detail ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }

      const data = await res.json();
      setGeneratedImage(data.image_url ?? null);
    } catch (e) {
      setErrorMessage("Tidak dapat terhubung ke server. Pastikan backend berjalan.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      {/* ─── HEADER ───────────────────────────────────────────── */}
      <div className="pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              AI Image Generator
            </h1>
          </div>
          <div className="hidden md:block w-px h-12 bg-[var(--border)] ml-12" />
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-sm">
            This is an AI Image Generator. It creates an image from scratch from
            a text description.
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
                          <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                            Attach
                          </span>
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
                          <span className="font-medium">Add Files</span>
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
                          <span className="font-medium">Add Photo</span>
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
                      placeholder="Describe what you'd like to generate..."
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
                className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-8"
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
                    <p className="text-sm font-semibold text-red-400 mb-1">Generation Failed</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{errorMessage}</p>
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
              <div key={i} className="feature-card rounded-2xl p-5">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                  <b.icon size={16} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {b.desc}
                </p>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODEL_INFO.map((m) => (
              <div
                key={m.id}
                className={`feature-card rounded-2xl p-6 ${
                  selectedModel === m.id && !m.status !== ("free" as any)
                    ? "border-[var(--accent)]/40"
                    : ""
                }`}
              >
                {/* Header model */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: `${m.color}18`,
                        border: `1px solid ${m.color}30`,
                      }}
                    >
                      <m.icon size={16} style={{ color: m.color }} />
                    </div>
                    <span className="text-sm font-extrabold text-[var(--text-primary)]">
                      {m.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      m.status === "free"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : m.status === "pro"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                    }`}
                  >
                    {m.status === "free"
                      ? "FREE"
                      : m.status === "pro"
                        ? "PRO"
                        : "ENTERPRISE"}
                  </span>
                </div>

                {/* Desc */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  {m.desc}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-[var(--text-dim)] font-medium mb-0.5">
                      Speed
                    </p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {m.speed}
                    </p>
                  </div>
                  <div className="w-px h-6 bg-[var(--border)]" />
                  <div>
                    <p className="text-[10px] text-[var(--text-dim)] font-medium mb-0.5">
                      Quality
                    </p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {m.quality}
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <div className="flex flex-col gap-1.5">
                  {m.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2
                        size={11}
                        style={{ color: m.color }}
                        className="shrink-0"
                      />
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
              <div key={i} className="feature-card rounded-2xl overflow-hidden">
                {/* Accordion header */}
                <button
                  onClick={() => setOpenTip(openTip === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-extrabold text-[var(--accent)]">
                        {tip.icon}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {tip.title}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
                      openTip === i ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Accordion body */}
                {openTip === i && (
                  <div className="px-6 pb-5 border-t border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-4 mb-3">
                      {tip.desc}
                    </p>
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/15">
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest shrink-0 mt-0.5">
                        Contoh
                      </span>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed italic">
                        {tip.example}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
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
