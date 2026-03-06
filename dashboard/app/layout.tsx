import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "XPS Lead Intelligence Dashboard",
  description: "Contractor Lead Generation Platform - Phase 6",
  manifest: "/manifest.json",
  other: { "color-scheme": "dark" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XPS Leads",
  },
};

export const viewport: Viewport = {
  themeColor: "#EAB308",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(function(err) {
                  console.error('Service Worker registration failed:', err);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
