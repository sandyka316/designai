"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Mulai dengan "dark" di server & client — biar konsisten
  // Nilai asli dibaca di useEffect setelah mount
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Baca dari DOM yang sudah di-set oleh inline script
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
      html.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <>
      {children}
      {/* ✅ Tombol hanya muncul setelah mount — hindari icon mismatch */}
      {mounted && (
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="theme-toggle fixed bottom-6 right-6 z-[200] w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}
    </>
  );
}
