"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Target,
  Eye,
  Cpu,
  Users,
  Zap,
  Globe,
  Shield,
  BookOpen,
  Star,
  ChevronRight,
  Mail,
  AlertCircle,
  Heart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const TOC = [
  { id: "who-we-are", label: "Who We Are" },
  { id: "mission", label: "Our Mission & Vision" },
  { id: "story", label: "Our Story" },
  { id: "what-we-offer", label: "What We Offer" },
  { id: "tech", label: "Technology Stack" },
  { id: "team", label: "Our Team" },
  { id: "values", label: "Core Values" },
  { id: "contact-cta", label: "Get in Touch" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Image Generation",
    desc: "Generate stunning design assets from natural language prompts using state-of-the-art diffusion models.",
    color: "#7c6dfa",
  },
  {
    icon: Target,
    title: "Smart Recommendations",
    desc: "Personalized design inspiration powered by collaborative filtering and user behavior analysis.",
    color: "#2dd4bf",
  },
  {
    icon: Eye,
    title: "Semantic Search",
    desc: "Find visually similar content using CLIP embeddings and vector similarity search.",
    color: "#fb923c",
  },
  {
    icon: Cpu,
    title: "Deep Learning Analytics",
    desc: "LSTM-based rating predictors and trend forecasting for data-driven creative decisions.",
    color: "#a78bfa",
  },
  {
    icon: Zap,
    title: "Smart Prompt Tools",
    desc: "Fuzzy credit matching, prompt evolution, and AI-assisted prompt engineering utilities.",
    color: "#f472b6",
  },
  {
    icon: BookOpen,
    title: "Business Intelligence",
    desc: "Apriori association mining and advanced analytics dashboard for platform insights.",
    color: "#34d399",
  },
];

const TECH_STACK = [
  { category: "Frontend", items: ["Next.js 14", "TypeScript", "Tailwind CSS", "Lucide React"] },
  { category: "Backend", items: ["FastAPI (Python)", "PostgreSQL", "SQLAlchemy", "Uvicorn"] },
  { category: "AI / ML", items: ["Hugging Face Diffusers", "OpenAI CLIP", "LSTM (TensorFlow)", "Sentence Transformers"] },
  { category: "Infrastructure", items: ["Vercel (Frontend)", "Docker", "pgvector (Vector DB)", "REST API"] },
];

const TEAM = [
  {
    name: "Ramy Diaman",
    role: "Lead Developer & AI Engineer",
    avatar: "RD",
    color: "#7c6dfa",
    desc: "Full-stack engineer specializing in AI-powered web applications, machine learning pipelines, and creative technology.",
  },
  {
    name: "UNESA × Celerates",
    role: "Academic Partnership",
    avatar: "UC",
    color: "#2dd4bf",
    desc: "DesignAI was developed as part of an academic collaboration between Universitas Negeri Surabaya and Celerates.",
  },
];

