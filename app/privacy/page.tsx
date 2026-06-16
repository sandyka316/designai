"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  FileText,
  Eye,
  Database,
  Share2,
  Cookie,
  Lock,
  Clock,
  UserCheck,
  Baby,
  RefreshCw,
  Mail,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const LAST_UPDATED = "June 15, 2026";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "data-collected", label: "Information We Collect" },
  { id: "data-use", label: "How We Use Your Data" },
  { id: "data-sharing", label: "Data Sharing & Disclosure" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "security", label: "Data Security" },
  { id: "retention", label: "Data Retention" },
  { id: "rights", label: "Your Rights" },
  { id: "children", label: "Children's Privacy" },
  { id: "changes", label: "Changes to Policy" },
  { id: "contact", label: "Contact Us" },
];

const DATA_COLLECTED = [
  {
    category: "Account Information",
    items: [
      "Name, email address, and password (hashed)",
      "Profile picture and display preferences",
      "Subscription plan and billing information",
    ],
  },
  {
    category: "Usage Data",
    items: [
      "Prompts entered and images generated",
      "Feature interactions and navigation patterns",
      "Search queries and recommendation history",
      "Session duration and frequency of use",
    ],
  },
  {
    category: "Technical Data",
    items: [
      "IP address and approximate geolocation",
      "Browser type, version, and operating system",
      "Device identifiers and screen resolution",
      "Referral source and landing page",
    ],
  },
];

const DATA_USE_PURPOSES = [
  "Provide, operate, and maintain the DesignAI platform and all its features",
  "Personalize your experience through AI-powered recommendations",
  "Improve and develop new features based on usage analytics",
  "Process transactions and manage your subscription",
  "Send service-related emails such as account confirmations and security alerts",
  "Detect and prevent fraud, abuse, or violations of our Terms of Service",
  "Comply with applicable legal obligations",
];

const USER_RIGHTS = [
  {
    right: "Right to Access",
    description:
      "Request a copy of all personal data we hold about you in a portable format.",
  },
  {
    right: "Right to Rectification",
    description:
      "Ask us to correct inaccurate or incomplete personal information.",
  },
  {
    right: "Right to Erasure",
    description:
      'Request deletion of your personal data ("right to be forgotten") subject to legal retention requirements.',
  },
  {
    right: "Right to Restrict Processing",
    description:
      "Ask us to limit how we use your data in certain circumstances.",
  },
  {
    right: "Right to Object",
    description:
      "Opt out of specific processing activities such as marketing communications.",
  },
  {
    right: "Right to Data Portability",
    description:
      "Receive your data in a structured, machine-readable format for transfer to another service.",
  },
];

