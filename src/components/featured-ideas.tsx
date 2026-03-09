"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";

interface FeaturedIdea {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  status: string;
  tags: string[];
  voteCount: number;
  commentCount: number;
  hasAnalysis: boolean;
  pricing: string;
  effort: string;
}

export function FeaturedIdeas() {
  const [ideas, setIdeas] = useState<FeaturedIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ideas?sort=voted&limit=4&page=1")
      .then((r) => r.json())
      .then((data: { ideas: FeaturedIdea[] }) => {
        setIdeas(data.ideas ?? []);
      })
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-white sm:text-4xl">
            Top Voted Ideas
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className="mb-3 h-5 w-20 rounded-full bg-zinc-800" />
                <div className="mb-2 h-5 w-3/4 rounded bg-zinc-800" />
                <div className="mb-4 h-4 w-full rounded bg-zinc-800" />
                <div className="h-8 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (ideas.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            Top Voted Ideas
          </h2>
          <p className="text-zinc-400">
            The community&apos;s most popular startup ideas
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ideas.map((idea, i) => {
            const cat = CATEGORIES[idea.category as Category] || {
              label: idea.category,
              color: "#6366f1",
            };
            const st = STATUS_CONFIG[idea.status as Status] || {
              label: idea.status,
              color: "#94a3b8",
              emoji: "?",
            };

            return (
              <Link
                key={idea.id}
                href={`/idea/${idea.slug}`}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900"
              >
                {/* Rank badge */}
                <div className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-600/30">
                  {i + 1}
                </div>

                {/* Category */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: cat.color + "20",
                      color: cat.color,
                    }}
                  >
                    {cat.label}
                  </span>
                  {idea.hasAnalysis && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                      AI
                    </span>
                  )}
                </div>

                {/* Title + tagline */}
                <h3 className="mb-1 text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {idea.name}
                </h3>
                <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                  {idea.tagline}
                </p>

                {/* Bottom stats */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1" style={{ color: st.color }}>
                    {st.emoji} {st.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      {idea.voteCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {idea.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
