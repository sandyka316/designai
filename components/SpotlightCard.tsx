"use client";

import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

/**
 * SpotlightCard — Card dengan efek spotlight/glow berwarna yang mengikuti kursor.
 * Digunakan di Dashboard, Analytics, BI Dashboard, dan halaman lainnya.
 *
 * @param hex      Warna utama (hex), default violet #7c6dfa
 * @param hex2     Warna sekunder (hex), default biru #4facfe
 * @param rgb      RGB dari warna utama (untuk rgba())
 * @param lift     Seberapa tinggi card terangkat saat hover (px), default 8
 */
export default function SpotlightCard({
  children,
  className = "",
  hex = "#7c6dfa",
  hex2 = "#4facfe",
  rgb = { r: 124, g: 109, b: 250 },
  lift = 8,
}: {
  children: React.ReactNode;
  className?: string;
  hex?: string;
  hex2?: string;
  rgb?: { r: number; g: number; b: number };
  lift?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const { r, g, b } = rgb;
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  const hex2rgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 79, g: 172, b: 254 };
  };
  const c2 = hex2rgb(hex2);
  const rgba2 = (a: number) => `rgba(${c2.r},${c2.g},${c2.b},${a})`;

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top, opacity: 1 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}
      style={{
        background: isHovered
          ? `linear-gradient(135deg, ${rgba(0.1)} 0%, var(--bg-card) 45%, ${rgba2(0.08)} 100%)`
          : "var(--bg-card)",
        border: isHovered ? `1.5px solid ${rgba(0.8)}` : "1px solid var(--border)",
        transform: isHovered
          ? `translateY(-${lift}px) scale(1.03)`
          : "translateY(0) scale(1)",
        transition:
          "background 0.35s ease, border-color 0.2s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease",
        boxShadow: isHovered
          ? `0 0 0 1px ${rgba(0.4)}, 0 6px 14px rgba(0,0,0,0.35), 0 20px 56px ${rgba(0.32)}, 0 0 90px ${rgba(0.12)}`
          : "0 1px 3px rgba(0,0,0,0.2)",
      }}
    >
      {/* Primary spotlight radial */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity,
          transition: "opacity 0.15s ease",
          background: `radial-gradient(300px circle at ${spotlight.x}px ${spotlight.y}px, ${rgba(0.35)}, ${rgba(0.1)} 45%, transparent 70%)`,
        }}
      />

      {/* Secondary spotlight — complementary color */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: spotlight.opacity * 0.65,
          transition: "opacity 0.2s ease",
          background: `radial-gradient(180px circle at ${spotlight.x + 25}px ${spotlight.y + 15}px, ${rgba2(0.25)}, transparent 65%)`,
        }}
      />

      {/* Top edge glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-250"
        style={{
          height: isHovered ? "2.5px" : "1px",
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(90deg, transparent 0%, ${rgba(1)} 20%, ${rgba2(0.9)} 50%, ${rgba(1)} 80%, transparent 100%)`,
          boxShadow: isHovered
            ? `0 0 14px ${rgba(0.9)}, 0 0 28px ${rgba(0.5)}, 0 0 48px ${rgba(0.25)}`
            : "none",
        }}
      />

      {/* Bottom edge glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 transition-all duration-400"
        style={{
          height: isHovered ? "1.5px" : "1px",
          opacity: isHovered ? 0.65 : 0,
          background: `linear-gradient(90deg, transparent 15%, ${rgba2(0.8)} 50%, transparent 85%)`,
        }}
      />

      {/* Left edge accent line */}
      <div
        className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300"
        style={{
          width: isHovered ? "2px" : "0px",
          opacity: isHovered ? 0.7 : 0,
          background: `linear-gradient(180deg, ${rgba(0.8)}, ${rgba2(0.6)}, transparent)`,
        }}
      />

      {/* Corner glow — top left */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-36 h-36 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at 0% 0%, ${rgba(0.55)}, ${rgba(0.12)} 50%, transparent 70%)`,
        }}
      />

      {/* Corner glow — bottom right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-36 h-36 transition-opacity duration-350"
        style={{
          opacity: isHovered ? 0.85 : 0,
          background: `radial-gradient(circle at 100% 100%, ${rgba2(0.5)}, ${rgba2(0.1)} 50%, transparent 70%)`,
        }}
      />

      {/* Center bloom from bottom */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 120%, ${rgba(0.18)}, transparent 70%)`,
        }}
      />

      {/* Subtle inner tint */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-400"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `linear-gradient(145deg, ${rgba(0.06)} 0%, transparent 40%, ${rgba2(0.05)} 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