export default function PrivacyPage() {
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
            Privacy &amp; Data Protection
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-[var(--text-primary)] tracking-tight mb-6 leading-tight">
            Privacy{" "}
            <span className="text-[var(--accent)] glow-text">Policy</span>
          </h1>

          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Your privacy matters to us. This Privacy Policy explains how
            DesignAI collects, uses, and protects your personal information when
            you use our platform and services.
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

              {/* 1. Introduction */}
              <Section
                id="introduction"
                icon={Shield}
                title="1. Introduction"
                accent="#7c6dfa"
              >
                <p>
                  DesignAI ("we", "us", or "our") is committed to protecting
                  your personal information and your right to privacy. This
                  Privacy Policy applies to all information collected through
                  our platform at{" "}
                  <span className="text-[var(--accent)] font-medium">
                    designai.app
                  </span>{" "}
                  and any related services, features, or content.
                </p>
                <p className="mt-4">
                  By using DesignAI, you agree to the collection and use of
                  information as described in this policy. If you disagree with
                  any part of this Privacy Policy, please discontinue your use
                  of the platform.
                </p>
                <p className="mt-4">
                  This policy should be read in conjunction with our{" "}
                  <Link
                    href="/terms"
                    className="text-[var(--accent)] hover:underline"
                  >
                    Terms of Service
                  </Link>
                  , which together govern your relationship with DesignAI.
                </p>
                <InfoBox type="info">
                  This Privacy Policy was developed in compliance with
                  applicable data protection laws in Indonesia and follows
                  internationally recognized privacy best practices.
                </InfoBox>
              </Section>

              {/* 2. Information We Collect */}
              <Section
                id="data-collected"
                icon={Database}
                title="2. Information We Collect"
                accent="#2dd4bf"
              >
                <p>
                  We collect different types of information depending on how you
                  interact with our platform. The main categories are:
                </p>
                <div className="mt-5 space-y-5">
                  {DATA_COLLECTED.map((group) => (
                    <div
                      key={group.category}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden"
                    >
                      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
                        <h4 className="text-sm font-bold text-[var(--text-primary)]">
                          {group.category}
                        </h4>
                      </div>
                      <ul className="px-5 py-4 space-y-2">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <ChevronRight
                              size={14}
                              className="text-[#2dd4bf] shrink-0 mt-0.5"
                            />
                            <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-4">
                  We may also collect information you choose to provide
                  voluntarily, such as feedback, survey responses, or support
                  requests.
                </p>
              </Section>

              {/* 3. How We Use Your Data */}
              <Section
                id="data-use"
                icon={Eye}
                title="3. How We Use Your Information"
                accent="#fb923c"
              >
                <p>
                  We use the information we collect for the following purposes:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {DATA_USE_PURPOSES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[#fb923c] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="info">
                  We rely on legitimate interests, contractual necessity, and
                  your consent as lawful bases for processing your personal
                  data. You may withdraw consent at any time where consent is
                  the basis for processing.
                </InfoBox>
              </Section>

              {/* 4. Data Sharing */}
              <Section
                id="data-sharing"
                icon={Share2}
                title="4. Data Sharing & Disclosure"
                accent="#a78bfa"
              >
                <p>
                  We do{" "}
                  <strong className="text-[var(--text-primary)]">not</strong>{" "}
                  sell your personal data. We may share information only in the
                  following limited circumstances:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    {
                      title: "Service Providers",
                      desc: "Trusted third-party vendors who assist in operating our platform (e.g., cloud hosting, payment processors, analytics tools) under strict data processing agreements.",
                    },
                    {
                      title: "Legal Requirements",
                      desc: "When required by law, court order, or government authority, or to protect the rights, property, or safety of DesignAI, our users, or the public.",
                    },
                    {
                      title: "Business Transfers",
                      desc: "In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity with prior notice to you.",
                    },
                    {
                      title: "With Your Consent",
                      desc: "In any other case, we will share your data only with your explicit, informed consent.",
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[#a78bfa] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        <strong className="text-[var(--text-primary)]">
                          {item.title}:
                        </strong>{" "}
                        {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="warning">
                  All third-party service providers are contractually obligated
                  to use your data only for the purposes we specify and to
                  maintain appropriate security standards.
                </InfoBox>
              </Section>

              {/* 5. Cookies */}
              <Section
                id="cookies"
                icon={Cookie}
                title="5. Cookies & Tracking Technologies"
                accent="#f472b6"
              >
                <p>
                  We use cookies and similar tracking technologies to enhance
                  your experience, analyze usage patterns, and personalize
                  content. The types of cookies we use:
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Essential Cookies",
                      desc: "Required for the platform to function. Cannot be disabled.",
                      color: "#2dd4bf",
                    },
                    {
                      name: "Analytics Cookies",
                      desc: "Help us understand how users interact with the platform.",
                      color: "#7c6dfa",
                    },
                    {
                      name: "Preference Cookies",
                      desc: "Remember your settings such as theme and language.",
                      color: "#fb923c",
                    },
                    {
                      name: "Marketing Cookies",
                      desc: "Used to deliver relevant promotions (opt-in only).",
                      color: "#f472b6",
                    },
                  ].map((cookie) => (
                    <div
                      key={cookie.name}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                      style={{
                        borderLeft: `3px solid ${cookie.color}`,
                      }}
                    >
                      <p
                        className="text-sm font-bold mb-1"
                        style={{ color: cookie.color }}
                      >
                        {cookie.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {cookie.desc}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4">
                  You can manage cookie preferences through your browser
                  settings or our in-app cookie consent panel. Disabling
                  non-essential cookies will not affect core platform
                  functionality.
                </p>
              </Section>

              {/* 6. Security */}
              <Section
                id="security"
                icon={Lock}
                title="6. Data Security"
                accent="#2dd4bf"
              >
                <p>
                  We implement industry-standard security measures to protect
                  your personal data against unauthorized access, alteration,
                  disclosure, or destruction. These include:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "End-to-end encryption (TLS/SSL) for all data transmitted between your browser and our servers",
                    "AES-256 encryption for sensitive data stored at rest",
                    "Bcrypt hashing for all user passwords — we never store plaintext passwords",
                    "Regular security audits and penetration testing",
                    "Role-based access control limiting employee access to your data",
                    "Automated monitoring and alerting for suspicious activity",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[#2dd4bf] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <InfoBox type="warning">
                  While we strive to protect your data, no method of
                  transmission over the internet is 100% secure. In the event
                  of a data breach that affects your personal information, we
                  will notify you within 72 hours as required by applicable law.
                </InfoBox>
              </Section>

              {/* 7. Retention */}
              <Section
                id="retention"
                icon={Clock}
                title="7. Data Retention"
                accent="#fb923c"
              >
                <p>
                  We retain your personal data only for as long as necessary to
                  fulfill the purposes outlined in this policy or as required by
                  law:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    {
                      type: "Account data",
                      period:
                        "Retained for the duration of your account plus 30 days after deletion request",
                    },
                    {
                      type: "Generated images & prompt history",
                      period: "Retained for up to 12 months, then anonymized",
                    },
                    {
                      type: "Usage analytics",
                      period: "Retained in anonymized form for up to 3 years",
                    },
                    {
                      type: "Billing records",
                      period:
                        "Retained for 7 years as required by Indonesian tax law",
                    },
                    {
                      type: "Support communications",
                      period:
                        "Retained for 2 years to resolve follow-up inquiries",
                    },
                  ].map((item) => (
                    <li key={item.type} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[#fb923c] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        <strong className="text-[var(--text-primary)]">
                          {item.type}:
                        </strong>{" "}
                        {item.period}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  When data is no longer needed, we securely delete or
                  anonymize it using industry-standard data destruction methods.
                </p>
              </Section>

              {/* 8. Your Rights */}
              <Section
                id="rights"
                icon={UserCheck}
                title="8. Your Privacy Rights"
                accent="#7c6dfa"
              >
                <p>
                  Depending on your location, you may have the following rights
                  regarding your personal data. To exercise any of these rights,
                  contact us at{" "}
                  <a
                    href="mailto:ramydiaman@gmail.com"
                    className="text-[var(--accent)] hover:underline"
                  >
                    ramydiaman@gmail.com
                  </a>
                  . We will respond within 30 days.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {USER_RIGHTS.map((item) => (
                    <div
                      key={item.right}
                      className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                    >
                      <p className="text-sm font-bold text-[var(--accent)] mb-1.5">
                        {item.right}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
                <InfoBox type="info">
                  We will never discriminate against you for exercising your
                  privacy rights. Your account access and service quality will
                  not be affected by any privacy request you make.
                </InfoBox>
              </Section>

              {/* 9. Children */}
              <Section
                id="children"
                icon={Baby}
                title="9. Children's Privacy"
                accent="#f472b6"
              >
                <p>
                  DesignAI is not directed at children under the age of{" "}
                  <strong className="text-[var(--text-primary)]">17</strong>.
                  We do not knowingly collect personal information from children
                  under this age. If we become aware that we have collected
                  personal data from a child without parental consent, we will
                  take immediate steps to delete that information.
                </p>
                <p className="mt-4">
                  If you are a parent or guardian and believe your child has
                  provided us with personal information, please contact us
                  immediately at{" "}
                  <a
                    href="mailto:ramydiaman@gmail.com"
                    className="text-[var(--accent)] hover:underline"
                  >
                    ramydiaman@gmail.com
                  </a>
                  .
                </p>
                <InfoBox type="warning">
                  Users between the ages of 17 and 18 must have a parent or
                  legal guardian review and agree to this Privacy Policy on
                  their behalf before using the platform.
                </InfoBox>
              </Section>

              {/* 10. Changes */}
              <Section
                id="changes"
                icon={RefreshCw}
                title="10. Changes to This Policy"
                accent="#2dd4bf"
              >
                <p>
                  We may update this Privacy Policy from time to time to
                  reflect changes in our practices, technology, or legal
                  requirements. When we make significant changes, we will:
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Send a notification email to your registered address at least 14 days before changes take effect",
                    "Display a prominent banner on the platform announcing the update",
                    "Update the 'Last updated' date at the top of this page",
                    "Maintain a version history of previous policies upon request",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <ChevronRight
                        size={14}
                        className="text-[#2dd4bf] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--text-muted)] text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  Your continued use of DesignAI after the effective date of
                  any changes constitutes your acceptance of the updated Privacy
                  Policy.
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
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or the way we handle your data, please
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

                {/* Also links to Terms */}
                <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3">
                  <FileText size={15} className="text-[var(--accent)] shrink-0" />
                  <p className="text-sm text-[var(--text-muted)]">
                    For more information about your rights and obligations when
                    using DesignAI, please also review our{" "}
                    <Link
                      href="/terms"
                      className="text-[var(--accent)] hover:underline font-medium"
                    >
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
