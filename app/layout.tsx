import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ThemeWrapper from "@/components/ThemeWrapper";

export const metadata: Metadata = {
  title: "DesignAI",
  description: "AI-powered design tools",
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
        <script
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
      </head>
      <body className="grain antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ThemeWrapper>{children}</ThemeWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
