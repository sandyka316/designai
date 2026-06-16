"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  FileText,
  Users,
  Lock,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  RefreshCw,
  Scale,
  Mail,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const LAST_UPDATED = "June 15, 2026";

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "services", label: "Description of Services" },
  { id: "account", label: "User Accounts" },
  { id: "ip", label: "Intellectual Property" },
  { id: "usage", label: "Permitted & Prohibited Use" },
  { id: "privacy", label: "Privacy & Data" },
  { id: "payment", label: "Payment & Subscriptions" },
  { id: "disclaimer", label: "Disclaimers & Liability" },
  { id: "changes", label: "Changes to Terms" },
  { id: "law", label: "Governing Law" },
  { id: "contact", label: "Contact Us" },
];

const ALLOWED = [
  "Use the service for personal or commercial purposes in accordance with your subscription plan",
  "Download and use generated images and designs for your own projects",
  "Provide feedback and report bugs to help improve the platform",
  "Share generated designs publicly with attribution to DesignAI",
];

const PROHIBITED = [
  "Use the service to create illegal, harmful, or rights-infringing content",
  "Reverse engineer, decompile, or duplicate any part of the DesignAI system",
  "Use bots, scrapers, or automation tools without explicit written permission",
  "Sell, rent, or redistribute access to the service to third parties",
  "Create content containing hate speech, pornography, or graphic violence",
  "Conduct cyberattacks, DDoS attacks, or any activity that harms service infrastructure",
];

