"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ImageIcon,
  Download,
  Trash2,
  Plus,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Crown,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── TYPES (sesuai DashboardResponse dari backend) ─────────────────────────
interface StatItem {
  label: string;
  value: string;
  change: string;
}

interface ActivityItem {
  id: string;
  prompt: string;
  model: string;
  time: string;
  status: "success" | "failed";
}

interface GalleryItem {
  id: string;
  prompt: string;
  image_url: string | null;
  color: string;
  time: string;
}

interface DashboardData {
  stats: StatItem[];
  recent_activity: ActivityItem[];
  gallery_items: GalleryItem[];
  saved_prompts: string[];
  credits_used: number;
  credits_total: number;
}

// Icon map untuk stats (urutan sama dengan backend: Total, Credits, Saved, AvgTime)
const STAT_ICONS = [ImageIcon, Zap, Star, TrendingUp];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "recent">("all");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch dashboard dari backend ────────────────────────────────────────
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/dashboard");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const json: DashboardData = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ── Derived: credits ─────────────────────────────────────────────────────
  const creditsLeft = data
    ? Math.max(0, data.credits_total - data.credits_used)
    : 0;
  const creditsTotal = data?.credits_total ?? 50;
  const creditsPct =
    creditsTotal > 0 ? Math.round((creditsLeft / creditsTotal) * 100) : 0;

  // ── Gallery filtered by tab ──────────────────────────────────────────────
  const galleryItems = data?.gallery_items ?? [];
  // "saved" & "recent" tab di UI hanya filter tampilan — karena backend sudah
  // return gallery (success+image) dan recent_activity secara terpisah.
  // Tab "all" = semua gallery_items, "recent" = 4 terbaru, "saved" = sama dengan all
  const filteredGallery =
    activeTab === "recent" ? galleryItems.slice(0, 4) : galleryItems;

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar hideCenterNav />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">
              Loading dashboard…
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar hideCenterNav />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Gagal memuat dashboard
            </p>
            <p className="text-xs text-[var(--text-muted)]">{error}</p>
            <button
              onClick={fetchDashboard}
              className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              <RefreshCw size={13} />
              Coba Lagi
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      <div className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* ─── HEADER ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Your Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={fetchDashboard}
              className="btn-outline flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <a
              href="/generate"
              className="btn-shimmer inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white"
            >
              <Plus size={16} />
              New Generation
            </a>
          </div>
        </div>

        {/* ─── STATS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {(data?.stats ?? []).map((stat, i) => {
            const Icon = STAT_ICONS[i] ?? ImageIcon;
            return (
              <div key={i} className="feature-card rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                    <Icon size={16} className="text-[var(--accent)]" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">
                  {stat.label}
                </p>
                <p className="text-[10px] text-[var(--accent)] font-medium">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* ─── PLAN BANNER ────────────────────────────────────── */}
        <div className="relative rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5 mb-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/8 via-transparent to-[var(--accent-secondary)]/5 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
                <Crown size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Free Plan — {creditsLeft} credits remaining
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Upgrade to Pro for unlimited generations & Genius model
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Usage bar */}
              <div className="hidden sm:flex flex-col items-end gap-1">
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  {creditsLeft} / {creditsTotal} credits
                </span>
                <div className="w-28 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${creditsPct}%` }}
                  />
                </div>
              </div>
              <button className="btn-shimmer flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0">
                Upgrade to Pro
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── MAIN GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Gallery ── */}
          <div className="lg:col-span-2">
            {/* Gallery header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-1">
                {(["all", "saved", "recent"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 capitalize ${
                      activeTab === tab
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium">
                  <Filter size={12} />
                  Filter
                </button>
                <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                  >
                    <Grid3X3 size={13} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                  >
                    <List size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery grid */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredGallery.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] cursor-pointer"
                  >
                    {/* Gambar nyata kalau ada, fallback ke gradient */}
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.prompt}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${item.color}`}
                        />
                        <div className="absolute inset-0 grid-bg opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles
                            size={24}
                            className="text-[var(--accent)] opacity-30"
                          />
                        </div>
                      </>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
                      <p className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2">
                        {item.prompt}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.image_url && (
                          <a
                            href={item.image_url}
                            download={`design-${item.id}.png`}
                            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download size={11} className="text-white" />
                          </a>
                        )}
                        <button className="w-7 h-7 rounded-lg bg-white/15 hover:bg-red-500/60 flex items-center justify-center transition-colors">
                          <Trash2 size={11} className="text-white" />
                        </button>
                        <a
                          href={`/generate?q=${encodeURIComponent(item.prompt)}`}
                          className="w-7 h-7 rounded-lg bg-white/15 hover:bg-[var(--accent)]/60 flex items-center justify-center transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RefreshCw size={11} className="text-white" />
                        </a>
                      </div>
                    </div>
                    {/* Time badge */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
                      <span className="text-[9px] text-white/70 font-medium">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {filteredGallery.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <Sparkles
                      size={28}
                      className="text-[var(--accent)] opacity-30"
                    />
                    <p className="text-sm text-[var(--text-muted)]">
                      Belum ada gambar yang digenerate.
                    </p>
                    <a
                      href="/generate"
                      className="btn-shimmer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white mt-1"
                    >
                      <Plus size={13} /> Generate Sekarang
                    </a>
                  </div>
                )}

                {/* New generation card */}
                <a
                  href="/generate"
                  className="group aspect-square rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
                    <Plus size={16} className="text-[var(--accent)]" />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold text-center px-2">
                    New Generation
                  </span>
                </a>
              </div>
            ) : (
              /* List view */
              <div className="flex flex-col gap-2">
                {filteredGallery.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <Sparkles
                      size={28}
                      className="text-[var(--accent)] opacity-30"
                    />
                    <p className="text-sm text-[var(--text-muted)]">
                      Belum ada gambar tersimpan.
                    </p>
                  </div>
                )}
                {filteredGallery.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/25 transition-all duration-200"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] shrink-0 ${!item.image_url ? `bg-gradient-to-br ${item.color} flex items-center justify-center` : ""}`}
                    >
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sparkles
                          size={14}
                          className="text-[var(--accent)] opacity-50"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {item.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.image_url && (
                        <a
                          href={item.image_url}
                          download={`design-${item.id}.png`}
                          className="w-7 h-7 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/40 flex items-center justify-center transition-colors"
                        >
                          <Download
                            size={12}
                            className="text-[var(--text-muted)]"
                          />
                        </a>
                      )}
                      <button className="w-7 h-7 rounded-lg border border-[var(--border)] hover:border-red-500/40 hover:text-red-400 flex items-center justify-center transition-colors">
                        <Trash2
                          size={12}
                          className="text-[var(--text-muted)]"
                        />
                      </button>
                    </div>
                    <button className="text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors ml-1">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="flex flex-col gap-5">
            {/* Recent Activity */}
            <div className="feature-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[var(--accent)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Recent Activity
                  </h3>
                </div>
                <button className="text-[10px] text-[var(--accent)] font-semibold hover:underline">
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {(data?.recent_activity ?? []).length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">
                    Belum ada aktivitas.
                  </p>
                )}
                {(data?.recent_activity ?? []).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.status === "success" ? "bg-[var(--accent)]" : "bg-red-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed line-clamp-1">
                        {item.prompt}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {item.time}
                        </span>
                        <span className="text-[10px] tag-pill px-1.5 py-0.5 rounded-md">
                          {item.model}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Prompts */}
            <div className="feature-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-[var(--accent)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Saved Prompts
                  </h3>
                </div>
                <button className="text-[10px] text-[var(--accent)] font-semibold hover:underline">
                  View all
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {(data?.saved_prompts ?? []).length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-3">
                    Belum ada prompt tersimpan.
                  </p>
                )}
                {(data?.saved_prompts ?? []).map((p, i) => (
                  <a
                    key={i}
                    href={`/generate?q=${encodeURIComponent(p)}`}
                    className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all duration-200"
                  >
                    <p className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-1 flex-1">
                      {p}
                    </p>
                    <ChevronRight
                      size={12}
                      className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors shrink-0"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Generate */}
            <div className="relative rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/8 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center mb-3">
                  <Sparkles size={16} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  Ready to create?
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                  Jump straight into the generator and bring your ideas to life.
                </p>
                <a
                  href="/generate"
                  className="btn-shimmer flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white"
                >
                  Start Generating
                  <ChevronRight size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
