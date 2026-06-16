"use client";

import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Code2,
  ExternalLink,
  Send,
  MapPin,
  Clock,
  HelpCircle,
  Bug,
  Handshake,
  Lightbulb,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const CONTACT_CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "ramydiaman@gmail.com",
    href: "mailto:ramydiaman@gmail.com",
    desc: "Best for detailed inquiries. We typically respond within 1–2 business days.",
    color: "#7c6dfa",
  },
  {
    icon: Code2,
    label: "GitHub",
    value: "github.com/Afrizal236",
    href: "https://github.com/Afrizal236",
    desc: "For bug reports, feature requests, and code contributions.",
    color: "#2dd4bf",
  },
];

const INQUIRY_TYPES = [
  {
    icon: Bug,
    title: "Bug Report",
    desc: "Found something broken? Let us know with steps to reproduce and we'll fix it ASAP.",
    color: "#f472b6",
    action: "Report on GitHub",
    href: "https://github.com/Afrizal236/DesignAI/issues",
  },
  {
    icon: Lightbulb,
    title: "Feature Request",
    desc: "Have an idea for a new AI feature or improvement? We'd love to hear it.",
    color: "#7c6dfa",
    action: "Open an Issue",
    href: "https://github.com/Afrizal236/DesignAI/issues",
  },
  {
    icon: Handshake,
    title: "Collaboration",
    desc: "Interested in partnering, contributing, or building something together?",
    color: "#2dd4bf",
    action: "Send an Email",
    href: "mailto:ramydiaman@gmail.com",
  },
  {
    icon: HelpCircle,
    title: "General Support",
    desc: "Questions about how to use DesignAI's features or AI tools?",
    color: "#fb923c",
    action: "Email Us",
    href: "mailto:ramydiaman@gmail.com",
  },
];

const FAQS = [
  {
    q: "Is DesignAI free to use?",
    a: "DesignAI is currently available as a demonstration platform. Some features may require an account or have usage limits.",
  },
  {
    q: "How do I report a bug?",
    a: "You can open an issue on our GitHub repository with a description of the bug and steps to reproduce it. We monitor issues actively.",
  },
  {
    q: "Can I contribute to DesignAI?",
    a: "Yes! DesignAI is built as an open academic project. Reach out via email or GitHub if you're interested in contributing code, designs, or research.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Send an email to ramydiaman@gmail.com with the subject 'Account Deletion Request'. We process all deletion requests within 30 days.",
  },
  {
    q: "What AI models does DesignAI use?",
    a: "DesignAI uses a combination of Hugging Face Diffusers for image generation, OpenAI CLIP for semantic search, Sentence Transformers for embeddings, and custom LSTM models for analytics.",
  },
];

