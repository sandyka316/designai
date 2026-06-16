"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  Activity,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileText,
  Calendar,
  Target,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";

// ── TYPES ──────────────────────────────────────────────────────────────────

interface BISummary {
  total_generations: number;
  total_success: number;
  total_failed: number;
  success_rate: number;
  avg_generation_time_ms: number;
  avg_generation_time_str: string;
  period_days: number;
  total_users: number;
  registered_users: number;
  guest_users: number;
  conversion_rate: number;
  avg_rating: number | null;
  total_rated: number;
}

interface WeeklyData {
  this_week: number;
  last_week: number;
  growth_pct: number | null;
}

interface DailyTrend {
  date: string;
  label: string;
  total: number;
  success: number;
  failed: number;
}

interface Keyword {
  keyword: string;
  count: number;
  pct: number;
}

interface KeywordTrend {
  keyword: string;
  this_week: number;
  last_week: number;
  growth: number;
  is_new: boolean;
}

interface ModelUsage {
  model: string;
  count: number;
  pct: number;
}

interface BIData {
  summary: BISummary;
  weekly: WeeklyData;
  daily_trend: DailyTrend[];
  top_keywords: Keyword[];
  keyword_trend: KeywordTrend[];
  model_usage: ModelUsage[];
  rating_distribution: Record<string, number>;
  hourly_activity: { hour: string; count: number }[];
}

