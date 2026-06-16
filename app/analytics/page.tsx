"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  Network,
  Calendar,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";

// ── TYPES ─────────────────────────────────────────────────────────────

interface ClusterItem {
  id: string;
  prompt: string;
  image_url: string | null;
  created_at: string;
}

interface Cluster {
  id: number;
  label: string;
  count: number;
  color: { bg: string; text: string; name: string };
  items: ClusterItem[];
}

interface ClustersData {
  clusters: Cluster[];
  total_items: number;
  k: number;
  message: string;
}

interface Rule {
  if_you_like: string[];
  you_might_also_like: string[];
  support: number;
  confidence: number;
  lift: number;
  description: string;
}

interface AssociationsData {
  rules: Rule[];
  total_transactions: number;
  frequent_itemsets_count: number;
  message: string;
}

interface TrendKeyword {
  keyword: string;
  count: number;
  pct: number;
}

interface TrendingUpItem {
  keyword: string;
  this_week: number;
  last_week: number;
  growth: number;
  pct_growth: number | null;
  is_new: boolean;
}

interface DailyActivity {
  date: string;
  label: string;
  count: number;
}

interface TrendsData {
  top_keywords: TrendKeyword[];
  trending_up: TrendingUpItem[];
  weekly_comparison: any[];
  daily_activity: DailyActivity[];
  top_models: any[];
  total_in_period: number;
  this_week_count: number;
  last_week_count: number;
  period_days: number;
  message: string;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"clusters" | "associations" | "trends">("clusters");

