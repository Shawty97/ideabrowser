"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import { IdeaCard } from "@/components/idea-card";
import { Filters } from "@/components/filters";
import { UserMenu } from "@/components/user-menu";
import Link from "next/link";

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
}

export default function HomePage() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState<IdeaFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

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
    return ideas.filter((idea) => {
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
  }, [ideas, category, status, search]);

  const stats = useMemo(() => {
    const active = ideas.filter((i) => i.status === "active").length;
    const withAnalysis = ideas.filter((i) => i.hasAnalysis).length;
    const categories = new Set(ideas.map((i) => i.category)).size;
    return { total: ideas.length, active, analyzed: withAnalysis, categories };
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
          {stats.total} curated AI business ideas with deep market analysis,
          revenue projections, and instant build capability via Business OS.
        </p>

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
        <div className="py-20 text-center text-zinc-500">
          No ideas match your filters. Try adjusting your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-800 pt-8 text-center text-sm text-zinc-600">
        <p>
          IdeaBrowser by{" "}
          <a href="https://a-impact.io" className="text-indigo-500 hover:underline">
            A-Impact
          </a>{" "}
          — AI Departments as a Service
        </p>
      </footer>
    </main>
  );
}
