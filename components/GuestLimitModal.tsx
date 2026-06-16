"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Lock,
  ArrowRight,
  X,
  Zap,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { GUEST_LIMIT, resetGuestCount, setLoggedIn } from "@/lib/guestLimit";

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after successful login so parent can also reset its state */
  onLoginSuccess?: () => void;
}

export default function GuestLimitModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: GuestLimitModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks in refs so they're never stale inside async handlers
  const onCloseRef = useRef(onClose);
  const onLoginSuccessRef = useRef(onLoginSuccess);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onLoginSuccessRef.current = onLoginSuccess; }, [onLoginSuccess]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setShowPw(false);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network latency (replace with real auth call if needed)
    await new Promise((r) => setTimeout(r, 900));

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    // Mark user as logged in (persisted) so the guest limit is never triggered again
    setLoggedIn();
    // Clear guest count as well for cleanliness
    resetGuestCount();

    // Notify parent, then close — use refs so closures are never stale
    onLoginSuccessRef.current?.();
    onCloseRef.current();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1px rgba(124,109,250,0.15), 0 24px 80px rgba(0,0,0,0.6), 0 0 120px rgba(124,109,250,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent" />

        {/* Background orb */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[80px] pointer-events-none opacity-20"
          style={{
            background:
              "radial-gradient(ellipse, rgba(124,109,250,0.8), transparent 70%)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-all duration-200 z-10"
        >
          <X size={15} />
        </button>

        <div className="relative p-8">
          {/* Icon */}
          <div className="flex items-center justify-center mb-5">
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,109,250,0.2), rgba(79,172,254,0.1))",
                border: "1.5px solid rgba(124,109,250,0.4)",
                boxShadow:
                  "0 0 32px rgba(124,109,250,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <Lock size={24} className="text-[var(--accent)]" />
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-15"
                style={{ background: "rgba(124,109,250,0.4)" }}
              />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-1.5 tracking-tight">
              Free Limit Reached
            </h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              You&apos;ve used your{" "}
              <span className="font-bold text-[var(--accent)]">
                {GUEST_LIMIT} free generations
              </span>{" "}
              as a guest. Sign in to continue without limits.
            </p>
          </div>

          {/* Benefits list */}
          <div
            className="rounded-2xl p-3.5 mb-5"
            style={{
              background: "rgba(124,109,250,0.06)",
              border: "1px solid rgba(124,109,250,0.15)",
            }}
          >
            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-2.5">
              After logging in you get:
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: Zap, text: "Unlimited image generations" },
                { icon: Sparkles, text: "Access to all AI features" },
                { icon: ArrowRight, text: "Save & manage your results" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(124,109,250,0.15)",
                      border: "1px solid rgba(124,109,250,0.3)",
                    }}
                  >
                    <Icon size={10} className="text-[var(--accent)]" />
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inline login form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Email */}
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] pointer-events-none"
              />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/60 focus:bg-[var(--bg-primary)] transition-all"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2.5">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Sparkles size={14} className="animate-pulse" />
                  Signing in...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Get Started
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2.5 rounded-2xl text-sm font-semibold text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] transition-all duration-200"
          >
            Maybe Later
          </button>

          {/* Footer note */}
          <p className="text-center text-[10px] text-[var(--text-dim)] mt-4">
            No credit card required · Free account available
          </p>
        </div>
      </div>
    </div>
  );
}
