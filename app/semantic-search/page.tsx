"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Search, Cpu, Layers, TrendingUp, AlertCircle, Loader2, ImageOff, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  rank: number;
  id: string;
  prompt: string;
  enhanced_prompt: string | null;
  image_url: string | null;
  status: string;
  model_used: string;
  rating: number | null;
  generation_time_ms: number;
  created_at: string;
  similarity_score: number;
  similarity_percent: number;
  similarity_label: string;
}

interface SearchResponse {
  query: string;
  query_embedding_dim: number;
  total_corpus: number;
  total_results: number;
  min_score_filter: number;
  results: SearchResult[];
  message?: string;
}

interface CorpusStats {
  corpus_total: number;
  corpus_with_embedding: number;
  corpus_without_embedding: number;
  success_designs: number;
  success_with_embedding: number;
  embedding_coverage_percent: number;
  model: string;
  embedding_dim: number;
  similarity_metric: string;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

const BACKEND = "http://localhost:8000";

function similarityColor(label: string): string {
  switch (label) {
    case "Very High": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "High":      return "text-green-400 bg-green-400/10 border-green-400/30";
    case "Medium":    return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    case "Low":       return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    default:          return "text-red-400 bg-red-400/10 border-red-400/30";
  }
}

function similarityBar(score: number): string {
  if (score >= 0.85) return "bg-emerald-500";
  if (score >= 0.70) return "bg-green-500";
  if (score >= 0.55) return "bg-yellow-500";
  if (score >= 0.40) return "bg-orange-500";
  return "bg-red-500";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [meta, setMeta] = useState<Omit<SearchResponse, "results"> | null>(null);
  const [stats, setStats] = useState<CorpusStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [minScore, setMinScore] = useState(0.0);
  const [limitK, setLimitK] = useState(10);

  // Load corpus stats on first render
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/vsm-search/stats`);
      if (res.ok) {
        const data: CorpusStats = await res.json();
        setStats(data);
      }
    } catch {
      // silent fail for stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load stats once on mount
  useState(() => {
    loadStats();
  });

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(limitK),
        min_score: String(minScore),
      });

      const res = await fetch(`${BACKEND}/api/vsm-search?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setResults(data.results);
      setMeta({
        query: data.query,
        query_embedding_dim: data.query_embedding_dim,
        total_corpus: data.total_corpus,
        total_results: data.total_results,
        min_score_filter: data.min_score_filter,
        message: data.message,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const exampleQueries = [
    "minimalist dark logo",
    "colorful modern poster",
    "elegant wedding invitation",
    "tech startup branding",
    "vintage retro style",
    "abstract geometric art",
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <Cpu className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Semantic Design Search
            </h1>
          </div>
          <p className="text-zinc-400 text-sm max-w-2xl">
            Vector Space Model using <span className="text-violet-300 font-medium">CLIP embeddings (512-dim)</span> to
            search designs based on semantic similarity — not just keyword matching.
          </p>
        </div>

        {/* ── Corpus Stats Bar ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Total Corpus",
              value: statsLoading ? "..." : (stats?.corpus_total ?? "—"),
              icon: <Layers className="w-4 h-4 text-blue-400" />,
              color: "border-blue-500/20 bg-blue-500/5",
            },
            {
              label: "With Embedding",
              value: statsLoading ? "..." : (stats?.corpus_with_embedding ?? "—"),
              icon: <Cpu className="w-4 h-4 text-violet-400" />,
              color: "border-violet-500/20 bg-violet-500/5",
            },
            {
              label: "Coverage",
              value: statsLoading ? "..." : (stats ? `${stats.embedding_coverage_percent}%` : "—"),
              icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
              color: "border-emerald-500/20 bg-emerald-500/5",
            },
            {
              label: "Embedding Dim",
              value: statsLoading ? "..." : (stats?.embedding_dim ?? "512"),
              icon: <Info className="w-4 h-4 text-yellow-400" />,
              color: "border-yellow-500/20 bg-yellow-500/5",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── VSM Info Box ────────────────────────────────────────────────── */}
        <div className="mb-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-zinc-300">
              <span className="font-medium text-blue-300">How Vector Space Model works: </span>
              Your query is transformed into a 512-dimensional vector by the CLIP text encoder, then compared
              against every design in the corpus using <span className="text-white font-medium">cosine similarity</span>.
              Results are ranked from most to least semantically similar. Similarity 1.0 = identical, 0.0 = unrelated.
            </div>
          </div>
        </div>

        {/* ── Search Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search designs semantically... e.g: dark minimal logo for tech brand"
                className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white 
                           placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 
                           focus:ring-violet-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 
                         disabled:cursor-not-allowed rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-5 h-5" /> Search</>
              )}
            </button>
          </div>

          {/* Advanced options */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Top-K:</label>
              <select
                value={limitK}
                onChange={(e) => setLimitK(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                {[5, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} results</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-400">Min similarity:</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value={0.0}>No filter</option>
                <option value={0.3}>≥ 30%</option>
                <option value={0.4}>≥ 40%</option>
                <option value={0.5}>≥ 50%</option>
                <option value={0.6}>≥ 60%</option>
              </select>
            </div>
          </div>
        </form>

        {/* ── Example Queries ─────────────────────────────────────────────── */}
        {!hasSearched && (
          <div className="mb-8">
            <p className="text-xs text-zinc-500 mb-2">Try example queries:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); }}
                  className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 
                             hover:border-violet-500/50 rounded-lg text-zinc-300 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Error</p>
              <p className="text-red-400/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ── Results Meta ────────────────────────────────────────────────── */}
        {meta && !loading && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>
              Query: <span className="text-white font-medium">"{meta.query}"</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Found <span className="text-violet-300 font-medium">{meta.total_results}</span> of{" "}
              <span className="text-white">{meta.total_corpus}</span> corpus
            </span>
            <span className="text-zinc-600">•</span>
            <span>Embedding dim: <span className="text-blue-300">{meta.query_embedding_dim}</span></span>
          </div>
        )}

        {/* ── Results Grid ────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            <div className="text-center">
              <p className="text-zinc-300 font-medium">Encoding query & computing similarity...</p>
              <p className="text-zinc-500 text-sm mt-1">CLIP is processing vector embeddings</p>
            </div>
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Search className="w-12 h-12 text-zinc-600" />
            <div className="text-center">
              <p className="text-zinc-400 font-medium">No results found</p>
              <p className="text-zinc-500 text-sm mt-1">
                {meta?.message || "Try a different query or lower the min similarity threshold"}
              </p>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-500/30 
                           hover:bg-zinc-900 transition-all overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  {/* Rank badge */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 
                                  flex items-center justify-center text-violet-300 font-bold text-sm">
                    {result.rank}
                  </div>

                  {/* Image thumbnail */}
                  <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                    {result.image_url ? (
                      <img
                        src={result.image_url}
                        alt={result.prompt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-white font-medium leading-snug line-clamp-2 text-sm">
                        {result.prompt}
                      </p>

                      {/* Similarity badge */}
                      <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-semibold ${similarityColor(result.similarity_label)}`}>
                        {result.similarity_percent}%
                      </div>
                    </div>

                    {/* Similarity bar */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500">Similarity Score</span>
                        <span className={`text-xs font-medium ${similarityColor(result.similarity_label).split(" ")[0]}`}>
                          {result.similarity_label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${similarityBar(result.similarity_score)}`}
                          style={{ width: `${result.similarity_percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className={`px-2 py-0.5 rounded-md ${
                        result.status === "success"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {result.status}
                      </span>
                      <span>{result.model_used}</span>
                      {result.rating && (
                        <span className="text-yellow-400">★ {result.rating}/5</span>
                      )}
                      <span>{formatDate(result.created_at)}</span>
                      <span className="font-mono text-zinc-600">
                        score: {result.similarity_score.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced prompt (collapsible on hover) */}
                {result.enhanced_prompt && (
                  <div className="px-4 pb-3 pl-16 hidden group-hover:block">
                    <p className="text-xs text-zinc-500 italic line-clamp-2">
                      <span className="text-zinc-600 not-italic">Enhanced: </span>
                      {result.enhanced_prompt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── How VSM works (bottom info) ─────────────────────────────────── */}
        {!hasSearched && (
          <div className="mt-12 p-6 rounded-xl border border-zinc-800 bg-zinc-900/30">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              How Does Vector Space Model Work?
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  step: "1",
                  title: "Text → Vector",
                  desc: "The CLIP text encoder converts your query into a 512-dimensional vector that represents the semantic meaning of the text.",
                  color: "border-violet-500/20 bg-violet-500/5",
                  textColor: "text-violet-400",
                },
                {
                  step: "2",
                  title: "Cosine Similarity",
                  desc: "Every prompt in the corpus is compared to your query using cosine similarity — measuring the angle between two vectors.",
                  color: "border-blue-500/20 bg-blue-500/5",
                  textColor: "text-blue-400",
                },
                {
                  step: "3",
                  title: "Ranked Results",
                  desc: "Designs are ranked from most to least semantically similar. Score 1.0 = identical, 0.0 = unrelated.",
                  color: "border-emerald-500/20 bg-emerald-500/5",
                  textColor: "text-emerald-400",
                },
              ].map((item) => (
                <div key={item.step} className={`p-4 rounded-lg border ${item.color}`}>
                  <div className={`text-2xl font-bold mb-2 ${item.textColor}`}>{item.step}</div>
                  <h4 className="text-white font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-zinc-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
