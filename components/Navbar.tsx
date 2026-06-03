"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactNode, JSX } from "react";
import {
  ImageIcon,
  Menu,
  X,
  Sparkles,
  LayoutDashboard,
  Wand2,
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

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}

interface MobileNavLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
}

interface NavbarProps {
  hideCenterNav?: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps): JSX.Element {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </a>
  );
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
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[var(--bg-primary)]/85 backdrop-blur-xl border-b border-[var(--border)]" />

      {/* Main bar */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
        {/* Logo — klik buka dropdown */}
        {/* Logo — klik buka dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 group-hover:shadow-[var(--accent)]/45 transition-shadow duration-200">
              <Sparkles size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
              Design<span className="text-[var(--accent)]">AI</span>
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`text-[var(--text-muted)] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              className="absolute top-full left-0 mt-3 w-60 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden z-50"
              style={{
                boxShadow:
                  "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.08)",
              }}
            >
              {/* Menu header */}
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
            </div>
          )}
        </div>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 font-medium">
            Sign in
          </button>
          <button className="btn-shimmer text-sm font-semibold text-white px-4 py-2 rounded-lg">
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200 p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden relative bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-5 space-y-1">
          {NAV_MENU.map((item) => (
            <MobileNavLink
              key={item.href}
              href={item.href}
              icon={<item.icon size={14} />}
              label={item.label}
            />
          ))}
          <div className="pt-4 mt-3 border-t border-[var(--border)] flex flex-col gap-3">
            <button className="text-sm text-[var(--text-muted)] text-left font-medium hover:text-[var(--text-primary)] transition-colors py-1">
              Sign in
            </button>
            <button className="btn-shimmer text-sm font-semibold text-white px-4 py-2.5 rounded-lg text-center">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
