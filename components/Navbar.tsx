"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode, JSX } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ImageIcon,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Wand2,
  LogOut,
  User,
} from "lucide-react";

const NAV_MENU = [
  {
    href: "/generate",
    icon: ImageIcon,
    label: "Image Generator",
    desc: "Generate images from text",
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    desc: "Your stats & gallery",
  },
  {
    href: "/recommendation",
    icon: Wand2,
    label: "Recommendations",
    desc: "AI product suggestions",
  },
];

interface NavbarProps {
  hideCenterNav?: boolean;
}

interface MobileNavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
}

function MobileNavLink({ href, icon, label }: MobileNavLinkProps): JSX.Element {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 py-2"
    >
      {icon}
      {label}
    </a>
  );
}

export default function Navbar({
  hideCenterNav = false,
}: NavbarProps): JSX.Element {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]/85 backdrop-blur-xl border-b border-[var(--border)]" />

      {/* Main bar */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 group-hover:shadow-[var(--accent)]/45 transition-shadow duration-200">
            <Sparkles size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            Design<span className="text-[var(--accent)]">AI</span>
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* ── BELUM LOGIN ── */}
          {!isLoading && !session && (
            <>
              <button
                onClick={() => signIn("google")}
                className="hidden md:block text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 font-medium"
              >
                Sign in
              </button>
              <button
                onClick={() => signIn("google")}
                className="hidden md:block btn-shimmer text-sm font-semibold text-white px-4 py-2 rounded-lg"
              >
                Get Started
              </button>
            </>
          )}

          {/* ── SKELETON LOADING ── */}
          {isLoading && (
            <div className="hidden md:flex items-center gap-3">
              <div className="w-16 h-4 rounded-md bg-[var(--border)] animate-pulse" />
              <div className="w-24 h-8 rounded-lg bg-[var(--border)] animate-pulse" />
            </div>
          )}

          {/* ── SUDAH LOGIN: Avatar + Dropdown ── */}
          {!isLoading && session && (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 bg-[var(--bg-card)] hover:bg-[var(--accent)]/5 transition-all duration-200"
              >
                {/* Avatar */}
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="w-6 h-6 rounded-full ring-1 ring-[var(--accent)]/30"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
                    <User size={12} className="text-[var(--accent)]" />
                  </div>
                )}
                <span className="text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                  {session.user?.name?.split(" ")[0] ?? "User"}
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className={`text-[var(--text-muted)] transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 3.5l3 3 3-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* User dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute top-full right-0 mt-3 w-60 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden z-50"
                  style={{
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.08)",
                  }}
                >
                  {/* Profile info */}
                  <div className="px-4 py-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name ?? "User"}
                          className="w-10 h-10 rounded-full ring-2 ring-[var(--accent)]/25"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/20 flex items-center justify-center">
                          <User size={16} className="text-[var(--accent)]" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {session.user?.name ?? "User"}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate">
                          {session.user?.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={() => {
                      signOut();
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/8 transition-colors duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                      <LogOut size={13} className="text-red-400" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-red-400 transition-colors">
                      Sign out
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Hamburger (nav menu) — always visible ── */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className={`
                flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200
                ${
                  menuOpen
                    ? "bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]"
                    : "bg-white/5 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/30 hover:text-[var(--text-primary)]"
                }
              `}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span
                  className={`absolute transition-all duration-200 ${menuOpen ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}
                >
                  <X size={16} />
                </span>
                <span
                  className={`absolute transition-all duration-200 ${menuOpen ? "opacity-0 -rotate-90" : "opacity-100 rotate-0"}`}
                >
                  <Menu size={16} />
                </span>
              </div>
            </button>

            {/* Navigation dropdown */}
            {menuOpen && (
              <div
                className="absolute top-full right-0 mt-3 w-64 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden z-50"
                style={{
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.08)",
                }}
              >
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                    Navigate
                  </span>
                </div>

                {NAV_MENU.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--accent)]/8 transition-colors duration-150 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/15 flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors">
                      <item.icon size={14} className="text-[var(--accent)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {item.desc}
                      </span>
                    </div>
                  </a>
                ))}

                {/* Mobile only: auth buttons */}
                <div className="md:hidden border-t border-[var(--border)] px-4 py-4 flex flex-col gap-3">
                  {session ? (
                    <>
                      <div className="flex items-center gap-2.5 py-1">
                        {session.user?.image ? (
                          <img
                            src={session.user.image}
                            alt=""
                            className="w-7 h-7 rounded-full"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 flex items-center justify-center">
                            <User size={13} className="text-[var(--accent)]" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {session.user?.name?.split(" ")[0]}
                        </span>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors py-1"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => signIn("google")}
                        className="text-sm text-[var(--text-muted)] text-left font-medium hover:text-[var(--text-primary)] transition-colors py-1"
                      >
                        Sign in with Google
                      </button>
                      <button
                        onClick={() => signIn("google")}
                        className="btn-shimmer text-sm font-semibold text-white px-4 py-2.5 rounded-lg text-center"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}