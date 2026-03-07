import type { Metadata } from "next";
import { SessionProvider } from "@/components/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaBrowser — AI Business Ideas by A-Impact",
  description:
    "Browse curated AI business ideas with deep market analysis, revenue projections, and instant build capability via Business OS.",
  openGraph: {
    title: "IdeaBrowser by A-Impact",
    description: "AI-powered business idea analysis — browse, analyze, build.",
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
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
