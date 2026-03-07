"use client";

import { type Idea, CATEGORIES, STATUS_CONFIG } from "@/lib/ideas";
import Link from "next/link";

export function IdeaCard({ idea }: { idea: Idea }) {
  const cat = CATEGORIES[idea.category];
  const status = STATUS_CONFIG[idea.status];

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
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: status.color }}
        >
          {status.emoji} {status.label}
        </span>
      </div>

      <h3 className="mb-1 text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
        {idea.name}
      </h3>
      <p className="mb-3 text-sm text-zinc-400">{idea.tagline}</p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {idea.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
        <div>
          <span className="text-zinc-600">Pricing</span>
          <p className="mt-0.5 text-zinc-300 truncate">{idea.pricing.split(",")[0]}</p>
        </div>
        <div>
          <span className="text-zinc-600">Effort</span>
          <p className="mt-0.5 text-zinc-300">{idea.effort}</p>
        </div>
      </div>
    </Link>
  );
}
