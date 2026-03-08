"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { IdeaCard } from "@/components/idea-card";
import { UserMenu } from "@/components/user-menu";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import Link from "next/link";

const BUDGET_OPTIONS = [
  { value: "", label: "Any Budget" },
  { value: "bootstrapped", label: "Bootstrapped (< EUR 1K)" },
  { value: "seed", label: "Seed (EUR 1K-50K)" },
  { value: "series-a", label: "Series A (EUR 50K-500K)" },
  { value: "enterprise", label: "Enterprise (EUR 500K+)" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "ai-departments", label: "AI Departments" },
  { value: "saas", label: "SaaS" },
  { value: "marketplace", label: "Marketplace" },
  { value: "agency", label: "Agency" },
  { value: "content", label: "Content" },
  { value: "vertical", label: "Vertical AI" },
  { value: "consumer", label: "Consumer" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "moonshot", label: "Moonshot" },
];

const COUNT_OPTIONS = [5, 10, 25, 50];

interface Preset {
  label: string;
  market: string;
  niche: string;
  audience: string;
  budget: string;
  category: string;
}

const PRESETS: Preset[] = [
  { label: "DACH SaaS", market: "DACH B2B SaaS", niche: "Automation und Effizienz", audience: "Deutsche Mittelstand-Unternehmen", budget: "seed", category: "saas" },
  { label: "Consumer App", market: "Global Consumer Mobile", niche: "Daily habits and lifestyle", audience: "Gen Z and Millennials", budget: "bootstrapped", category: "consumer" },
  { label: "B2B Enterprise", market: "Enterprise Software DACH", niche: "Digital Transformation", audience: "CTOs and IT Directors", budget: "series-a", category: "ai-departments" },
  { label: "Moonshot", market: "Emerging Technologies Global", niche: "Breakthrough innovations", audience: "VCs and early adopters", budget: "enterprise", category: "moonshot" },
  { label: "AI Departments", market: "DACH SME Operations", niche: "AI-powered business departments", audience: "CEOs of 10-500 employee companies", budget: "seed", category: "ai-departments" },
];

interface GeneratedIdea {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  status: string;
  targetMarket: string;
  tam: string;
  pricing: string;
  stack: string[];
  effort: string;
  revenueModel: string;
  tags: string[];
  voteCount: number;
  commentCount: number;
  hasAnalysis: boolean;
}

const LOADING_MESSAGES = [
  "Analyzing market opportunities...",
  "Evaluating competitive landscape...",
  "Calculating TAM and revenue potential...",
  "Designing pricing models...",
  "Identifying tech stack requirements...",
  "Generating unique business concepts...",
  "Validating idea feasibility...",
  "Crafting compelling value propositions...",
];

export default function GeneratePage() {
  const { data: session } = useSession();
  const [market, setMarket] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("all");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [results, setResults] = useState<GeneratedIdea[]>([]);
  const [error, setError] = useState("");

  function applyPreset(preset: Preset) {
    setMarket(preset.market);
    setNiche(preset.niche);
    setAudience(preset.audience);
    setBudget(preset.budget);
    setCategory(preset.category);
  }

  async function handleGenerate() {
    if (!market.trim()) {
      setError("Market/Nische is required");
      return;
    }
    setError("");
    setLoading(true);
    setResults([]);

    // Cycle through loading messages
    let msgIndex = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, niche, audience, budget, category, count }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const ideas = await res.json();
      setResults(ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingMsg("");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
          &larr; Back to IdeaBrowser
        </Link>
        <UserMenu />
      </div>

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Generate <span className="text-indigo-500">Ideas</span>
        </h1>
        <p className="mx-auto max-w-xl text-zinc-400">
          Describe your market and let AI generate unique, actionable business ideas with full analysis.
          {!session?.user && (
            <span className="block mt-1 text-amber-400 text-sm">
              3 free generations per day. Sign in for unlimited.
            </span>
          )}
        </p>
      </div>

      {/* Quick Presets */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase text-zinc-500">Quick Presets</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Market */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-zinc-300">Market / Nische *</label>
            <input
              type="text"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="z.B. DACH B2B SaaS, Healthcare AI, E-Commerce..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Niche */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Spezifische Nische</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Optional: AI Automation, Voice..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Zielgruppe</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Optional: SMEs, Founders, CTOs..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Budget Range</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            >
              {BUDGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Anzahl</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none"
            >
              {COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} Ideas</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? `Generating ${count} ideas...` : `Generate ${count} Ideas`}
          </button>
          {loading && (
            <span className="text-sm text-zinc-400 animate-pulse">{loadingMsg}</span>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count > 6 ? 6 : count }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-3 h-6 w-24 rounded-full bg-zinc-800" />
              <div className="mb-2 h-6 w-3/4 rounded bg-zinc-800" />
              <div className="mb-4 h-4 w-full rounded bg-zinc-800" />
              <div className="h-16 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {results.length} Ideas Generated
            </h2>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Generate More
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      )}

      {/* Ecosystem Footer */}
      <EcosystemFooter />
    </main>
  );
}
