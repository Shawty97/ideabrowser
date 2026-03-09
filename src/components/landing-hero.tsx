"use client";

import Link from "next/link";

export function LandingHero() {
  function scrollToIdeas() {
    const el = document.getElementById("ideas-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[400px] rounded-full bg-emerald-600/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium text-indigo-300">
            Powered by A-Impact
          </span>
        </div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
          Discover Your Next{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Big Idea
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Browse curated startup ideas with AI-powered deep analysis, market
          validation, revenue projections, and one-click Business OS integration
          to start building.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={scrollToIdeas}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/40"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Browse Ideas
          </button>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-8 py-3.5 text-base font-semibold text-zinc-200 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            Get Started
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
