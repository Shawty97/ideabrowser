"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import { IdeaCard } from "@/components/idea-card";
import { Filters } from "@/components/filters";
import { UserMenu } from "@/components/user-menu";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import { LandingHero } from "@/components/landing-hero";
import { StatsSection } from "@/components/stats-section";
import { HowItWorks } from "@/components/how-it-works";
import { FeaturedIdeas } from "@/components/featured-ideas";
import { LandingCta } from "@/components/landing-cta";
import { useRouter } from "next/navigation";
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
  relevance?: number;
  matchReason?: string;
}

interface PaginatedResponse {
  ideas: IdeaFromAPI[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
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

const SORT_MAP: Record<SortOption, string> = {
  hot: "hot",
  new: "new",
  "top-voted": "voted",
  "highest-score": "score",
};

export default function HomePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [ideas, setIdeas] = useState<IdeaFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("hot");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // AI search state
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<IdeaFromAPI[] | null>(null);
  const aiSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  // Comparison state
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const routerNav = useRouter();

  // Intersection observer ref for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const isLoggedOut = !session?.user;

  // Build URL params for API call
  const buildApiUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      if (search && !aiSearchEnabled) params.set("search", search);
      params.set("sort", SORT_MAP[sort]);
      params.set("page", String(page));
      params.set("limit", "20");
      return `/api/ideas?${params.toString()}`;
    },
    [category, status, search, sort, aiSearchEnabled]
  );

  // Fetch initial page and reset
  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(1));
      const data: PaginatedResponse = await res.json();
      setIdeas(data.ideas);
      setTotalCount(data.total);
      setCurrentPage(1);
      setHasMore(data.hasMore);
    } catch {
      setIdeas([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl]);

  // Fetch next page (append)
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasMore || aiSearchEnabled) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await fetch(buildApiUrl(nextPage));
      const data: PaginatedResponse = await res.json();
      setIdeas((prev) => [...prev, ...data.ideas]);
      setCurrentPage(nextPage);
      setHasMore(data.hasMore);
    } catch {
      // silently fail, user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, buildApiUrl, aiSearchEnabled]);

  // Initial load
  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Fetch bookmarked IDs for current user
  useEffect(() => {
    if (!session?.user) {
      setBookmarkedIds(new Set());
      return;
    }
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data: { ideas: Array<{ id: number }> }) => {
        setBookmarkedIds(new Set(data.ideas.map((i) => i.id)));
      })
      .catch(() => setBookmarkedIds(new Set()));
  }, [session?.user]);

  // AI search with debounce
  useEffect(() => {
    if (!aiSearchEnabled || !search || search.trim().length < 2) {
      setAiSearchResults(null);
      return;
    }

    // Debounce 500ms
    if (aiSearchTimerRef.current) {
      clearTimeout(aiSearchTimerRef.current);
    }

    aiSearchTimerRef.current = setTimeout(async () => {
      setAiSearchLoading(true);
      try {
        const res = await fetch(`/api/ideas/search?q=${encodeURIComponent(search.trim())}`);
        const data = await res.json();
        setAiSearchResults(data.ideas ?? []);
      } catch {
        setAiSearchResults([]);
      } finally {
        setAiSearchLoading(false);
      }
    }, 500);

    return () => {
      if (aiSearchTimerRef.current) {
        clearTimeout(aiSearchTimerRef.current);
      }
    };
  }, [search, aiSearchEnabled]);

  // Clear AI search results when toggling off
  useEffect(() => {
    if (!aiSearchEnabled) {
      setAiSearchResults(null);
    }
  }, [aiSearchEnabled]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || aiSearchEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, fetchNextPage, aiSearchEnabled]);

  // Determine what to show: AI search results or paginated ideas
  const displayIdeas = aiSearchEnabled && aiSearchResults !== null ? aiSearchResults : ideas;

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
    return { total: totalCount, active, analyzed: withAnalysis, categories, aiGenerated: aiGenCount };
  }, [ideas, totalCount]);

  function handleBookmarkToggle(ideaId: number, bookmarked: boolean) {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (bookmarked) {
        next.add(ideaId);
      } else {
        next.delete(ideaId);
      }
      return next;
    });
  }

  function handleCompareToggle(ideaId: number) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(ideaId)) {
        next.delete(ideaId);
      } else if (next.size < 3) {
        next.add(ideaId);
      }
      return next;
    });
  }

  function goToCompare() {
    const idsArray = Array.from(compareIds);
    routerNav.push(`/compare?ids=${idsArray.join(",")}`);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-black text-white">
              Idea<span className="text-indigo-500">Browser</span>
            </span>
          </Link>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">
            by A-Impact
          </span>
        </div>
        <div className="flex items-center gap-3">
          {session?.user && (
            <Link
              href="/bookmarks"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
            >
              Bookmarks
            </Link>
          )}
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

      {/* Landing Sections -- shown only for logged-out users */}
      {isLoggedOut && (
        <>
          <LandingHero />
          <StatsSection />
          <HowItWorks />
          <FeaturedIdeas />
          <LandingCta />

          {/* Divider before browse section */}
          <div className="my-12 border-t border-zinc-800" />
        </>
      )}

      {/* Browse Section */}
      <div id="ideas-grid">
        {/* Hero -- only for logged-in users (compact version) */}
        {!isLoggedOut && (
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
        )}

        {/* Section header for logged-out browse */}
        {isLoggedOut && (
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
              Browse All Ideas
            </h2>
            <p className="text-zinc-400">
              {stats.total} startup ideas and counting. Filter, search, and explore.
            </p>
          </div>
        )}

        {/* Trending This Week */}
        {!loading && trending.length > 0 && !aiSearchEnabled && !isLoggedOut && (
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
        {!aiSearchEnabled && (
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
        )}

        {/* AI Search active indicator */}
        {aiSearchEnabled && aiSearchResults !== null && (
          <div className="mb-6 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
            <p className="text-sm text-emerald-400">
              AI Semantic Search results for &quot;{search}&quot; &mdash; {aiSearchResults.length} matches found, sorted by relevance
            </p>
          </div>
        )}

        {/* Filters */}
        <Filters
          selectedCategory={category}
          selectedStatus={status}
          searchQuery={search}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
          resultCount={displayIdeas.length}
          aiSearchEnabled={aiSearchEnabled}
          onAiSearchToggle={setAiSearchEnabled}
          aiSearchLoading={aiSearchLoading}
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
        ) : displayIdeas.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-500 mb-4">
              {aiSearchEnabled
                ? "No ideas match your AI search. Try a different query."
                : "No ideas match your filters. Try adjusting your search."}
            </p>
            <Link
              href="/generate"
              className="inline-flex rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Generate Custom Ideas
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                isBookmarked={bookmarkedIds.has(idea.id)}
                onBookmarkToggle={handleBookmarkToggle}
                isComparing={compareIds.has(idea.id)}
                onCompareToggle={handleCompareToggle}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel + loading spinner */}
        {!aiSearchEnabled && (
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-sm">Loading more ideas...</span>
              </div>
            )}
            {!hasMore && ideas.length > 0 && !loading && (
              <p className="text-sm text-zinc-600">All {totalCount} ideas loaded</p>
            )}
          </div>
        )}
      </div>

      {/* Floating Compare Bar */}
      {compareIds.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-2xl border border-indigo-500/30 bg-zinc-900/95 px-6 py-3 shadow-2xl backdrop-blur-sm">
            <span className="text-sm text-zinc-300">
              {compareIds.size} ideas selected
            </span>
            <button
              onClick={goToCompare}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Compare {compareIds.size} Ideas
            </button>
            <button
              onClick={() => setCompareIds(new Set())}
              className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Clear selection"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Ecosystem Footer */}
      <EcosystemFooter />
    </main>
  );
}