// ── STAT CARD ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  color2 = "#4facfe",
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  color2?: string;
  trend?: "up" | "down" | "neutral";
}) {
  // Parse hex to rgb for SpotlightCard
  const hexToRgb = (hex: string) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 124, g: 109, b: 250 };
  };

  return (
    <SpotlightCard hex={color} hex2={color2} rgb={hexToRgb(color)} lift={6} className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1.5px solid ${color}30` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              trend === "up"
                ? "text-emerald-400 bg-emerald-500/10"
                : trend === "down"
                ? "text-red-400 bg-red-500/10"
                : "text-[var(--text-muted)] bg-[var(--border)]/30"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={10} />
            ) : trend === "down" ? (
              <ArrowDownRight size={10} />
            ) : (
              <Minus size={10} />
            )}
          </div>
        )}
      </div>
      <p className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
        {value}
      </p>
      <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-[var(--text-dim)] mt-1">{sub}</p>
      )}
    </SpotlightCard>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function BIAdminPage() {
  const [data, setData] = useState<BIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [activeChart, setActiveChart] = useState<"daily" | "hourly">("daily");

  const fetchBI = async (periodDays = days) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/bi/summary?days=${periodDays}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load BI data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBI();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/bi/export?days=${days}`
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `designai_report_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. Make sure backend is running.");
    } finally {
      setExporting(false);
    }
  };

  const handlePeriodChange = (newDays: number) => {
    setDays(newDays);
    fetchBI(newDays);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar hideCenterNav />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">
              Loading Business Intelligence data...
            </p>
          </div>
      </div>
      <Footer />
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
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              BI Dashboard Error
            </p>
            <p className="text-xs text-[var(--text-muted)]">{error}</p>
            <button
              onClick={() => fetchBI()}
              className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
            >
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { summary, weekly, daily_trend, top_keywords, keyword_trend, model_usage, rating_distribution, hourly_activity } = data;

  // Chart helpers
  const maxDaily = Math.max(...daily_trend.map((d) => d.total), 1);
  const maxHourly = Math.max(...hourly_activity.map((h) => h.count), 1);
  const maxKeyword = Math.max(...top_keywords.map((k) => k.count), 1);

  // Rating stars
  const totalRated = Object.values(rating_distribution).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav />

      <div className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] tracking-widest uppercase mb-1">
              Admin Panel
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
              <BarChart2 size={32} className="text-[var(--accent)]" />
              Business Intelligence
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Visual dashboard & analytics for DesignAI platform performance
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => handlePeriodChange(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    days === d
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchBI()}
              className="btn-outline flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-shimmer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
            >
              {exporting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Download size={13} />
              )}
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Zap}
            label="Total Generations"
            value={summary.total_generations.toLocaleString()}
            sub={`Last ${summary.period_days} days`}
            color="#7c6dfa"
            trend={
              weekly.growth_pct !== null
                ? weekly.growth_pct > 0
                  ? "up"
                  : "down"
                : "neutral"
            }
          />
          <StatCard
            icon={CheckCircle2}
            label="Success Rate"
            value={`${summary.success_rate}%`}
            sub={`${summary.total_success} success / ${summary.total_failed} failed`}
            color="#10b981"
            trend={summary.success_rate >= 80 ? "up" : "down"}
          />
          <StatCard
            icon={Users}
            label="Conversion Rate"
            value={`${summary.conversion_rate}%`}
            sub={`${summary.registered_users} registered / ${summary.guest_users} guest`}
            color="#3b82f6"
            trend={summary.conversion_rate > 0 ? "up" : "neutral"}
          />
          <StatCard
            icon={Clock}
            label="Avg. Gen Time"
            value={summary.avg_generation_time_str}
            sub="Per generation"
            color="#f59e0b"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Activity}
            label="This Week"
            value={weekly.this_week.toString()}
            sub={
              weekly.growth_pct !== null
                ? `${weekly.growth_pct > 0 ? "+" : ""}${weekly.growth_pct}% vs last week`
                : "No data last week"
            }
            color="#8b5cf6"
            trend={
              weekly.growth_pct !== null
                ? weekly.growth_pct > 0
                  ? "up"
                  : "down"
                : "neutral"
            }
          />
          <StatCard
            icon={Target}
            label="Total Users"
            value={summary.total_users.toString()}
            sub={`${summary.registered_users} registered`}
            color="#06b6d4"
          />
          <StatCard
            icon={FileText}
            label="Last Week"
            value={weekly.last_week.toString()}
            sub="Previous week generations"
            color="#64748b"
          />
        </div>

        {/* ── TREND CHART ── */}
        <div className="feature-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Generation Trend
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border)] p-1 rounded-lg">
              <button
                onClick={() => setActiveChart("daily")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeChart === "daily"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setActiveChart("hourly")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeChart === "hourly"
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Hourly
              </button>
            </div>
          </div>

          {activeChart === "daily" ? (
            <div>
              {/* Bar chart daily */}
              <div className="flex gap-2" style={{ height: "200px" }}>
                {/* Y axis */}
                <div
                  className="flex flex-col justify-between text-[9px] text-[var(--text-dim)] text-right shrink-0 pb-6"
                  style={{ width: "24px" }}
                >
                  <span>{maxDaily}</span>
                  <span>{Math.round(maxDaily * 0.5)}</span>
                  <span>0</span>
                </div>
                {/* Bars */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex items-end gap-0.5 relative">
                    {/* Grid lines */}
                    {[0, 50, 100].map((pct) => (
                      <div
                        key={pct}
                        className="absolute w-full border-t border-dashed border-[var(--border)]/40"
                        style={{ bottom: `${pct}%` }}
                      />
                    ))}
                    {/* Only show last 30 days, sample if needed */}
                    {daily_trend.slice(-days > 30 ? -30 : -days || undefined).map((day, i) => {
                      const hPct = (day.total / maxDaily) * 100;
                      const isEmpty = day.total === 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          {!isEmpty && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-1 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              <span className="text-[var(--accent)] font-bold">{day.total}</span>
                              <span className="text-[var(--text-muted)]"> gen</span>
                            </div>
                          )}
                          <div className="w-full flex flex-col justify-end" style={{ height: `${Math.max(hPct, isEmpty ? 3 : 5)}%` }}>
                            {/* Success part */}
                            <div
                              className="w-full rounded-t-sm"
                              style={{
                                height: day.total > 0 ? `${(day.success / day.total) * 100}%` : "100%",
                                background: isEmpty ? "var(--border)" : "var(--accent)",
                                opacity: isEmpty ? 0.3 : 1,
                                minHeight: "4px",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* X labels — show every nth */}
                  <div className="flex justify-between px-1 pt-2 text-[8px] text-[var(--text-dim)]">
                    {daily_trend
                      .filter((_, i) => {
                        const total = daily_trend.length;
                        return i % Math.ceil(total / 6) === 0 || i === total - 1;
                      })
                      .map((day, i) => (
                        <span key={i}>{day.label}</span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="w-3 h-3 rounded-sm bg-[var(--accent)] inline-block" />
                  Success generations
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span className="text-[var(--text-primary)] font-bold">Total:</span>
                  {summary.total_generations} in {summary.period_days} days
                  {" · "}
                  Avg {(summary.total_generations / summary.period_days).toFixed(1)}/day
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Hourly heatmap */}
              <div className="flex items-end gap-1" style={{ height: "160px" }}>
                {hourly_activity.map((h, i) => {
                  const pct = (h.count / maxHourly) * 100;
                  const isEmpty = h.count === 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      {!isEmpty && (
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)] border border-[var(--border)] px-2 py-1 rounded text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <span className="text-[var(--accent)] font-bold">{h.count}</span>
                        </div>
                      )}
                      <div
                        className="w-full rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${Math.max(pct, isEmpty ? 2 : 4)}%`,
                          background: isEmpty
                            ? "var(--border)"
                            : `rgba(124, 109, 250, ${0.3 + (pct / 100) * 0.7})`,
                          minHeight: "3px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[8px] text-[var(--text-dim)]">
                {["00:00", "06:00", "12:00", "18:00", "23:00"].map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">
                Peak hour: {hourly_activity.reduce((a, b) => a.count >= b.count ? a : b).hour}
                {" · "}
                {maxHourly} max generations/hour
              </p>
            </div>
          )}
        </div>

        {/* ── 2 COLUMNS: Keywords | Model Usage ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Top Keywords */}
          <div className="feature-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={15} className="text-[var(--accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Top Prompt Keywords</h3>
            </div>
            <div className="space-y-2.5">
              {top_keywords.slice(0, 12).map((kw, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-dim)] w-4 text-right shrink-0">{i + 1}</span>
                  <span className="text-xs font-semibold text-[var(--text-primary)] capitalize w-20 shrink-0 truncate">
                    {kw.keyword}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.round((kw.count / maxKeyword) * 100)}%`,
                        background: `hsl(${260 - i * 10}, 70%, 65%)`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-primary)] w-5 text-right shrink-0">
                    {kw.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Usage */}
          <div className="feature-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={15} className="text-amber-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Model Usage</h3>
            </div>
            {model_usage.length > 0 ? (
              <div className="space-y-4">
                {model_usage.map((m, i) => {
                  const modelColors = ["#7c6dfa", "#06b6d4", "#f59e0b", "#10b981"];
                  const color = modelColors[i % modelColors.length];
                  const shortName = m.model.split("/").pop() || m.model;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[140px]" title={m.model}>
                          {shortName}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-muted)]">
                          {m.count}x ({m.pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--border)]/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${m.pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No data yet</p>
            )}

            {/* Success vs Failed donut */}
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider mb-3">Status Breakdown</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-emerald-400 font-bold">Success</span>
                    <span className="text-[var(--text-muted)]">{summary.success_rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)]/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${summary.success_rate}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-red-400 font-bold">Failed</span>
                    <span className="text-[var(--text-muted)]">{(100 - summary.success_rate).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)]/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500/70"
                      style={{ width: `${100 - summary.success_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── EXPORT SECTION ── */}
        <div className="feature-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <Download size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Export Report</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Download generation history as CSV for reporting & analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">Ready to export</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {summary.total_generations} records
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-shimmer flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              >
                {exporting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                {exporting ? "Exporting..." : "Download CSV"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border)]">
            {[
              { label: "Columns", value: "13 fields" },
              { label: "Format", value: "CSV (UTF-8)" },
              { label: "Includes", value: "Prompt, model, status, rating, time" },
              { label: "Period", value: `Last ${days} days` },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </main>
  );
}
