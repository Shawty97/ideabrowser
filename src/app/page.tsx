"use client";

import { useState, useMemo } from "react";
import { IDEAS, type Category, type Status } from "@/lib/ideas";
import { IdeaCard } from "@/components/idea-card";
import { Filters } from "@/components/filters";

export default function HomePage() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return IDEAS.filter((idea) => {
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
  }, [category, status, search]);

  const stats = useMemo(() => {
    const active = IDEAS.filter((i) => i.status === "active").length;
    const totalPricing = IDEAS.filter((i) => i.pricing.includes("/mo")).length;
    return { total: IDEAS.length, active, recurring: totalPricing };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
          Powered by A-Impact
        </div>
        <h1 className="mb-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
          Idea<span className="text-indigo-500">Browser</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          {stats.total} curated AI business ideas with market analysis, revenue
          models, and tech stacks. Find your next venture.
        </p>

        {/* Stats */}
        <div className="mt-8 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-zinc-500">Ideas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {stats.active}
            </div>
            <div className="text-sm text-zinc-500">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-400">
              {stats.recurring}
            </div>
            <div className="text-sm text-zinc-500">Recurring Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">9</div>
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
      {filtered.length === 0 ? (
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
          <a
            href="https://a-impact.io"
            className="text-indigo-500 hover:underline"
          >
            A-Impact
          </a>{" "}
          — AI Departments as a Service
        </p>
      </footer>
    </main>
  );
}
