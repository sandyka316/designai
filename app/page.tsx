"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ImageIcon,
  ArrowRight,
  Wand2,
  Layers,
  Cpu,
  ChevronRight,
  Star,
  Zap,
  FileText,
  X,
  Paperclip,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import AiDemoSection from "@/components/AiDemoSection";

const EXAMPLE_PROMPTS = [
  "Minimalist logo for a coffee brand",
  "Futuristic packaging for a tech startup",
  "Elegant UI card for fashion e-commerce",
  "Bold poster for a music festival",
];

const FEATURES = [
  {
    icon: ImageIcon,
    title: "Image Generator",
    desc: "Generate high-quality product visuals from text using Stable Diffusion and GAN models.",
  },
  {
    icon: Wand2,
    title: "Smart Recommendations",
    desc: "Hybrid filtering learns your preferences and surfaces designs tailored to your style.",
  },
  {
    icon: Layers,
    title: "Multi-Modal Input",
    desc: "Input via text, reference images, or style keywords. Context understood from all sources.",
  },
  {
    icon: Cpu,
    title: "ML-Powered Analysis",
    desc: "Deep learning analyzes design patterns, aesthetic quality, and market fit automatically.",
  },
];

const STEPS = [
  {
    title: "Describe Your Vision",
    desc: "Type a description of the design you need — style, category, target audience, and mood.",
  },
  {
    title: "AI Generates & Recommends",
    desc: "DesignAI instantly generates visuals and surfaces relevant recommendations tailored to your input.",
  },
  {
    title: "Refine & Export",
    desc: "Iterate with feedback, adjust parameters, and export your final design ready for production.",
  },
];

const STATS = [
  { value: "10K+", label: "Designs Generated" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "< 3s", label: "Generation Time" },
];