export default function TermsPage() {
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
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-6 md:px-8 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[var(--accent-secondary)]/4 rounded-full blur-[120px] pointer-events-none" />

        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <Shield size={13} className="text-[var(--accent)]" />
            Legal &amp; Compliance
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight mb-6 leading-tight">
            Terms of{" "}
            <span className="text-[var(--accent)] glow-text">Service</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Please read these Terms of Service carefully before using the DesignAI
            platform. By accessing our service, you agree to be bound by all the
            terms and conditions set forth below.
          </p>

          {/* Meta info */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
            <RefreshCw size={14} className="text-[var(--accent)]" />
            <span>
              Last updated:{" "}
              <span className="text-[var(--text-primary)] font-semibold">
                {LAST_UPDATED}
              </span>
            </span>
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
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-transparent" />

                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={12} className="text-[var(--accent)]" />
                    Table of Contents
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

              {/* 1. Acceptance */}
              <Section
                id="acceptance"
                icon={CheckCircle}
                title="1. Acceptance of Terms"
                accent="#7c6dfa"
              >
                <p>
                  By accessing, registering for, or using the DesignAI platform
                  ("Service"), you acknowledge that you have read, understood, and
                  agree to be bound by these Terms of Service ("Terms") and our{" "}
                  <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                <p className="mt-4">
                  If you do not agree to these Terms, you are not permitted to use
                  our Service. These Terms apply to all users, including visitors,
                  registered users, and paying subscribers.
                </p>
                <InfoBox type="info">
                  Users must be at least <strong>17 years old</strong> to register
                  and use DesignAI. Users under this age must obtain consent from a
                  parent or legal guardian.
                </InfoBox>
              </Section>

              {/* 2. Services */}
              <Section
                id="services"
                icon={FileText}
                title="2. Description of Services"
                accent="#2dd4bf"
              >
                <p>
                  DesignAI is an AI-powered design platform that provides the
                  following features:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Image Generator — Create high-quality product visuals from text descriptions using Stable Diffusion and GAN models",
                    "AI Recommendations — A design recommendation system based on user preferences and history",
                    "Smart Prompt — Tools to optimize and evolve design prompts",
                    "Deep Learning Analysis — Aesthetic design analysis, rating prediction, and semantic search",
                    "Analytics & BI Report — In-depth analytics dashboard for business and design insights",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  We reserve the right to add, modify, or remove service features
                  at any time without prior notice, while considering the interests
                  of existing users.
                </p>
              </Section>

              {/* 3. Account */}
              <Section
                id="account"
                icon={Users}
                title="3. User Accounts"
                accent="#fb923c"
              >
                <p>
                  To access certain features, you need to create an account with
                  accurate and complete information. You are fully responsible for:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Maintaining the confidentiality of your password and account information",
                    "All activities that occur through your account",
                    "Immediately notifying us of any unauthorized access to your account",
                    "The accuracy of the information you provide during registration",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="warning">
                  We reserve the right to suspend or delete accounts that violate
                  these Terms, engage in fraudulent activity, or endanger other
                  users — without prior notice.
                </InfoBox>
              </Section>

              {/* 4. IP */}
              <Section
                id="ip"
                icon={Lock}
                title="4. Intellectual Property"
                accent="#a78bfa"
              >
                <p>
                  <strong className="text-[var(--text-primary)]">
                    Platform &amp; Technology:
                  </strong>{" "}
                  All source code, algorithms, AI models, interface designs,
                  trademarks, and content on the DesignAI platform are the
                  exclusive property of DesignAI and are protected by applicable
                  intellectual property laws.
                </p>
                <p className="mt-4">
                  <strong className="text-[var(--text-primary)]">
                    Generated Content:
                  </strong>{" "}
                  Images and designs generated using our service are granted to you
                  under a limited use license. You may use generated outputs for
                  commercial or non-commercial purposes, but you may not:
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Claim that you fully created the content without AI assistance",
                    "Sell or redistribute the content as AI training datasets",
                    "Register copyright over AI-generated content in jurisdictions that prohibit this",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 5. Usage */}
              <Section
                id="usage"
                icon={CheckCircle}
                title="5. Permitted & Prohibited Use"
                accent="#2dd4bf"
              >
                {/* Allowed */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle size={15} />
                    Permitted
                  </h4>
                  <ul className="space-y-2.5">
                    {ALLOWED.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle size={9} className="text-emerald-400" />
                        </div>
                        <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Prohibited */}
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <XCircle size={15} />
                    Prohibited
                  </h4>
                  <ul className="space-y-2.5">
                    {PROHIBITED.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle size={9} className="text-red-400" />
                        </div>
                        <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Section>

              {/* 6. Privacy */}
              <Section
                id="privacy"
                icon={Shield}
                title="6. Privacy & Data"
                accent="#7c6dfa"
              >
                <p>
                  Your privacy is important to us. The collection and use of your
                  personal data is governed by our{" "}
                  <Link href="/privacy" className="text-[var(--accent)] hover:underline">
                    Privacy Policy
                  </Link>
                  , which is an integral part of these Terms.
                </p>
                <p className="mt-4">
                  By using the Service, you consent to the collection of the
                  following data to improve your user experience:
                </p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Account and user profile data",
                    "Prompt history and generated images",
                    "Interaction data and design preferences for personalization",
                    "Technical data such as IP address and device type",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="info">
                  We do not sell your personal data to any third parties. Your data
                  is used solely to improve the quality of the DesignAI service.
                </InfoBox>
              </Section>

              {/* 7. Payment */}
              <Section
                id="payment"
                icon={CreditCard}
                title="7. Payment & Subscriptions"
                accent="#fb923c"
              >
                <p>
                  DesignAI offers both free (Free) and paid (Pro/Business)
                  subscription plans. For paid plans:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Payments are processed through a secure, encrypted payment gateway",
                    "Subscriptions automatically renew each billing cycle unless cancelled",
                    "Cancellations can be made at any time via your account settings",
                    "No refunds are issued for subscription periods already in progress, except in the case of service outages on our end",
                    "Prices may change with at least 30 days' prior notice",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 8. Disclaimer */}
              <Section
                id="disclaimer"
                icon={AlertCircle}
                title="8. Disclaimers & Limitation of Liability"
                accent="#f472b6"
              >
                <p>
                  The DesignAI service is provided on an{" "}
                  <strong className="text-[var(--text-primary)]">"as is"</strong>{" "}
                  basis without warranties of any kind, either express or implied.
                  We are not liable for:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Direct or indirect damages resulting from use of or inability to use the service",
                    "Loss of data, profits, or business reputation",
                    "AI-generated content that may be inaccurate or fail to meet expectations",
                    "Service interruptions due to maintenance, system updates, or events beyond our control",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="warning">
                  DesignAI&apos;s maximum liability to you shall not exceed the total
                  amount you have paid us in the last 3 months.
                </InfoBox>
              </Section>

              {/* 9. Changes */}
              <Section
                id="changes"
                icon={RefreshCw}
                title="9. Changes to Terms"
                accent="#2dd4bf"
              >
                <p>
                  We reserve the right to update or modify these Terms at any time.
                  If significant changes are made, we will:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Send a notification to your registered email address",
                    "Display a notification banner on the platform at least 14 days before changes take effect",
                    "Update the 'Last updated' date at the top of this page",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[var(--accent)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  Continued use of the Service after changes take effect constitutes
                  your acceptance of the updated Terms.
                </p>
              </Section>

              {/* 10. Law */}
              <Section
                id="law"
                icon={Scale}
                title="10. Governing Law"
                accent="#7c6dfa"
              >
                <p>
                  These Terms and Conditions are governed by and construed in
                  accordance with the laws of the Republic of Indonesia. Any
                  disputes arising in connection with these Terms shall first be
                  resolved amicably through negotiation.
                </p>
                <p className="mt-4">
                  If an amicable resolution is not reached within 30 (thirty) days,
                  the dispute shall be brought before the competent court in
                  Surabaya, East Java, Indonesia — as the agreed jurisdiction of
                  both parties.
                </p>
                <p className="mt-4">
                  DesignAI is a platform developed by{" "}
                  <strong className="text-[var(--text-primary)]">
                    Universitas Negeri Surabaya (UNESA)
                  </strong>{" "}
                  in collaboration with{" "}
                  <strong className="text-[var(--text-primary)]">Celerates</strong>.
                </p>
              </Section>

              {/* 11. Contact */}
              <Section
                id="contact"
                icon={Mail}
                title="11. Contact Us"
                accent="#a78bfa"
              >
                <p>
                  If you have any questions about these Terms of Service, please
                  reach out to us:
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Email",
                      value: "ramydiaman@gmail.com",
                      href: "mailto:ramydiaman@gmail.com",
                    },
                    {
                      label: "Institution",
                      value: "UNESA × Celerates",
                      href: "#",
                    },
                  ].map((contact) => (
                    <a
                      key={contact.label}
                      href={contact.href}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/5 transition-all duration-200"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                        <Mail size={15} className="text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--text-dim)] uppercase tracking-widest">
                          {contact.label}
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {contact.value}
                        </p>
                      </div>
                    </a>
                  ))}
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
      {/* Header */}
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

      {/* Body */}
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
