import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignAI — AI-Powered Design Generator",
  description: "Generate stunning product designs with Generative AI and Machine Learning",
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="grain antialiased">
        {children}
      </body>
    </html>
  );
}