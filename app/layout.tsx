import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "DesignAI — AI-Powered Design Generator",
  description:
    "Generate stunning product designs with Generative AI and Machine Learning",
};

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
        {/* AuthProvider wajib membungkus seluruh app agar session bisa diakses di mana saja */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
