"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { resetGuestCount, setLoggedIn } from "@/lib/guestLimit";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Demo: accept any non-empty credentials
    await new Promise((r) => setTimeout(r, 900));

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Mark as logged in so GuestLimitModal is never triggered again
    setLoggedIn();

    // Reset guest limit counter on login
    resetGuestCount();

    // Redirect to where user came from
    router.push(redirect);
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(ellipse, rgba(124,109,250,0.8), transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-15"
        style={{ background: "radial-gradient(ellipse, rgba(45,212,191,0.6), transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Design<span className="text-[var(--accent)]">AI</span>
          </span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
          style={{ boxShadow: "0 0 0 1px rgba(124,109,250,0.1), 0 24px 80px rgba(0,0,0,0.4)" }}>
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Log in to continue generating amazing designs
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-shimmer flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Sparkles size={15} className="animate-pulse" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Sign In
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-dim)]">or</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-[var(--text-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--accent)] hover:underline underline-offset-2 transition-colors"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-[var(--text-dim)] mt-6">
          <Link
            href="/"
            className="hover:text-[var(--text-muted)] transition-colors"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
