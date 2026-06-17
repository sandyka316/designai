"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  User,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Google Icon ───────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const PERKS = [
  "5x generate per hari",
  "2x AI recommendation per hari",
  "Dashboard & analytics pribadi",
  "Simpan riwayat desain",
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);

    try {
      // 1. Daftar ke backend
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.detail ?? "Registrasi gagal. Coba lagi.");
        setLoading(false);
        return;
      }

      // 2. Auto-login setelah berhasil daftar
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        // Daftar berhasil tapi login gagal — arahkan ke login manual
        router.push("/login?registered=1");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi dan coba lagi.");
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(ellipse, rgba(124,109,250,0.8), transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-15"
        style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.6), transparent 70%)" }} />

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
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

          <div className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">
                Create your account
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Gratis selamanya — mulai generate sekarang
              </p>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-2 gap-2 mb-6 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              {PERKS.map((perk, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[var(--accent)] shrink-0" />
                  <span className="text-xs text-[var(--text-muted)]">{perk}</span>
                </div>
              ))}
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogleRegister}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:border-[var(--accent)]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-5"
            >
              {googleLoading ? (
                <Sparkles size={16} className="animate-spin text-[var(--accent)]" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? "Redirecting..." : "Sign up with Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-dim)]">or with email</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-sm font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="your_username"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                    required
                    minLength={3}
                  />
                </div>
              </div>

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
                    placeholder="Min. 6 karakter"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                    required
                    minLength={6}
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
                disabled={loading || googleLoading}
                className="btn-shimmer flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Sparkles size={15} className="animate-pulse" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Create Free Account
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Login link */}
            <p className="text-center text-sm text-[var(--text-muted)] mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[var(--accent)] hover:underline underline-offset-2 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center text-xs text-[var(--text-dim)] mt-6">
          <Link href="/" className="hover:text-[var(--text-muted)] transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