type FormStatus = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate a send (replace with real API call)
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 md:px-8 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--accent-secondary)]/4 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <MessageSquare size={13} className="text-[var(--accent)]" />
            Contact Us
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight mb-6 leading-tight">
            We&apos;d Love to{" "}
            <span className="text-[var(--accent)] glow-text">Hear From You</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you have a question, a bug to report, or just want to say hi
            — our team is happy to help. Choose the best channel for your inquiry
            below.
          </p>

          {/* Response time badge */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
            <Clock size={14} className="text-[var(--accent)]" />
            <span>
              Typical response time:{" "}
              <span className="text-[var(--text-primary)] font-semibold">
                1–2 business days
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="pb-32 px-6 md:px-8">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* ── Contact Channels ── */}
          <div>
            <SectionTitle icon={Mail} title="Contact Channels" accent="#7c6dfa" />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CONTACT_CHANNELS.map((ch) => (
                <a
                  key={ch.label}
                  href={ch.href}
                  target={ch.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all duration-200"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: `${ch.color}18`,
                      border: `1px solid ${ch.color}35`,
                    }}
                  >
                    <span style={{ color: ch.color, display: "flex" }}>
                      <ch.icon size={18} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-extrabold text-[var(--text-dim)] uppercase tracking-widest">
                        {ch.label}
                      </p>
                      <ChevronRight
                        size={13}
                        className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition-colors shrink-0"
                      />
                    </div>
                    <p
                      className="text-sm font-semibold mb-1.5 group-hover:text-[var(--accent)] transition-colors truncate"
                      style={{ color: ch.color }}
                    >
                      {ch.value}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {ch.desc}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* ── Inquiry Types ── */}
          <div>
            <SectionTitle icon={HelpCircle} title="What Are You Reaching Out About?" accent="#2dd4bf" />
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INQUIRY_TYPES.map((t) => (
                <div
                  key={t.title}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] flex flex-col gap-3"
                  style={{ borderLeft: `3px solid ${t.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: t.color, display: "flex" }}>
                      <t.icon size={16} />
                    </span>
                    <p className="text-sm font-bold" style={{ color: t.color }}>
                      {t.title}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">
                    {t.desc}
                  </p>
                  <a
                    href={t.href}
                    target={t.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: t.color }}
                  >
                    {t.action}
                    <ChevronRight size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* ── Two-column: Form + Info ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <SectionTitle icon={Send} title="Send Us a Message" accent="#fb923c" />
              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
                <div
                  className="px-7 py-5 border-b border-[var(--border)]"
                  style={{
                    background: "linear-gradient(135deg, #fb923c0d 0%, transparent 60%)",
                  }}
                >
                  <p className="text-sm text-[var(--text-muted)]">
                    Fill in the form below and we&apos;ll get back to you as soon as possible.
                  </p>
                </div>

                {status === "sent" ? (
                  <div className="px-7 py-12 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                      <CheckCircle size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[var(--text-primary)] mb-1">
                        Message Sent!
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Thank you for reaching out. We&apos;ll reply to your email within
                        1–2 business days.
                      </p>
                    </div>
                    <button
                      onClick={() => setStatus("idle")}
                      className="mt-2 text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="px-7 py-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="your@email.com"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="What's this about?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Tell us more..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/25 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-shimmer w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                      style={{ background: "var(--accent)" }}
                    >
                      {status === "sending" ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[var(--text-dim)] text-center">
                      By submitting this form, you agree to our{" "}
                      <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Right: Info panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location / Institution */}
              <div>
                <SectionTitle icon={MapPin} title="Where We Are" accent="#a78bfa" />
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Institution", value: "Universitas Negeri Surabaya (UNESA)" },
                    { label: "Partner", value: "Celerates" },
                    { label: "Location", value: "Surabaya, East Java, Indonesia" },
                    { label: "Timezone", value: "WIB (UTC+7)" },
                  ].map((info) => (
                    <div
                      key={info.label}
                      className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]"
                    >
                      <span className="text-xs text-[var(--text-dim)] font-semibold uppercase tracking-wider shrink-0">
                        {info.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] text-right">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Also see */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex items-start gap-3">
                <Sparkles size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Want to know more about who we are and what we build? Visit our{" "}
                  <Link href="/about" className="text-[var(--accent)] hover:underline font-medium">
                    About page
                  </Link>
                  .
                </p>
              </div>

              {/* Legal note */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] flex items-start gap-3">
                <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  For privacy-related requests (data access, deletion, rectification),
                  please email us directly at{" "}
                  <a
                    href="mailto:ramydiaman@gmail.com"
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    ramydiaman@gmail.com
                  </a>{" "}
                  with the subject{" "}
                  <span className="text-[var(--text-primary)] font-semibold">
                    &quot;Privacy Request&quot;
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* ── FAQ ── */}
          <div>
            <SectionTitle icon={HelpCircle} title="Frequently Asked Questions" accent="#f472b6" />
            <div className="mt-6 space-y-3">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}

// ── SectionTitle ──────────────────────────────────────────────
function SectionTitle({
  icon: Icon,
  title,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}
      >
        <span style={{ color: accent, display: "flex" }}>
          <Icon size={15} />
        </span>
      </div>
      <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
    </div>
  );
}

// ── FAQItem ───────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">{q}</span>
        <ChevronRight
          size={15}
          className={`shrink-0 text-[var(--text-dim)] transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-4">
          {a}
        </div>
      )}
    </div>
  );
}
