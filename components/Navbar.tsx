"use client";

import { useState } from "react";
import type { ReactNode, JSX } from "react";
import { ImageIcon, Menu, X, Sparkles } from "lucide-react";

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

export default function Navbar({ hideCenterNav = false }: NavbarProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

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

        {/* Center nav — disembunyikan jika hideCenterNav true */}
        {!hideCenterNav && (
          <div className="hidden md:flex items-center gap-1 ml-auto mr-10">
            <NavLink
              href="/generate"
              icon={<ImageIcon size={14} />}
              label="Image Generator"
              active={true}
            />
          </div>
        )}

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
          {!hideCenterNav && (
            <MobileNavLink
              href="/generate"
              icon={<ImageIcon size={14} />}
              label="Image Generator"
            />
          )}
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