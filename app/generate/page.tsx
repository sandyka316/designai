"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Lock, Wand2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MODELS = [
  { id: "hd", label: "HD", locked: false },
  { id: "genius", label: "Genius", locked: true },
  { id: "super-genius", label: "Super Genius", locked: true },
];

export default function ImageGeneratorPage() {
  const [selectedModel, setSelectedModel] = useState("hd");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState(searchParams.get("q") ?? "");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);
    // Placeholder: set a dummy generated image (replace with real API call)
    setGeneratedImage(null);
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      {/* ─── HEADER ───────────────────────────────────────────── */}
      <div className="pt-28 pb-10 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          {/* Title block */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              AI Image Generator
            </h1>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-[var(--border)] ml-12" />

          {/* Description */}
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-sm">
            This is an AI Image Generator. It creates an image from scratch from
            a text description.
          </p>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="px-6 md:px-12 pb-20 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* ── LEFT PANEL: Controls ── */}
            <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-[var(--border)]">
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-5">
                Create an image from text prompt
              </h2>

              {/* Prompt textarea */}
              <div className="prompt-input rounded-2xl p-4 mb-5">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you'd like to generate..."
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] outline-none resize-none leading-relaxed"
                  rows={4}
                  style={{ caretColor: "var(--accent)" }}
                />
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
              {/* Background subtle grid */}
              <div className="absolute inset-0 grid-bg opacity-60 rounded-r-3xl" />

              {isGenerating ? (
                /* Loading state */
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
                  {/* Loading bar */}
                  <div className="w-48 h-1 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        animation: "shimmer 1.5s ease-in-out infinite",
                        background:
                          "linear-gradient(90deg, var(--accent) 0%, #9b8dfc 50%, var(--accent) 100%)",
                        backgroundSize: "200% auto",
                      }}
                    />
                  </div>
                </div>
              ) : generatedImage ? (
                /* Generated image */
                <div className="relative z-10 w-full max-w-sm">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-2xl border border-[var(--border)] shadow-2xl"
                  />
                </div>
              ) : (
                /* Empty state */
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                  {/* Sparkles icon decorative */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/8 border border-[var(--accent)]/15 flex items-center justify-center">
                      <Sparkles
                        size={36}
                        className="text-[var(--accent)] opacity-60"
                      />
                    </div>
                    {/* Glow */}
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
    </main>
  );
}
