"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── DUMMY ANALYSIS DATA ───────────────────────────────────────
const DUMMY_ANALYSIS = {
  dominantColors: [
    "#1a2744",
    "#2a3f6b",
    "#c8a84b",
    "#8fa8c8",
    "#6b7a9a",
    "#d4b866",
  ],
  style: "Fantasy, Gothic, Dark Academia",
  keyElements: "Swirling Galaxy, Castle, Starry Sky",
  mood: "Mystical, Luxury, Premium",
  recommendedUse: "Premium Apparel & Accessories",
  keywords: [
    "galaxy",
    "swirling",
    "starry night",
    "castle",
    "gothic",
    "deep blue",
    "gold",
    "luxury",
    "fantasy",
    "mystical",
  ],
  generatedPrompt:
    "Luxury streetwear design inspired by a fantasy starry-night masterpiece. Swirling galaxies, glowing moonlight, gothic castle, cosmic dreamscape, deep blue and gold tones. Premium fantasy artwork, oil painting texture, dark academia aesthetic, intricate details, 4K.",
};

const PRODUCT_CATEGORIES = [
  { id: "tote", label: "Tote Bag / Handbag", emoji: "👜" },
  { id: "hoodie", label: "Hoodie / Sweater", emoji: "🧥" },
  { id: "tshirt", label: "Kaos T-Shirt", emoji: "👕" },
  { id: "sneakers", label: "Sneakers", emoji: "👟" },
  { id: "cap", label: "Cap / Topi", emoji: "🧢" },
  { id: "bomber", label: "Bomber Jacket", emoji: "🫱" },
  { id: "scarf", label: "Scarf / Syal", emoji: "🧣" },
  { id: "phonecase", label: "Phone Case", emoji: "📱" },
];

const FEATURES = [
  { icon: Eye, label: "AI-Powered Image Understanding" },
  { icon: Palette, label: "Style & Color Extraction" },
  { icon: Sparkles, label: "Smart Recommendation Engine" },
  { icon: ShoppingBag, label: "Multi-Product Generation" },
  { icon: Lightbulb, label: "Trend-Aware Suggestions" },
];

export default function RecommendationsPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<
    typeof DUMMY_ANALYSIS | null
  >(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch("http://localhost:8000/api/recommendation", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Recommendation error:", err.detail);
        setIsAnalyzing(false);
        return;
      }

      const data = await res.json();

      // Map snake_case dari backend ke camelCase yang dipakai UI
      setAnalysisResult({
        dominantColors: data.dominant_colors,
        style: data.style,
        keyElements: data.key_elements,
        mood: data.mood,
        recommendedUse: data.recommended_use,
        keywords: data.keywords,
        generatedPrompt: data.generated_prompt,
      });
    } catch (e) {
      console.error("Network error:", e);
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
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div className="pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <Wand2 size={20} className="text-[var(--accent)]" />
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              AI Recommendations
            </h1>
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
              {/* INPUT label */}
              <div className="flex items-center gap-2 mb-6">
                <ImageIcon size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                  Input
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  — Reference Image
                </span>
              </div>

              {/* Upload area */}
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

              {/* Image Analysis Result */}
              {analysisResult && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={13} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                      Image Analysis
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {/* Dominant Colors */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[var(--text-muted)] w-32 shrink-0">
                        Dominant Colors
                      </span>
                      <div className="flex items-center gap-1.5">
                        {analysisResult.dominantColors.map((color, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-white/10 shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    {[
                      { label: "Style", value: analysisResult.style },
                      {
                        label: "Key Elements",
                        value: analysisResult.keyElements,
                      },
                      { label: "Mood", value: analysisResult.mood },
                      {
                        label: "Recommended Use",
                        value: analysisResult.recommendedUse,
                      },
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
              {analysisResult && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={13} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase">
                      Extracted Keywords
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.keywords.map((kw) => (
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

              {/* Analyze button */}
              {uploadedImage && !analysisResult && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
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

              {!analysisResult ? (
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
                        Upload an image and click Analyze
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Product grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {PRODUCT_CATEGORIES.map((product, i) => (
                      <div
                        key={product.id}
                        className="group feature-card rounded-2xl overflow-hidden cursor-pointer"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Product mockup area */}
                        <div className="relative aspect-square bg-[var(--bg-secondary)] flex flex-col items-center justify-center overflow-hidden">
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
                        {analysisResult.generatedPrompt}
                      </p>
                      <a
                        href={`/generate?q=${encodeURIComponent(analysisResult.generatedPrompt)}`}
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

              {/* Loading state */}
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[var(--bg-card)]/80 backdrop-blur-sm rounded-r-3xl z-20">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Sparkles
                      size={28}
                      className="text-[var(--accent)] animate-pulse"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Analyzing your image...
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Extracting colors, style & mood
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
              },
              {
                step: "02",
                icon: Wand2,
                title: "AI Analyzes Style & Mood",
                desc: "Our AI extracts dominant colors, style keywords, mood, and aesthetic elements from your image.",
              },
              {
                step: "03",
                icon: ShoppingBag,
                title: "Get Product Recommendations",
                desc: "Instantly receive 8 fashion product suggestions matched to your image's vibe, plus a ready-to-use AI prompt.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative feature-card rounded-2xl p-6 overflow-hidden"
              >
                {/* Step number watermark */}
                <div className="absolute top-4 right-5 text-6xl font-black text-[var(--accent)]/6 leading-none select-none">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── WHY USE THIS ──────────────────────────────────────── */}
        <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-8">
          <p className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase mb-5">
            Why Use AI Recommendations?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Skip the Guesswork",
                desc: "No need to manually match colors or brainstorm products. AI does the heavy lifting in seconds.",
              },
              {
                icon: Lightbulb,
                title: "Prompt Ready for Generation",
                desc: "Every analysis outputs a polished AI prompt you can directly use in the Image Generator.",
              },
              {
                icon: Palette,
                title: "Style-Accurate Results",
                desc: "Recommendations are based on real style analysis — not random suggestions.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={15} className="text-[var(--accent)]" />
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
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