const VALUES = [
  { icon: Sparkles, title: "Innovation First", desc: "We push the boundaries of what AI can do for creative professionals.", color: "#7c6dfa" },
  { icon: Shield, title: "Privacy by Design", desc: "User data protection is built into every feature from day one.", color: "#2dd4bf" },
  { icon: Globe, title: "Accessibility", desc: "Powerful AI tools should be available to creators everywhere, at every skill level.", color: "#fb923c" },
  { icon: Heart, title: "Community Driven", desc: "We listen to our users and build features that solve real creative problems.", color: "#f472b6" },
];

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    TOC.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 md:px-8 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--accent-secondary)]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <Sparkles size={13} className="text-[var(--accent)]" />
            About DesignAI
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight mb-6 leading-tight">
            The Platform Behind{" "}
            <span className="text-[var(--accent)] glow-text">Creative AI</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            DesignAI is an AI-powered creative platform that helps designers,
            developers, and creators build better, faster — with the power of
            machine learning at their fingertips.
          </p>

          {/* Stats row */}
          <div className="inline-flex flex-wrap justify-center gap-4">
            {[
              { label: "AI Features", value: "10+" },
              { label: "ML Models", value: "5" },
              { label: "Built With", value: "Next.js + FastAPI" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-sm"
              >
                <span className="text-[var(--accent)] font-extrabold text-base">
                  {stat.value}
                </span>
                <span className="text-[var(--text-muted)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="pb-32 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-12 lg:gap-16">

            {/* ── Sidebar TOC ── */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-28">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen size={12} className="text-[var(--accent)]" />
                    On This Page
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {TOC.map((item, i) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollTo(item.id)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group ${
                            activeSection === item.id
                              ? "bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/25"
                              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                          }`}
                        >
                          <span
                            className={`shrink-0 w-5 h-5 rounded-lg text-[9px] font-extrabold flex items-center justify-center transition-colors duration-200 ${
                              activeSection === item.id
                                ? "bg-[var(--accent)] text-white"
                                : "bg-[var(--bg-primary)] text-[var(--text-dim)] group-hover:bg-[var(--accent)]/10 group-hover:text-[var(--accent)]"
                            }`}
                          >
                            {i + 1}
                          </span>
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* ── Article ── */}
            <article className="flex-1 min-w-0 space-y-12">

              {/* 1. Who We Are */}
              <Section id="who-we-are" icon={Sparkles} title="Who We Are" accent="#7c6dfa">
                <p>
                  <strong className="text-[var(--text-primary)]">DesignAI</strong> is an
                  AI-powered creative platform built for the next generation of designers,
                  developers, and digital creators. We combine cutting-edge machine learning
                  with an intuitive interface to give you superpowers in the creative process.
                </p>
                <p className="mt-4">
                  Whether you&apos;re generating images from a text prompt, discovering
                  design inspiration through semantic search, or analyzing trends with
                  deep learning — DesignAI brings every AI tool you need into one unified
                  platform.
                </p>
                <p className="mt-4">
                  We were developed as an academic and industry project at the intersection
                  of artificial intelligence, user experience, and creative technology — in
                  partnership with{" "}
                  <span className="text-[var(--accent)] font-medium">
                    Universitas Negeri Surabaya (UNESA)
                  </span>{" "}
                  and{" "}
                  <span className="text-[var(--accent)] font-medium">Celerates</span>.
                </p>
                <InfoBox type="info">
                  DesignAI is currently in active development. New AI features and
                  improvements are released regularly. We appreciate your feedback!
                </InfoBox>
              </Section>

              {/* 2. Mission & Vision */}
              <Section id="mission" icon={Target} title="Our Mission & Vision" accent="#2dd4bf">
                <div className="space-y-5">
                  <div
                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                    style={{ borderLeft: "3px solid #2dd4bf" }}
                  >
                    <p className="text-sm font-bold text-[#2dd4bf] mb-2 uppercase tracking-wide">
                      Mission
                    </p>
                    <p className="text-[var(--text-muted)] leading-relaxed">
                      To democratize AI-powered creativity by making advanced machine
                      learning tools accessible, understandable, and genuinely useful for
                      every creator — regardless of technical background.
                    </p>
                  </div>
                  <div
                    className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                    style={{ borderLeft: "3px solid #7c6dfa" }}
                  >
                    <p className="text-sm font-bold text-[#7c6dfa] mb-2 uppercase tracking-wide">
                      Vision
                    </p>
                    <p className="text-[var(--text-muted)] leading-relaxed">
                      A world where the gap between creative vision and execution is
                      bridged by intelligent systems — where anyone can bring their
                      ideas to life with the assistance of AI.
                    </p>
                  </div>
                </div>
              </Section>

              {/* 3. Our Story */}
              <Section id="story" icon={BookOpen} title="Our Story" accent="#fb923c">
                <p>
                  DesignAI began as a final project exploring how multiple AI disciplines —
                  computer vision, natural language processing, recommendation systems, and
                  deep learning — could be unified into a single creative tool.
                </p>
                <p className="mt-4">
                  What started as an academic exploration quickly grew into something more
                  ambitious: a fully-featured platform with a real backend, production-grade
                  AI pipelines, and a polished user interface designed to feel as natural
                  as any professional tool.
                </p>
                <p className="mt-4">
                  Today, DesignAI is a demonstration of what&apos;s possible when rigorous
                  engineering meets creative ambition — built with{" "}
                  <strong className="text-[var(--text-primary)]">Next.js 14</strong>,{" "}
                  <strong className="text-[var(--text-primary)]">FastAPI</strong>, and a
                  suite of open-source machine learning frameworks.
                </p>
                <InfoBox type="info">
                  DesignAI is open to collaboration. If you&apos;re a researcher,
                  developer, or designer interested in contributing, we&apos;d love to
                  hear from you.
                </InfoBox>
              </Section>

              {/* 4. What We Offer */}
              <Section id="what-we-offer" icon={Star} title="What We Offer" accent="#a78bfa">
                <p>
                  DesignAI bundles multiple AI-powered tools into a single cohesive
                  platform. Here&apos;s what you get:
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FEATURES.map((f) => (
                    <div
                      key={f.title}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                      style={{ borderLeft: `3px solid ${f.color}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: f.color, display: "flex" }}>
                          <f.icon size={15} />
                        </span>
                        <p className="text-sm font-bold" style={{ color: f.color }}>
                          {f.title}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 5. Technology Stack */}
              <Section id="tech" icon={Cpu} title="Technology Stack" accent="#2dd4bf">
                <p>
                  DesignAI is built on a modern, scalable technology stack combining
                  best-in-class tools for both frontend experience and AI/ML performance:
                </p>
                <div className="mt-5 space-y-4">
                  {TECH_STACK.map((stack) => (
                    <div
                      key={stack.category}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {stack.category}
                        </h4>
                      </div>
                      <div className="px-5 py-4 flex flex-wrap gap-2">
                        {stack.items.map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs font-medium text-[var(--text-muted)]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 6. Team */}
              <Section id="team" icon={Users} title="Our Team" accent="#f472b6">
                <p>
                  DesignAI is crafted by a small but dedicated team passionate about AI,
                  design, and the intersection of technology and creativity.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {TEAM.map((member) => (
                    <div
                      key={member.name}
                      className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                          style={{ background: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">
                            {member.name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {member.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 7. Core Values */}
              <Section id="values" icon={Heart} title="Core Values" accent="#7c6dfa">
                <p>
                  Everything we build at DesignAI is guided by a clear set of principles:
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VALUES.map((v) => (
                    <div
                      key={v.title}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: v.color, display: "flex" }}>
                          <v.icon size={15} />
                        </span>
                        <p className="text-sm font-bold" style={{ color: v.color }}>
                          {v.title}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {v.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 8. Get in Touch CTA */}
              <Section id="contact-cta" icon={Mail} title="Get in Touch" accent="#2dd4bf">
                <p>
                  Have questions about DesignAI, interested in collaborating, or want to
                  report a bug? We&apos;d love to hear from you. Our team is responsive
                  and genuinely cares about the community.
                </p>

                <div className="mt-6 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      Ready to reach out?
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Visit our dedicated Contact page to send us a message, find our
                      social media, or get support.
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="btn-shimmer shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Contact Us
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="mt-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3">
                  <AlertCircle size={15} className="text-[var(--accent)] shrink-0" />
                  <p className="text-sm text-[var(--text-muted)]">
                    For legal and privacy inquiries, please review our{" "}
                    <Link href="/privacy" className="text-[var(--accent)] hover:underline font-medium">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-[var(--accent)] hover:underline font-medium">
                      Terms of Service
                    </Link>
                    .
                  </p>
                </div>
              </Section>

            </article>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// ── Section Component ──────────────────────────────────────────
function Section({
  id,
  icon: Icon,
  title,
  accent,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-28 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
    >
      <div
        className="px-8 py-5 border-b border-[var(--border)] flex items-center gap-3"
        style={{
          background: `linear-gradient(135deg, ${accent}0d 0%, transparent 60%)`,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${accent}18`,
            border: `1px solid ${accent}35`,
          }}
        >
          <span style={{ color: accent, display: "flex" }}>
            <Icon size={16} />
          </span>
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="px-8 py-7 text-sm text-[var(--text-muted)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// ── InfoBox Component ──────────────────────────────────────────
function InfoBox({
  type,
  children,
}: {
  type: "info" | "warning";
  children: React.ReactNode;
}) {
  const isInfo = type === "info";
  return (
    <div
      className={`mt-5 flex items-start gap-3 p-4 rounded-xl border text-sm leading-relaxed ${
        isInfo
          ? "bg-[var(--accent)]/8 border-[var(--accent)]/25 text-[var(--text-muted)]"
          : "bg-amber-500/8 border-amber-500/25 text-[var(--text-muted)]"
      }`}
    >
      <AlertCircle
        size={15}
        className={`shrink-0 mt-0.5 ${isInfo ? "text-[var(--accent)]" : "text-amber-400"}`}
      />
      <span>{children}</span>
    </div>
  );
}
