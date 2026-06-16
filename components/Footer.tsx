"use client";

import {
  Sparkles,
  Globe,
  MessageCircle,
  Camera,
  Mail,
  ExternalLink,
  Zap,
  Shield,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  {
    label: "Product",
    links: [
      { name: "Image Generator", href: "/generate" },
      { name: "Recommendations", href: "/recommendation" },
      { name: "Analytics", href: "/analytics" },
      { name: "Smart Prompt", href: "/smart-prompt" },
    ],
  },
  {
    label: "Explore",
    links: [
      { name: "Deep Learning", href: "/deep-learning" },
      { name: "Semantic Search", href: "/semantic-search" },
      { name: "Dashboard", href: "/dashboard" },
      { name: "BI Report", href: "/admin/bi" },
    ],
  },
  {
    label: "Company",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Contact Us", href: "/contact" },
      { name: "About", href: "/about" },
    ],
  },
];

const SOCIALS = [
  { icon: Globe, href: "#", label: "GitHub" },
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Camera, href: "#", label: "Instagram" },
  { icon: Mail, href: "#", label: "Email" },
];

const BADGES = [
  { icon: Zap, label: "Powered by AI" },
  { icon: Shield, label: "Secure & Private" },
  { icon: BookOpen, label: "UNESA × Celerates" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] bg-[var(--bg-card)] mt-auto overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />

      {/* Background subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent)]/3 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-8">

        {/* ── Main Footer Content ── */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Design<span className="text-[var(--accent)]">AI</span>
              </span>
            </div>

            {/* Tagline */}
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
              AI-powered design platform for creators, UMKM owners, and innovators.
              Generate stunning visuals with just a prompt.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide"
                >
                  <badge.icon size={10} className="text-[var(--accent)]" />
                  {badge.label}
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 mt-1">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/8 transition-all duration-200"
                >
                  <social.icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Columns */}
          {NAV_LINKS.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">
              <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-widest">
                {group.label}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-200 flex items-center gap-1.5 group"
                    >
                      {link.name}
                      <ExternalLink
                        size={10}
                        className="opacity-0 group-hover:opacity-60 transition-opacity duration-200 shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        {/* ── Bottom Bar ── */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-dim)] font-medium">
            © 2026{" "}
            <span className="text-[var(--text-muted)] font-semibold">DesignAI</span>{" "}
            — Universitas Negeri Surabaya × Celerates. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              All systems operational
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