// ─── TYPE ─────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string | null; // null = bukan image
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState<number | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    // Encode prompt lalu redirect ke /generate dengan query ?q=
    router.push(`/generate?q=${encodeURIComponent(prompt.trim())}`);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [prompt]);

  // Tutup menu saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(e.target as Node)
      ) {
        setShowUploadMenu(false);
      }
    };
    if (showUploadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUploadMenu]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Proses file yang dipilih
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setShowUploadMenu(false);

    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) => [
            ...prev,
            { id, file, previewUrl: e.target?.result as string },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedFiles((prev) => [...prev, { id, file, previewUrl: null }]);
      }
    });
  };

  // Hapus file
  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Format ukuran file
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center grid-bg spotlight overflow-hidden pt-20 pb-36">
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-[var(--accent)]/3 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[var(--accent-secondary)]/3 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-20 w-full max-w-6xl mx-auto px-6 md:px-12 text-center">
          {/* Badge */}
          <div className="animate-slide-up inline-flex items-center gap-4 tag-pill text-xs font-semibold px-4 py-2 rounded-full mt-16 mb-10 tracking-widest">
            <Zap size={16} className="text-[var(--accent)]" />
            POWERED BY GENERATIVE AI & MACHINE LEARNING
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up delay-100 text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.85] tracking-tighter mb-10">
            Design<span className="text-[var(--accent)] glow-text">AI</span>
          </h1>

          {/* Subheading */}
          <p className="animate-slide-up delay-200 text-lg text-[var(--text-muted)] max-w-[44rem] mx-auto leading-relaxed mb-12">
            Transform your ideas into stunning visuals instantly.
            <br className="hidden md:block" />
            AI-powered design recommendations tailored for you.
          </p>

          {/* ─── PROMPT INPUT ─────────────────────────────────── */}
          <div
            className="animate-slide-up delay-400 w-full max-w-[780px] mx-auto mb-10"
            id="generator"
          >
            <div className="prompt-input rounded-3xl p-2 shadow-2xl">
              {/* ── File Preview Area (muncul di atas textarea) ── */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                  {uploadedFiles.map((uf) =>
                    uf.previewUrl ? (
                      /* IMAGE PREVIEW */
                      <div
                        key={uf.id}
                        className="relative group w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] shrink-0"
                      >
                        <img
                          src={uf.previewUrl}
                          alt={uf.file.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Overlay nama */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                          <span className="text-[8px] text-white leading-tight truncate w-full">
                            {uf.file.name}
                          </span>
                        </div>
                        {/* Tombol hapus */}
                        <button
                          onClick={() => removeFile(uf.id)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                        >
                          <X size={8} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      /* FILE (NON-IMAGE) PREVIEW */
                      <div
                        key={uf.id}
                        className="relative group flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] max-w-[200px] shrink-0"
                      >
                        <FileText
                          size={18}
                          className="text-[var(--accent)] shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                            {uf.file.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {formatSize(uf.file.size)}
                          </span>
                        </div>
                        {/* Tombol hapus */}
                        <button
                          onClick={() => removeFile(uf.id)}
                          className="ml-1 w-4 h-4 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-red-500/80 transition-colors shrink-0"
                        >
                          <X size={8} className="text-white" />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* ── Row: Wand + Textarea + Button ── */}
              <div className="flex items-center gap-3">
                {/* Wand + Upload Menu */}
                <div
                  className="relative flex items-center pl-4 shrink-0"
                  ref={uploadMenuRef}
                >
                  <button
                    onClick={() => setShowUploadMenu((v) => !v)}
                    className={`transition-colors duration-200 ${
                      showUploadMenu
                        ? "text-[var(--accent)]"
                        : "text-[var(--accent)] hover:text-[var(--accent)]/70"
                    }`}
                    title="Upload file or photo"
                  >
                    <Wand2 size={28} />
                  </button>

                  {/* ── Popup Menu ── */}
                  {showUploadMenu && (
                    <div
                      className="absolute bottom-full left-0 mb-3 w-48 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl overflow-hidden z-50"
                      style={{
                        boxShadow:
                          "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,109,250,0.1)",
                      }}
                    >
                      {/* Judul menu */}
                      <div className="px-4 py-2.5 border-b border-[var(--border)]">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">
                          Attach
                        </span>
                      </div>

                      {/* Add Files */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/8 transition-colors duration-150"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                          <Paperclip
                            size={13}
                            className="text-[var(--accent)]"
                          />
                        </div>
                        <span className="font-medium">Add Files</span>
                      </button>

                      {/* Add Photo */}
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/8 transition-colors duration-150"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
                          <ImageIcon
                            size={13}
                            className="text-[var(--accent)]"
                          />
                        </div>
                        <span className="font-medium">Add Photo</span>
                      </button>
                    </div>
                  )}

                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {/* Textarea */}
                <div className="flex-1 flex items-center py-2">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handleChange}
                    placeholder="Describe what you'd like to generate..."
                    rows={1}
                    className="w-full bg-transparent outline-none border-none resize-none text-xl text-[var(--text-primary)] placeholder:text-[var(--text-dim)] leading-relaxed py-5"
                    style={{ caretColor: "var(--accent)" }}
                  />
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="btn-shimmer flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0"
                >
                  Generate <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Example prompts */}
          <div className="animate-slide-up delay-500 flex flex-wrap justify-center gap-2 mt-2 mb-10">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(p);
                  setActivePrompt(i);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  activePrompt === i && prompt === p
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="animate-slide-up delay-600 flex items-center justify-center gap-24 md:gap-32 mb-24">
            {STATS.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tighter">
                  {stat.value}
                </span>
                <span className="text-sm text-[var(--text-muted)] mt-2 font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-5 text-[var(--text-dim)]">
          <span className="text-sm font-semibold tracking-[0.35em] uppercase">
            Scroll to explore
          </span>
          <div
            className="w-px h-14 bg-gradient-to-b from-[var(--accent)]/80 via-[var(--accent)]/40 to-transparent"
            style={{ animation: "scroll-indicator 2.8s ease-in-out infinite" }}
          />
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              <Star size={11} className="text-[var(--accent)]" />
              Core Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
              Everything you need to design
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto leading-relaxed">
              From concept to final output — DesignAI handles every step of the
              creative process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feat, i) => (
              <div
                key={i}
                className="feature-card rounded-2xl p-7 group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-5 group-hover:bg-[var(--accent)]/18 transition-colors duration-200">
                  <feat.icon size={18} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {feat.desc}
                </p>
                <div className="flex items-center gap-1 mt-5 text-xs text-[var(--accent)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Learn more <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight">
              How it works
            </h2>
            <p className="text-[var(--text-muted)] text-lg">
              Three simple steps to your perfect design
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-transparent via-[var(--accent)]/25 to-transparent pointer-events-none" />

            {STEPS.map((step, i) => (
              <div
                key={i}
                className="step-card rounded-2xl p-7 flex flex-col items-center text-center"
              >
                <div className="relative w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center mb-6 shadow-md shrink-0">
                  <span className="text-2xl font-extrabold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-transparent pointer-events-none" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AiDemoSection />

      {/* ─── CTA BOTTOM ───────────────────────────────────────── */}
      <section className="py-32 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-14 overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/6 via-transparent to-[var(--accent-secondary)]/4 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/45 to-transparent" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 tag-pill text-xs font-semibold px-3.5 py-1.5 rounded-full mb-7 tracking-wide uppercase">
                <Sparkles size={11} className="text-[var(--accent)]" />
                Start Free Today
              </div>

              <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-5 tracking-tight">
                Ready to design smarter?
              </h2>
              <p className="text-[var(--text-muted)] text-base leading-relaxed mb-10 max-w-sm mx-auto">
                Join thousands of designers, UMKM owners, and creatives already
                using DesignAI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="btn-shimmer flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white">
                  Start Generating for Free
                  <ArrowRight size={14} />
                </button>
                <a
                  href="#ai-demo"
                  className="btn-outline flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
                >
                  View Examples
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--text-muted)]">
              Design<span className="text-[var(--accent)]">AI</span>
            </span>
          </div>

          <p className="text-xs text-[var(--text-dim)] font-medium">
            © 2026 DesignAI — Universitas Negeri Surabaya × Celerates
          </p>

          <div className="flex items-center gap-5 text-xs text-[var(--text-dim)]">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="hover:text-[var(--text-muted)] transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
