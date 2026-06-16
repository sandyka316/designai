"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain,
  Cpu,
  Sparkles,
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Zap,
  BarChart2,
  ArrowRight,
  Copy,
  Check,
  Sliders,
  BookOpen,
  TrendingUp,
  Database,
  Activity,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";

const API = "http://127.0.0.1:8000/api/dl";

// ── Score ring visual ───────────────────────────────────────────────────────
function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score !== null ? score / 100 : 0;
  const offset = circumference * (1 - pct);

  const color =
    score === null
      ? "#4b5563"
      : score >= 75
      ? "#10b981"
      : score >= 55
      ? "#3b82f6"
      : score >= 35
      ? "#f59e0b"
      : "#ef4444";

  const labelColor =
    score === null
      ? "text-[var(--text-muted)]"
      : score >= 75
      ? "text-emerald-400"
      : score >= 55
      ? "text-blue-400"
      : score >= 35
      ? "text-amber-400"
      : "text-red-400";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-extrabold ${labelColor}`}>
            {score !== null ? `${score}` : "—"}
          </span>
          {score !== null && (
            <span className="text-[9px] text-[var(--text-dim)]">/100</span>
          )}
        </div>
      </div>
      <span className={`text-xs font-bold ${labelColor}`}>{label}</span>
    </div>
  );
}

// ── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg hover:bg-[var(--border)]/40 transition-colors text-[var(--text-dim)] hover:text-[var(--text-primary)]"
      title="Copy prompt"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ── Inner component (needs useSearchParams inside Suspense) ─────────────────
function DeepLearningInner() {
  const searchParams = useSearchParams();

  // ── CLIP state ───────────────────────────────────────────────────────────
  const [clipPrompt, setClipPrompt] = useState("");
  const [clipImageUrl, setClipImageUrl] = useState("");
  const [clipLoading, setClipLoading] = useState(false);
  const [clipResult, setClipResult] = useState<any>(null);
  const [clipError, setClipError] = useState<string | null>(null);

  // CLIP History
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLimit, setHistoryLimit] = useState(5);

  // ── LSTM state ───────────────────────────────────────────────────────────
  const [lstmStatus, setLstmStatus] = useState<any>(null);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainResult, setTrainResult] = useState<any>(null);
  const [trainError, setTrainError] = useState<string | null>(null);

  const [lstmSeed, setLstmSeed] = useState("");
  const [lstmTemp, setLstmTemp] = useState(0.8);
  const [lstmN, setLstmN] = useState(5);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // ── Active tab ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"clip" | "lstm">("clip");

  // ── Auto-fill from URL params (from Dashboard) ────────────────────────────
  useEffect(() => {
    const prompt = searchParams.get("prompt");
    const imageUrl = searchParams.get("image_url");
    if (prompt) setClipPrompt(decodeURIComponent(prompt));
    if (imageUrl) setClipImageUrl(decodeURIComponent(imageUrl));
    // If params exist, switch to CLIP tab and scroll to form
    if (prompt || imageUrl) {
      setActiveTab("clip");
      // Small delay to let DOM render
      setTimeout(() => {
        document.getElementById("clip-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams]);

  // ── Load LSTM status on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetchLstmStatus();
  }, []);

  async function fetchLstmStatus() {
    try {
      const res = await fetch(`${API}/lstm/status`);
      const d = await res.json();
      setLstmStatus(d);
    } catch {
      setLstmStatus(null);
    }
  }

  // ── CLIP: Score single ───────────────────────────────────────────────────
  async function handleClipScore() {
    if (!clipPrompt.trim() || !clipImageUrl.trim()) return;
    setClipLoading(true);
    setClipError(null);
    setClipResult(null);
    try {
      const res = await fetch(`${API}/clip/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clipPrompt, image_url: clipImageUrl }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Failed");
      setClipResult(d);
    } catch (e: any) {
      setClipError(e.message);
    } finally {
      setClipLoading(false);
    }
  }

  // ── CLIP: History ────────────────────────────────────────────────────────
  async function handleClipHistory() {
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await fetch(`${API}/clip/history?limit=${historyLimit}`);
      const d = await res.json();
      setHistoryData(d);
    } catch (e: any) {
      setHistoryData({ error: e.message });
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── LSTM: Train ──────────────────────────────────────────────────────────
  async function handleTrain() {
    setTrainLoading(true);
    setTrainError(null);
    setTrainResult(null);
    try {
      const res = await fetch(`${API}/lstm/train`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Training failed");
      setTrainResult(d);
      await fetchLstmStatus();
    } catch (e: any) {
      setTrainError(e.message);
    } finally {
      setTrainLoading(false);
    }
  }

  // ── LSTM: Suggest ─────────────────────────────────────────────────────────
  async function handleSuggest() {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions([]);
    try {
      const res = await fetch(`${API}/lstm/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: lstmSeed,
          num_suggestions: lstmN,
          temperature: lstmTemp,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Suggest failed");
      if (!d.is_trained) {
        setSuggestError(d.message);
      } else {
        setSuggestions(d.suggestions || []);
      }
    } catch (e: any) {
      setSuggestError(e.message);
    } finally {
      setSuggestLoading(false);
    }
  }

  const scoreColor = (s: number | null) =>
    s === null
      ? "var(--text-dim)"
      : s >= 75
      ? "#10b981"
      : s >= 55
      ? "#3b82f6"
      : s >= 35
      ? "#f59e0b"
      : "#ef4444";

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      <div className="pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
            Deep Learning
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <Brain size={32} className="text-[var(--accent)]" />
            AI Design Quality Scorer
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
            Two deep learning features: <strong className="text-[var(--text-primary)]">CLIP</strong> to measure prompt↔image alignment,
            and <strong className="text-[var(--text-primary)]">LSTM</strong> to suggest prompts based on generation history.
          </p>
        </div>

        {/* ── FROM DASHBOARD NOTICE ── */}
        {(searchParams.get("prompt") || searchParams.get("image_url")) && (
          <div className="flex items-center gap-3 bg-[var(--accent)]/10 border border-[var(--accent)]/25 rounded-2xl p-4 mb-5">
            <Brain size={16} className="text-[var(--accent)] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">✨ Opened from Dashboard</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                The prompt and image URL have been auto-filled from the image you selected.
                Click <strong className="text-[var(--text-primary)]">"Calculate CLIP Score"</strong> to evaluate the alignment.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB ── */}
        <div className="flex items-center gap-2 mb-6 bg-[var(--bg-card)] border border-[var(--border)] p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("clip")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "clip"
                ? "bg-[var(--accent)] text-white shadow-lg"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ImageIcon size={15} />
            CLIP Scorer
          </button>
          <button
            onClick={() => setActiveTab("lstm")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "lstm"
                ? "bg-[var(--accent)] text-white shadow-lg"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Brain size={15} />
            LSTM Suggestions
            {lstmStatus?.is_trained && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB 1: CLIP                                        */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "clip" && (
          <div className="space-y-6">

            {/* Info card */}
            <SpotlightCard hex="#7c6dfa" hex2="#06b6d4" rgb={{ r: 124, g: 109, b: 250 }} lift={4} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7c6dfa]/15 border border-[#7c6dfa]/30 flex items-center justify-center shrink-0">
                  <Cpu size={18} style={{ color: "#7c6dfa" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                    CLIP — Contrastive Language-Image Pretraining
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    A deep learning model by OpenAI that learns the relationship between <strong>text</strong> and <strong>images</strong>.
                    Uses <strong>cosine similarity</strong> between text embeddings and image embeddings to produce
                    an alignment score from 0–100. Architecture: Vision Transformer (ViT-B/32) + Text Transformer.
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-mono bg-[var(--bg-primary)] px-2 py-0.5 rounded text-[var(--accent)]">
                      openai/clip-vit-base-patch32
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)]">Zero-shot · No fine-tuning needed</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Single score */}
            <div className="feature-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={16} className="text-[var(--accent)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Score a Single Image</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                    Prompt used for generation
                  </label>
                  <textarea
                    value={clipPrompt}
                    onChange={(e) => setClipPrompt(e.target.value)}
                    placeholder="Example: tote bag floral minimalist pattern with navy blue background"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                    Image URL (http:// or data:image/...)
                  </label>
                  <textarea
                    value={clipImageUrl}
                    onChange={(e) => setClipImageUrl(e.target.value)}
                    placeholder="https://... or paste a base64 data URL"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={handleClipScore}
                disabled={clipLoading || !clipPrompt.trim() || !clipImageUrl.trim()}
                className="btn-shimmer flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              >
                {clipLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {clipLoading ? "Calculating Score..." : "Calculate CLIP Score"}
              </button>

              {clipError && (
                <div className="mt-4 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">{clipError}</p>
                </div>
              )}

              {clipResult && (
                <div className="mt-5 pt-5 border-t border-[var(--border)]">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreRing score={clipResult.score} label={clipResult.label} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Interpretation
                      </p>
                      <p className="text-sm text-[var(--text-primary)] mb-3">
                        {clipResult.interpretation}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                          <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Cosine Similarity</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">
                            {clipResult.score_raw}
                          </p>
                        </div>
                        <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                          <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Model</p>
                          <p className="text-[10px] font-mono text-[var(--accent)] mt-0.5 truncate">
                            {clipResult.model?.split("/").pop()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History Scorer */}
            <div className="feature-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-[var(--accent)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    Batch Score — Generation History
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={historyLimit}
                    onChange={(e) => setHistoryLimit(Number(e.target.value))}
                    className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                  >
                    {[3, 5, 10, 15].map((n) => (
                      <option key={n} value={n}>{n} items</option>
                    ))}
                  </select>
                  <button
                    onClick={handleClipHistory}
                    disabled={historyLoading}
                    className="btn-shimmer flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                  >
                    {historyLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    {historyLoading ? "Scoring..." : "Run Batch Score"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--text-muted)] mb-4">
                Automatically fetches the latest generation history from the database and calculates a CLIP score for each image.
                Useful for bulk evaluation of generation quality.
              </p>

              {historyData?.error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-xl p-3">
                  <AlertCircle size={13} />
                  {historyData.error}
                </div>
              )}

              {historyData && !historyData.error && (
                <div>
                  {/* Summary */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-[var(--bg-primary)] rounded-xl">
                    <div>
                      <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Avg Score</p>
                      <p className="text-xl font-extrabold" style={{ color: scoreColor(historyData.avg_score) }}>
                        {historyData.avg_score ?? "—"}
                      </p>
                    </div>
                    <div className="w-px h-8 bg-[var(--border)]" />
                    <div>
                      <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Total Scored</p>
                      <p className="text-xl font-extrabold text-[var(--text-primary)]">{historyData.total}</p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-[var(--text-muted)]">{historyData.message}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {historyData.items?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-xl group">
                        {/* Score badge */}
                        <div
                          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 font-extrabold text-sm"
                          style={{
                            background: `${scoreColor(item.clip_score)}18`,
                            border: `1.5px solid ${scoreColor(item.clip_score)}40`,
                            color: scoreColor(item.clip_score),
                          }}
                        >
                          {item.clip_score ?? "—"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {item.prompt}
                          </p>
                          <p className="text-[10px] text-[var(--text-dim)] mt-0.5 truncate">
                            {item.clip_label} · {new Date(item.created_at).toLocaleDateString("en-US")}
                          </p>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] text-right shrink-0">
                          raw: {item.clip_raw ?? "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!historyData && !historyLoading && (
                <div className="text-center py-8 text-sm text-[var(--text-muted)]">
                  Click "Run Batch Score" to start evaluation
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB 2: LSTM                                        */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "lstm" && (
          <div className="space-y-6">

            {/* Info card */}
            <SpotlightCard hex="#10b981" hex2="#3b82f6" rgb={{ r: 16, g: 185, b: 129 }} lift={4} className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Brain size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                    LSTM — Long Short-Term Memory
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    A Recurrent Neural Network with <strong>memory cells</strong> capable of learning long-term patterns.
                    Trained <strong>character-level</strong> on the user's prompt history, then used to
                    predict the next character and generate new prompt variations.
                    Architecture: 2-layer LSTM (hidden=128) + Embedding (dim=64) + Dropout (0.3).
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-mono bg-[var(--bg-primary)] px-2 py-0.5 rounded text-emerald-400">
                      char-level LSTM · PyTorch
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)]">Train on-the-fly · No external dataset</span>
                  </div>
                </div>
              </div>
            </SpotlightCard>

            {/* Status + Train */}
            <div className="feature-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-[var(--accent)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">Training Status & Model</h2>
                </div>
                <button
                  onClick={fetchLstmStatus}
                  className="p-1.5 rounded-lg hover:bg-[var(--border)]/40 transition-colors"
                >
                  <RefreshCw size={13} className="text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Status badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  {
                    label: "Status",
                    value: lstmStatus?.is_trained ? "Trained ✓" : "Not Trained",
                    color: lstmStatus?.is_trained ? "#10b981" : "#f59e0b",
                  },
                  {
                    label: "Training Prompts",
                    value: lstmStatus?.train_prompts_count ?? "—",
                    color: "#7c6dfa",
                  },
                  {
                    label: "Vocab Size",
                    value: lstmStatus?.vocab_size ? `${lstmStatus.vocab_size} chars` : "—",
                    color: "#06b6d4",
                  },
                  {
                    label: "Architecture",
                    value: "2L LSTM",
                    color: "#f59e0b",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-[var(--bg-primary)] rounded-xl p-3">
                    <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>
                      {String(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Train button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTrain}
                  disabled={trainLoading}
                  className="btn-shimmer flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                >
                  {trainLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Zap size={14} />
                  )}
                  {trainLoading ? "Training LSTM..." : lstmStatus?.is_trained ? "Re-Train Model" : "Train Model"}
                </button>
                <p className="text-xs text-[var(--text-muted)]">
                  Uses {lstmStatus?.train_prompts_count || "all"} prompts from the database history
                </p>
              </div>

              {trainError && (
                <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">{trainError}</p>
                </div>
              )}

              {trainResult && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <p className="text-xs font-bold text-emerald-400">Training complete!</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Prompts", value: trainResult.train_prompts },
                      { label: "Vocab", value: `${trainResult.vocab_size} chars` },
                      { label: "Epochs", value: trainResult.epochs },
                      { label: "Final Loss", value: trainResult.final_loss },
                    ].map((item, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-emerald-300/60 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-bold text-emerald-300">{String(item.value ?? "—")}</p>
                      </div>
                    ))}
                  </div>
                  {/* Loss curve visual */}
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <p className="text-[10px] text-emerald-300/60 mb-1">Loss reduction</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-emerald-300">{trainResult.initial_loss}</span>
                      <div className="flex-1 h-1.5 bg-emerald-900/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{
                            width: `${Math.max(10, 100 - (trainResult.final_loss / trainResult.initial_loss) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-emerald-300">{trainResult.final_loss}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggest */}
            <div className="feature-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} className="text-[var(--accent)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">Generate Prompt Suggestions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                    Seed Prompt <span className="text-[var(--text-dim)]">(optional — leave blank for random)</span>
                  </label>
                  <input
                    value={lstmSeed}
                    onChange={(e) => setLstmSeed(e.target.value)}
                    placeholder="Example: tote bag with floral..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1">
                    <Sliders size={11} />
                    Temperature: {lstmTemp.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min={0.3}
                    max={1.5}
                    step={0.1}
                    value={lstmTemp}
                    onChange={(e) => setLstmTemp(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-[9px] text-[var(--text-dim)] mt-0.5">
                    <span>Conservative</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                    Number of Suggestions
                  </label>
                  <div className="flex gap-1">
                    {[3, 5, 8, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setLstmN(n)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          lstmN === n
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleSuggest}
                    disabled={suggestLoading || !lstmStatus?.is_trained}
                    className="w-full btn-shimmer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  >
                    {suggestLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {suggestLoading ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>

              {!lstmStatus?.is_trained && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-400">
                    Model not yet trained. Click <strong>"Train Model"</strong> above first.
                  </p>
                </div>
              )}

              {suggestError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-400">{suggestError}</p>
                </div>
              )}

              {suggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                      {suggestions.length} prompt suggestions from LSTM:
                    </p>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-xl group hover:bg-[var(--bg-card)] transition-colors"
                      >
                        <span className="text-[10px] font-bold text-[var(--accent)] w-5 shrink-0">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-[var(--text-primary)]">{s}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <CopyButton text={s} />
                          <button
                            onClick={() => {
                              setActiveTab("clip");
                              setClipPrompt(s);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[var(--border)]/40 transition-colors text-[var(--text-dim)] hover:text-[var(--accent)]"
                            title="Use for CLIP Score"
                          >
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-dim)] mt-2 text-center">
                    Click <ArrowRight size={9} className="inline" /> to directly test CLIP score with this prompt
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        <div className="feature-card rounded-2xl p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">How It Works — Deep Learning Pipeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CLIP pipeline */}
            <div>
              <p className="text-xs font-semibold text-[#7c6dfa] mb-3 flex items-center gap-1">
                <Cpu size={11} /> CLIP Pipeline
              </p>
              <div className="space-y-2">
                {[
                  { step: "1", text: "Prompt is encoded into a Text Embedding (max 77 tokens)" },
                  { step: "2", text: "Image is encoded into an Image Embedding (224×224 patches)" },
                  { step: "3", text: "Cosine similarity is computed between both embeddings" },
                  { step: "4", text: "Scaled to 0–100 and categorized (Excellent / Good / Fair / Poor)" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#7c6dfa]/20 text-[#7c6dfa] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* LSTM pipeline */}
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-3 flex items-center gap-1">
                <Brain size={11} /> LSTM Pipeline
              </p>
              <div className="space-y-2">
                {[
                  { step: "1", text: "Fetch prompt history from the database (filter 5–120 chars)" },
                  { step: "2", text: "Build a character vocabulary from all prompts" },
                  { step: "3", text: "Train LSTM for 30 epochs with sequence length 40" },
                  { step: "4", text: "Generate variations using temperature-controlled sampling" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </main>
  );
}

// ── Export default with Suspense boundary ──────────────────────────────────
export default function DeepLearningPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
          <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
        </main>
      }
    >
      <DeepLearningInner />
    </Suspense>
  );
}
