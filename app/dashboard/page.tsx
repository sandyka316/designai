"use client";

import { useState } from "react";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── DUMMY DATA ────────────────────────────────────────────────
const STATS = [
  {
    label: "Total Generated",
    value: "128",
    icon: ImageIcon,
    change: "+12 this week",
  },
  { label: "Credits Left", value: "42", icon: Zap, change: "of 50 monthly" },
  { label: "Saved Designs", value: "24", icon: Star, change: "+3 this week" },
  {
    label: "Avg. Gen Time",
    value: "2.4s",
    icon: TrendingUp,
    change: "faster than avg",
  },
];

const RECENT_ACTIVITY = [
  {
    id: "1",
    prompt: "Minimalist logo for a coffee brand with earthy tones",
    model: "HD",
    time: "2 mins ago",
    status: "success",
  },
  {
    id: "2",
    prompt: "Futuristic packaging for a tech startup with neon accents",
    model: "HD",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: "3",
    prompt: "Elegant UI card for fashion e-commerce dark mode",
    model: "HD",
    time: "3 hours ago",
    status: "success",
  },
  {
    id: "4",
    prompt: "Bold poster for a music festival with grunge aesthetic",
    model: "HD",
    time: "Yesterday",
    status: "success",
  },
  {
    id: "5",
    prompt: "Abstract art for a wellness app background",
    model: "HD",
    time: "Yesterday",
    status: "failed",
  },
];

const GALLERY_ITEMS = [
  {
    id: "1",
    prompt: "Minimalist coffee brand logo",
    color: "from-amber-900/40 to-orange-900/20",
    time: "2 mins ago",
  },
  {
    id: "2",
    prompt: "Futuristic tech packaging",
    color: "from-blue-900/40 to-cyan-900/20",
    time: "1 hour ago",
  },
  {
    id: "3",
    prompt: "Fashion e-commerce UI card",
    color: "from-pink-900/40 to-rose-900/20",
    time: "3 hours ago",
  },
  {
    id: "4",
    prompt: "Music festival poster",
    color: "from-purple-900/40 to-violet-900/20",
    time: "Yesterday",
  },
  {
    id: "5",
    prompt: "Wellness app background",
    color: "from-green-900/40 to-teal-900/20",
    time: "Yesterday",
  },
  {
    id: "6",
    prompt: "Luxury perfume packaging",
    color: "from-yellow-900/40 to-amber-900/20",
    time: "2 days ago",
  },
  {
    id: "7",
    prompt: "Streetwear brand identity",
    color: "from-slate-800/60 to-gray-900/20",
    time: "2 days ago",
  },
  {
    id: "8",
    prompt: "Organic skincare label",
    color: "from-lime-900/40 to-green-900/20",
    time: "3 days ago",
  },
];

const SAVED_PROMPTS = [
  "Minimalist logo for a coffee brand",
  "Futuristic packaging for a tech startup",
  "Elegant UI card for fashion e-commerce",
  "Bold poster for a music festival",
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "recent">("all");

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
          <a
            href="/generate"
            className="btn-shimmer inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white self-start md:self-auto"
          >
            <Plus size={16} />
            New Generation
          </a>
        </div>

        {/* ─── STATS ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STATS.map((stat, i) => (
            <div key={i} className="feature-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                  <stat.icon size={16} className="text-[var(--accent)]" />
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
          ))}
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
                  Free Plan — 42 credits remaining
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
                  42 / 50 credits
                </span>
                <div className="w-28 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: "84%" }}
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
                {GALLERY_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] cursor-pointer"
                  >
                    {/* Placeholder gradient */}
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
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3">
                      <p className="text-[10px] text-white text-center font-medium leading-tight line-clamp-2">
                        {item.prompt}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <button className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                          <Download size={11} className="text-white" />
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-white/15 hover:bg-red-500/60 flex items-center justify-center transition-colors">
                          <Trash2 size={11} className="text-white" />
                        </button>
                        <button className="w-7 h-7 rounded-lg bg-white/15 hover:bg-[var(--accent)]/60 flex items-center justify-center transition-colors">
                          <RefreshCw size={11} className="text-white" />
                        </button>
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
                {GALLERY_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-4 p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/25 transition-all duration-200"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} border border-[var(--border)] flex items-center justify-center shrink-0`}
                    >
                      <Sparkles
                        size={14}
                        className="text-[var(--accent)] opacity-50"
                      />
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
                      <button className="w-7 h-7 rounded-lg border border-[var(--border)] hover:border-[var(--accent)]/40 flex items-center justify-center transition-colors">
                        <Download
                          size={12}
                          className="text-[var(--text-muted)]"
                        />
                      </button>
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
                {RECENT_ACTIVITY.map((item) => (
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
                {SAVED_PROMPTS.map((p, i) => (
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
