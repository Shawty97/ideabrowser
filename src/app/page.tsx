"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import { IdeaCard } from "@/components/idea-card";
import { Filters } from "@/components/filters";
import { UserMenu } from "@/components/user-menu";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import Link from "next/link";

type SortOption = "hot" | "new" | "top-voted" | "highest-score";

interface IdeaFromAPI {
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
  analysisScore: number | null;
  aiGenerated?: boolean;
  createdAt?: string;
}

function compositeScore(idea: IdeaFromAPI): number {
  const analysisScoreComponent = (idea.analysisScore ?? 0) * 0.4;
  const voteComponent = idea.voteCount * 10 * 0.3;
  const now = Date.now();
  const createdAt = idea.createdAt ? new Date(idea.createdAt).getTime() : now;
  const daysSinceCreation = Math.max(1, (now - createdAt) / 86400000);
  const recencyComponent = (1 / daysSinceCreation) * 100 * 0.2;
  const commentComponent = idea.commentCount * 5 * 0.1;
  return analysisScoreComponent + voteComponent + recencyComponent + commentComponent;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<IdeaFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("hot");

  useEffect(() => {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data) => {
        setIdeas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = ideas.filter((idea) => {
      if (category !== "all" && idea.category !== category) return false;
      if (status !== "all" && idea.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          idea.name.toLowerCase().includes(q) ||
          idea.tagline.toLowerCase().includes(q) ||
          idea.description.toLowerCase().includes(q) ||
          idea.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });

    // Sort
    switch (sort) {
      case "hot":
        result = [...result].sort((a, b) => compositeScore(b) - compositeScore(a));
        break;
      case "new":
        result = [...result].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "top-voted":
        result = [...result].sort((a, b) => b.voteCount - a.voteCount);
        break;
      case "highest-score":
        result = [...result].sort((a, b) => (b.analysisScore ?? 0) - (a.analysisScore ?? 0));
        break;
    }

    return result;
  }, [ideas, category, status, search, sort]);

  const trending = useMemo(() => {
    return [...ideas]
      .sort((a, b) => compositeScore(b) - compositeScore(a))
      .slice(0, 5);
  }, [ideas]);

  const stats = useMemo(() => {
    const active = ideas.filter((i) => i.status === "active").length;
    const withAnalysis = ideas.filter((i) => i.hasAnalysis).length;
    const categories = new Set(ideas.map((i) => i.category)).size;
    const aiGenCount = ideas.filter((i) => i.aiGenerated).length;
    return { total: ideas.length, active, analyzed: withAnalysis, categories, aiGenerated: aiGenCount };
  }, [ideas]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">
            Powered by A-Impact
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/generate"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Generate Ideas
          </Link>
          {session?.user && (
            <Link
              href="/submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + Submit Idea
            </Link>
          )}
          <UserMenu />
        </div>
      </div>

      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
          Idea<span className="text-indigo-500">Browser</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          {stats.total} AI business ideas with deep market analysis,
          revenue projections, and instant build capability via Business OS.
        </p>

        {/* Generate CTA */}
        <div className="mt-6">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 px-8 py-3 font-semibold text-white hover:from-indigo-500 hover:to-emerald-500 transition-all"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Custom Ideas with AI
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-8 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-zinc-500">Ideas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{stats.active}</div>
            <div className="text-sm text-zinc-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-400">{stats.analyzed}</div>
            <div className="text-sm text-zinc-500">AI-Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">{stats.categories}</div>
            <div className="text-sm text-zinc-500">Categories</div>
          </div>
        </div>
      </div>

      {/* Trending This Week */}
      {!loading && trending.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">Trending This Week</h2>
          <div className="grid gap-3 sm:grid-cols-5">
            {trending.map((idea, i) => (
              <Link
                key={idea.id}
                href={`/idea/${idea.slug}`}
                className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 transition-colors"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {idea.name}
                  </div>
                  <div className="truncate text-xs text-zinc-500">{idea.tagline}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sort Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-zinc-900/50 p-1 border border-zinc-800 w-fit">
        {([
          { key: "hot" as const, label: "Hot" },
          { key: "new" as const, label: "New" },
          { key: "top-voted" as const, label: "Top Voted" },
          { key: "highest-score" as const, label: "Highest Score" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSort(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              sort === tab.key
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Filters
        selectedCategory={category}
        selectedStatus={status}
        searchQuery={search}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
        resultCount={filtered.length}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-3 h-6 w-24 rounded-full bg-zinc-800" />
              <div className="mb-2 h-6 w-3/4 rounded bg-zinc-800" />
              <div className="mb-4 h-4 w-full rounded bg-zinc-800" />
              <div className="h-16 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-500 mb-4">No ideas match your filters. Try adjusting your search.</p>
          <Link
            href="/generate"
            className="inline-flex rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Generate Custom Ideas
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {/* Ecosystem Footer */}
      <EcosystemFooter />
    </main>
  );
}
