import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XPS Lead Intelligence Dashboard",
  description: "Contractor Lead Generation Platform - Phase 6",
  manifest: "/manifest.json",
  themeColor: "#EAB308",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "XPS Leads",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
