"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import Link from "next/link";

interface IdeaCardProps {
  idea: {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    category: string;
    status: string;
    pricing: string;
    effort: string;
    tags: string[];
    voteCount: number;
    commentCount: number;
    hasAnalysis: boolean;
    relevance?: number;
    matchReason?: string;
  };
  isBookmarked?: boolean;
  onBookmarkToggle?: (ideaId: number, bookmarked: boolean) => void;
  isComparing?: boolean;
  onCompareToggle?: (ideaId: number) => void;
}

export function IdeaCard({ idea, isBookmarked = false, onBookmarkToggle, isComparing = false, onCompareToggle }: IdeaCardProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Sync with parent prop when bookmarks load asynchronously
  useEffect(() => {
    setBookmarked(isBookmarked);
  }, [isBookmarked]);

  const cat = CATEGORIES[idea.category as Category] || { label: idea.category, color: "#6366f1" };
  const status = STATUS_CONFIG[idea.status as Status] || { label: idea.status, color: "#94a3b8", emoji: "?" };

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setBookmarked(data.bookmarked);
      onBookmarkToggle?.(idea.id, data.bookmarked);
    } catch {
      // Silently fail — bookmark state unchanged
    } finally {
      setBookmarkLoading(false);
    }
  }

  return (
    <Link
      href={`/idea/${idea.slug}`}
      className="group relative block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-600 hover:bg-zinc-900"
    >
      {/* Bookmark button */}
      {session?.user && (
        <button
          onClick={handleBookmark}
          disabled={bookmarkLoading}
          className={`absolute right-4 top-4 z-10 rounded-lg p-1.5 transition-colors ${
            bookmarked
              ? "text-amber-400 hover:text-amber-300"
              : "text-zinc-600 hover:text-zinc-400"
          } ${bookmarkLoading ? "opacity-50" : ""}`}
          title={bookmarked ? "Remove bookmark" : "Bookmark this idea"}
        >
          <svg
            className="h-4 w-4"
            fill={bookmarked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      )}

      {/* Compare toggle */}
      {onCompareToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCompareToggle(idea.id);
          }}
          className={`absolute right-4 z-10 rounded-lg p-1.5 transition-colors ${
            sessionStatus === "loading" || session?.user ? "top-12" : "top-4"
          } ${
            isComparing
              ? "text-indigo-400 hover:text-indigo-300 bg-indigo-500/10"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
          title={isComparing ? "Remove from comparison" : "Add to comparison"}
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </button>
      )}

      {/* Relevance badge for AI search results */}
      {idea.relevance !== undefined && (
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            {idea.relevance}% match
          </span>
          {idea.matchReason && (
            <span className="truncate text-xs text-zinc-500">{idea.matchReason}</span>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ backgroundColor: cat.color + "20", color: cat.color }}
        >
          {cat.label}
        </span>
        <div className="flex items-center gap-2">
          {idea.hasAnalysis && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
              AI
            </span>
          )}
          <span className="flex items-center gap-1 text-xs" style={{ color: status.color }}>
            {status.emoji} {status.label}
          </span>
        </div>
      </div>

      <h3 className="mb-1 text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
        {idea.name}
      </h3>
      <p className="mb-3 text-sm text-zinc-400">{idea.tagline}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {idea.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
          <div>
            <span className="text-zinc-600">Pricing</span>
            <p className="mt-0.5 truncate text-zinc-300">{idea.pricing.split(",")[0]}</p>
          </div>
          <div>
            <span className="text-zinc-600">Effort</span>
            <p className="mt-0.5 text-zinc-300">{idea.effort}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span title="Votes" className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            {idea.voteCount}
          </span>
          <span title="Comments" className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {idea.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
