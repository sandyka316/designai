"use client";

import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

// ThemeProvider: menyimpan state tema & menyediakan toggle button global
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Baca preferensi tersimpan dari localStorage saat mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  // Terapkan class ke <html> setiap kali tema berubah
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
      html.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <>
      {children}
      {/* Tombol toggle mengambang di pojok kanan bawah */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="theme-toggle fixed bottom-6 right-6 z-[200] w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="grain antialiased">
        <AuthProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
