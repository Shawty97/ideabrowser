"use client";

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
  };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const cat = CATEGORIES[idea.category as Category] || { label: idea.category, color: "#6366f1" };
  const status = STATUS_CONFIG[idea.status as Status] || { label: idea.status, color: "#94a3b8", emoji: "?" };

  return (
    <Link
      href={`/idea/${idea.slug}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-600 hover:bg-zinc-900"
    >
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
