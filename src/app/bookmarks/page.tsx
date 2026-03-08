"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IdeaCard } from "@/components/idea-card";
import { UserMenu } from "@/components/user-menu";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import Link from "next/link";

interface BookmarkedIdea {
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
  compositeScore: number;
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [ideas, setIdeas] = useState<BookmarkedIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data: { ideas: BookmarkedIdea[] }) => {
        setIdeas(data.ideas ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user, sessionStatus]);

  function handleBookmarkToggle(ideaId: number, bookmarked: boolean) {
    if (!bookmarked) {
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            &larr; Back to Ideas
          </Link>
          <UserMenu />
        </div>
        <h1 className="mb-8 text-3xl font-bold text-white">Your Bookmarks</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="mb-3 h-6 w-24 rounded-full bg-zinc-800" />
              <div className="mb-2 h-6 w-3/4 rounded bg-zinc-800" />
              <div className="mb-4 h-4 w-full rounded bg-zinc-800" />
              <div className="h-16 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            &larr; Back to Ideas
          </Link>
          <UserMenu />
        </div>
        <div className="py-20 text-center">
          <h1 className="mb-4 text-3xl font-bold text-white">Sign in to view bookmarks</h1>
          <p className="text-zinc-500 mb-6">
            You need to be signed in to save and view bookmarked ideas.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
          &larr; Back to Ideas
        </Link>
        <UserMenu />
      </div>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Your Bookmarks</h1>
        <p className="text-zinc-500">
          {ideas.length === 0
            ? "No bookmarked ideas yet. Browse ideas and click the bookmark icon to save them."
            : `${ideas.length} saved idea${ideas.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {ideas.length === 0 ? (
        <div className="py-20 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-zinc-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-zinc-500 mb-6">
            Start bookmarking ideas to build your collection.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Browse Ideas
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isBookmarked={true}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}

      <EcosystemFooter />
    </main>
  );
}
