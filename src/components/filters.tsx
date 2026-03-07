"use client";

import { type Category, type Status, CATEGORIES, STATUS_CONFIG } from "@/lib/ideas";

interface FiltersProps {
  selectedCategory: Category | "all";
  selectedStatus: Status | "all";
  searchQuery: string;
  onCategoryChange: (cat: Category | "all") => void;
  onStatusChange: (status: Status | "all") => void;
  onSearchChange: (query: string) => void;
  resultCount: number;
}

export function Filters({
  selectedCategory,
  selectedStatus,
  searchQuery,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  resultCount,
}: FiltersProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search ideas by name, description, or tag..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="absolute right-4 top-3.5 text-sm text-zinc-500">
          {resultCount} ideas
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          All Categories
        </button>
        {(Object.entries(CATEGORIES) as [Category, { label: string; color: string }][]).map(
          ([key, val]) => (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === key
                  ? "text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              style={
                selectedCategory === key
                  ? { backgroundColor: val.color }
                  : undefined
              }
            >
              {val.label}
            </button>
          )
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onStatusChange("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            selectedStatus === "all"
              ? "bg-indigo-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          All Status
        </button>
        {(Object.entries(STATUS_CONFIG) as [Status, { label: string; color: string; emoji: string }][]).map(
          ([key, val]) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedStatus === key
                  ? "text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              style={
                selectedStatus === key
                  ? { backgroundColor: val.color }
                  : undefined
              }
            >
              {val.emoji} {val.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}
