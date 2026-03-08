"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import Link from "next/link";

interface CompareIdea {
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
  analysisScore: number | null;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ideas, setIdeas] = useState<CompareIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);

  const fetchIdeas = useCallback(async () => {
    if (ids.length < 2) {
      setError("Select at least 2 ideas to compare.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ideas/compare?ids=${ids.join(",")}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load ideas");
        return;
      }
      const data = await res.json();
      setIdeas(data.ideas);
    } catch {
      setError("Failed to fetch ideas for comparison.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsParam]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  function removeIdea(id: number) {
    const newIds = ids.filter((i) => i !== id);
    if (newIds.length < 2) {
      router.push("/");
      return;
    }
    router.push(`/compare?ids=${newIds.join(",")}`);
  }

  function allSame(values: string[]): boolean {
    return values.every((v) => v === values[0]);
  }

  function renderRow(label: string, getValue: (idea: CompareIdea) => string) {
    const values = ideas.map(getValue);
    const same = allSame(values);

    return (
      <tr className="border-b border-zinc-800">
        <td className="py-3 pr-4 text-sm font-medium text-zinc-500 align-top whitespace-nowrap">
          {label}
        </td>
        {ideas.map((idea, i) => (
          <td
            key={idea.id}
            className={`py-3 px-4 text-sm align-top ${
              same ? "text-zinc-300" : "text-amber-300"
            }`}
          >
            {values[i]}
          </td>
        ))}
      </tr>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="ml-3 text-zinc-400">Loading comparison...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          &larr; Back to all ideas
        </Link>
        <div className="py-20 text-center">
          <p className="text-zinc-400">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
      >
        &larr; Back to all ideas
      </Link>

      <h1 className="mb-2 text-3xl font-black text-white">Compare Ideas</h1>
      <p className="mb-8 text-zinc-400">
        Side-by-side comparison of {ideas.length} ideas. Differences are
        highlighted in amber.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="pb-4 pr-4 text-left text-sm font-semibold text-zinc-500">
                Field
              </th>
              {ideas.map((idea) => {
                const cat = CATEGORIES[idea.category as Category] || {
                  label: idea.category,
                  color: "#6366f1",
                };
                return (
                  <th key={idea.id} className="pb-4 px-4 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/idea/${idea.slug}`}
                        className="text-lg font-bold text-white hover:text-indigo-400 transition-colors"
                      >
                        {idea.name}
                      </Link>
                      <button
                        onClick={() => removeIdea(idea.id)}
                        className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                        title="Remove from comparison"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <span
                      className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: cat.color + "20",
                        color: cat.color,
                      }}
                    >
                      {cat.label}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {renderRow("Tagline", (i) => i.tagline)}
            {renderRow("Category", (i) => {
              const cat = CATEGORIES[i.category as Category];
              return cat ? cat.label : i.category;
            })}
            {renderRow("Status", (i) => {
              const st = STATUS_CONFIG[i.status as Status];
              return st ? `${st.emoji} ${st.label}` : i.status;
            })}
            {renderRow("Target Market", (i) => i.targetMarket)}
            {renderRow("TAM", (i) => i.tam)}
            {renderRow("Pricing", (i) => i.pricing)}
            {renderRow("Effort", (i) => i.effort)}
            {renderRow("Revenue Model", (i) => i.revenueModel)}
            {renderRow("Tech Stack", (i) => i.stack.join(", "))}
            {renderRow("Tags", (i) => i.tags.join(", "))}
            {renderRow("Votes", (i) => String(i.voteCount))}
            {renderRow("Comments", (i) => String(i.commentCount))}
            {renderRow("Analysis Score", (i) =>
              i.analysisScore !== null ? `${i.analysisScore}/100` : "Not analyzed"
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span className="ml-3 text-zinc-400">Loading comparison...</span>
          </div>
        </main>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
