import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource-variable/albert-sans";
import "@fontsource/fira-mono/400.css";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Open House",
  description: "Find the open homes near the one you are seeing, and get the day planned.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9cf8f",
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request makes every page render per request, which is
  // what lets Next put the proxy's nonce on its own scripts.
  // The proxy's nonce, so the theme script below is allowed to run.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    // The theme script sets data-theme before React loads, which React
    // would otherwise report as a mismatch.
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* A fixed script, no user input: puts a theme chosen with the
            switch on the page before it paints, so it never flashes. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <header className="header">
          <div className="header-inner">
            <Link className="brand" href="/">
              <svg className="brand-mark" viewBox="0 0 28 28" aria-hidden="true">
                <defs>
                  <linearGradient id="brand-warm" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#f9cf8f" />
                    <stop offset="1" stopColor="#f29a7c" />
                  </linearGradient>
                </defs>
                <rect width="28" height="28" rx="9" fill="url(#brand-warm)" />
                <path d="M6 14.5 14 7l8 7.5V21a1 1 0 0 1-1 1h-4.5v-5h-5v5H7a1 1 0 0 1-1-1z" fill="#2b1710" />
              </svg>
              <span>Open House</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="content">{children}</main>
      </body>
    </html>
  );
}
