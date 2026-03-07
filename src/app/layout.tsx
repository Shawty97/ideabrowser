import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaBrowser — 34 AI Business Ideas by A-Impact",
  description:
    "Browse curated AI business ideas with market analysis, revenue projections, and instant build capability. Powered by A-Impact.",
  openGraph: {
    title: "IdeaBrowser by A-Impact",
    description: "34 curated AI business ideas — browse, analyze, build.",
    siteName: "IdeaBrowser",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