  const [clusters, setClusters] = useState<ClustersData | null>(null);
  const [associations, setAssociations] = useState<AssociationsData | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resClusters, resAssoc, resTrends] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/analytics/clusters?k=4").then(r => r.json()),
        fetch("http://127.0.0.1:8000/api/analytics/associations").then(r => r.json()),
        fetch("http://127.0.0.1:8000/api/analytics/trends?days=30").then(r => r.json())
      ]);

      if (resClusters.error) throw new Error(resClusters.error);

      setClusters(resClusters);
      setAssociations(resAssoc);
      setTrends(resTrends);
    } catch (e: any) {
      setError(e.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar hideCenterNav />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Running data mining algorithms...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar hideCenterNav />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Analytics Error</p>
            <p className="text-xs text-[var(--text-muted)]">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              <RefreshCw size={13} /> Try Again
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
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Data Mining
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Design Analytics
            </h1>
          </div>
          <button
            onClick={fetchAnalytics}
            className="btn-outline flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium self-start md:self-auto"
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-2 mb-8 bg-[var(--bg-card)] border border-[var(--border)] p-1.5 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("clusters")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "clusters"
                ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Layers size={16} />
            Design Clusters
          </button>
          <button
            onClick={() => setActiveTab("associations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "associations"
                ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Network size={16} />
            Association Rules
          </button>
          <button
            onClick={() => setActiveTab("trends")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "trends"
                ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TrendingUp size={16} />
            Trend Analysis
          </button>
        </div>

        {/* ── TAB CONTENT: CLUSTERS ── */}
        {activeTab === "clusters" && clusters && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                K-Means Style Clustering
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                AI groups your generations automatically based on prompt semantics and text similarities (TF-IDF).
                Found <strong className="text-[var(--text-primary)]">{clusters.clusters.length} clusters</strong> from {clusters.total_items} designs.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {clusters.clusters.length === 0 ? (
                <div className="col-span-full feature-card p-10 text-center rounded-2xl flex flex-col items-center">
                  <Layers size={32} className="text-[var(--text-muted)] mb-3" />
                  <p className="text-[var(--text-primary)] font-medium">Not enough data</p>
                  <p className="text-sm text-[var(--text-muted)]">Need at least 4 generations to perform clustering.</p>
                </div>
              ) : (
                clusters.clusters.map((cluster) => (
                  <div key={cluster.id} className="feature-card rounded-2xl p-5 border-t-4" style={{ borderTopColor: cluster.color.bg }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                          style={{ backgroundColor: cluster.color.bg }}
                        >
                          C{cluster.id + 1}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)] capitalize">
                            {cluster.label}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            {cluster.count} designs ({Math.round(cluster.count / clusters.total_items * 100)}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {cluster.items.map(item => (
                        <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)] relative group">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-primary)]">
                              <Sparkles size={16} className="text-[var(--text-muted)] opacity-50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center p-2">
                            <p className="text-[9px] text-white/90 line-clamp-3 leading-tight">{item.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: ASSOCIATIONS ── */}
        {activeTab === "associations" && associations && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                Apriori Association Rules
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Discovers hidden patterns in user behavior to build recommendation rules.
                Analyzed {associations.total_transactions} generation sessions.
              </p>
            </div>

            {associations.rules.length === 0 ? (
              <div className="feature-card p-10 text-center rounded-2xl flex flex-col items-center">
                <Network size={32} className="text-[var(--text-muted)] mb-3" />
                <p className="text-[var(--text-primary)] font-medium">No strong patterns found yet</p>
                <p className="text-sm text-[var(--text-muted)]">{associations.message}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {associations.rules.map((rule, idx) => {
                  const ruleColors = [
                    { hex: "#7c6dfa", hex2: "#4facfe", rgb: { r: 124, g: 109, b: 250 } },
                    { hex: "#06b6d4", hex2: "#8b5cf6", rgb: { r: 6, g: 182, b: 212 } },
                    { hex: "#10b981", hex2: "#06b6d4", rgb: { r: 16, g: 185, b: 129 } },
                    { hex: "#f59e0b", hex2: "#fb923c", rgb: { r: 245, g: 158, b: 11 } },
                    { hex: "#8b5cf6", hex2: "#ec4899", rgb: { r: 139, g: 92, b: 246 } },
                    { hex: "#ef4444", hex2: "#f97316", rgb: { r: 239, g: 68, b: 68 } },
                  ];
                  const rc = ruleColors[idx % ruleColors.length];
                  return (
                    <SpotlightCard key={idx} hex={rc.hex} hex2={rc.hex2} rgb={rc.rgb} lift={6} className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="tag-pill px-2 py-1 rounded text-[10px] font-bold">
                          Rule #{idx + 1}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded">
                          {(rule.confidence * 100).toFixed(0)}% Match
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-2.5">
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">If user generates</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] capitalize">
                            {rule.if_you_like.join(", ")}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                        <div className="flex-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg p-2.5">
                          <p className="text-[10px] text-[var(--accent)] uppercase tracking-wider mb-1">Recommend</p>
                          <p className="text-sm font-bold text-[var(--text-primary)] capitalize">
                            {rule.you_might_also_like.join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-[10px] text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
                        <span>Support: {(rule.support * 100).toFixed(1)}%</span>
                        <span>Lift: {rule.lift.toFixed(2)}x</span>
                      </div>
                    </SpotlightCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: TRENDS ── */}
        {activeTab === "trends" && trends && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  Style Trends & Analytics
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Mining the most popular keywords and rising styles from the last {trends.period_days} days.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border)] px-4 py-2 rounded-xl">
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--text-primary)]">{trends.total_in_period}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Generations</p>
                </div>
                <div className="w-px h-8 bg-[var(--border)]" />
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--accent)]">+{trends.this_week_count}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">This Week</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Activity Chart */}
              <div className="lg:col-span-2 feature-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--accent)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Daily Activity (Last 7 Days)</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
                    Total: <span className="font-bold text-[var(--text-primary)] ml-0.5">
                      {trends.daily_activity.reduce((s, d) => s + d.count, 0)} generations
                    </span>
                  </div>
                </div>

                {trends.daily_activity.length > 0 ? (() => {
                  const maxCount = Math.max(...trends.daily_activity.map(d => d.count), 1);
                  const totalWeek = trends.daily_activity.reduce((s, d) => s + d.count, 0);
                  return (
                    <div className="flex flex-col gap-0">
                      {/* Y-axis labels + bars */}
                      <div className="flex gap-3">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between text-[9px] text-[var(--text-muted)] text-right w-5 pb-6" style={{ height: "180px" }}>
                          <span>{maxCount}</span>
                          <span>{Math.round(maxCount * 0.75)}</span>
                          <span>{Math.round(maxCount * 0.5)}</span>
                          <span>{Math.round(maxCount * 0.25)}</span>
                          <span>0</span>
                        </div>

                        {/* Chart area */}
                        <div className="flex-1 flex flex-col" style={{ height: "180px" }}>
                          {/* Grid lines + bars */}
                          <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            {[0, 25, 50, 75, 100].map(pct => (
                              <div
                                key={pct}
                                className="absolute w-full border-t border-dashed border-[var(--border)]/50"
                                style={{ bottom: `${pct}%` }}
                              />
                            ))}

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-end justify-around gap-1 px-1">
                              {trends.daily_activity.map((day, i) => {
                                const heightPct = (day.count / maxCount) * 100;
                                const isToday = day.date === new Date().toISOString().slice(0, 10);
                                const isEmpty = day.count === 0;

                                return (
                                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    {/* Tooltip */}
                                    {!isEmpty && (
                                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border)] shadow-lg px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                        <span className="text-[var(--accent)]">{day.count}</span>
                                        <span className="text-[var(--text-muted)] ml-1">gen</span>
                                      </div>
                                    )}

                                    {/* Bar */}
                                    <div
                                      className={`w-full rounded-t-md transition-all duration-500 relative overflow-hidden ${
                                        isEmpty
                                          ? "bg-[var(--border)]/30 rounded-md"
                                          : isToday
                                          ? "bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30"
                                          : "bg-[var(--accent)]/70 hover:bg-[var(--accent)] cursor-pointer"
                                      }`}
                                      style={{
                                        height: isEmpty ? "6px" : `${heightPct}%`,
                                        minHeight: isEmpty ? "6px" : "12px",
                                      }}
                                    >
                                      {/* Shimmer effect on bar */}
                                      {!isEmpty && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* X-axis labels */}
                          <div className="flex justify-around px-1 pt-2">
                            {trends.daily_activity.map((day, i) => {
                              const isToday = day.date === new Date().toISOString().slice(0, 10);
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                  <span className={`text-[10px] font-semibold ${isToday ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                                    {day.label}
                                  </span>
                                  {isToday && (
                                    <span className="w-1 h-1 rounded-full bg-[var(--accent)] inline-block" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Summary stats bawah chart */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Peak Day</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              {(() => {
                                const peak = trends.daily_activity.reduce((a, b) => a.count >= b.count ? a : b);
                                return peak.count > 0 ? `${peak.label} (${peak.count}x)` : "—";
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Avg / Day</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              {totalWeek > 0 ? (totalWeek / 7).toFixed(1) : "0"} gen
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Active Days</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">
                              {trends.daily_activity.filter(d => d.count > 0).length} / 7
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)] inline-block" />
                          Active
                          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--border)]/30 inline-block ml-2" />
                          No activity
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="h-48 flex items-center justify-center text-sm text-[var(--text-muted)]">
                    No activity data
                  </div>
                )}
              </div>

              {/* Trending Up */}
              <div className="feature-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <ArrowUpRight size={16} className="text-green-500" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Trending Up</h3>
                </div>

                <div className="flex flex-col gap-4">
                  {trends.trending_up.length > 0 ? (
                    trends.trending_up.map((trend, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 text-center text-xs font-bold text-[var(--text-muted)]">{i + 1}</div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">{trend.keyword}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {trend.is_new ? (
                            <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-bold">NEW</span>
                          ) : (
                            <span className="text-xs text-green-500 font-bold">+{trend.pct_growth}%</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] text-center py-4">No trending keywords yet.</p>
                  )}
                </div>
              </div>

              {/* Top Keywords Cloud */}
              <div className="lg:col-span-3 feature-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[var(--accent)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Most Popular Keywords</h3>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">{trends.top_keywords.length} keywords</span>
                </div>

                {/* Word Cloud style — ukuran font bervariasi, spacing proper */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {trends.top_keywords.map((kw, i) => {
                    const maxCount = Math.max(...trends.top_keywords.map(k => k.count));
                    // Font size: 12px (paling kecil) → 24px (paling besar)
                    const fontSize = Math.round(12 + ((kw.count / maxCount) * 12));
                    // Opacity: 0.5 → 1
                    const opacity = 0.5 + (kw.count / maxCount) * 0.5;
                    // Warna berdasarkan rank
                    const colors = [
                      "bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]",
                      "bg-purple-500/10 border-purple-500/30 text-purple-400",
                      "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
                      "bg-amber-500/10 border-amber-500/30 text-amber-400",
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                    ];
                    const colorClass = colors[i % colors.length];

                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClass} transition-all hover:scale-105 cursor-default`}
                        style={{ opacity }}
                        title={`${kw.keyword}: ${kw.count}x (${kw.pct}%)`}
                      >
                        <span className="font-bold capitalize" style={{ fontSize: `${fontSize}px`, lineHeight: 1.3 }}>
                          {kw.keyword}
                        </span>
                        <span className="text-[11px] font-semibold opacity-80 bg-black/10 px-1.5 py-0.5 rounded-full">
                          {kw.count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* List view dengan progress bar */}
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Frequency Breakdown</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                    {trends.top_keywords.map((kw, i) => {
                      const maxCount = Math.max(...trends.top_keywords.map(k => k.count));
                      const widthPct = Math.round((kw.count / maxCount) * 100);
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)] w-4 text-right shrink-0">{i + 1}</span>
                          <span className="text-xs font-semibold text-[var(--text-primary)] capitalize w-20 shrink-0 truncate">
                            {kw.keyword}
                          </span>
                          <div className="flex-1 bg-[var(--border)]/40 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent)]/70 rounded-full transition-all duration-700"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-primary)] w-5 text-right shrink-0">
                            {kw.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
