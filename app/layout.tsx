import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeWrapper from "@/components/ThemeWrapper";

export const metadata: Metadata = {
  title: "DesignAI",
  description: "AI-powered design tools",
  icons: {
    icon: "/icon.png",          // favicon biasa
    apple: "/apple-icon.png",   // untuk iOS (opsional)
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="grain antialiased" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <AuthProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
