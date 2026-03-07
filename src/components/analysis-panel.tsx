"use client";

import { useState } from "react";

interface Analysis {
  id: string;
  marketAnalysis: string;
  competitors: string;
  revenueProjection: string;
  implementationPlan: string;
  swotAnalysis: string;
  score: number;
  createdAt: string;
}

export function AnalysisPanel({
  ideaId,
  existingAnalysis,
  isAuthenticated,
}: {
  ideaId: number;
  existingAnalysis: Analysis | null;
  isAuthenticated: boolean;
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(existingAnalysis);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("market");
  const [error, setError] = useState("");

  async function runAnalysis() {
    if (!isAuthenticated) {
      setError("Sign in to generate AI analysis");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ideas/${ideaId}/analyze`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }
      const data = await res.json();
      setAnalysis(data);
      setActiveTab("market");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { key: "market", label: "Market Analysis" },
    { key: "competitors", label: "Competitors" },
    { key: "revenue", label: "Revenue Projection" },
    { key: "plan", label: "Implementation Plan" },
    { key: "swot", label: "SWOT" },
  ];

  const tabContent: Record<string, string> = analysis
    ? {
        market: analysis.marketAnalysis,
        competitors: analysis.competitors,
        revenue: analysis.revenueProjection,
        plan: analysis.implementationPlan,
        swot: analysis.swotAnalysis,
      }
    : {};

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">AI Deep Analysis</h2>
          {analysis && (
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
              Viability Score: {analysis.score}/100
            </span>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Analyzing...
            </span>
          ) : analysis ? (
            "Re-analyze"
          ) : (
            "Generate Analysis"
          )}
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-500/10 text-red-400 text-sm">{error}</div>
      )}

      {analysis ? (
        <>
          <div className="flex border-b border-zinc-800 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-b-2 border-indigo-500 text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-zinc-300 leading-relaxed">
              {tabContent[activeTab]}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-zinc-500">
          <p className="mb-2">No analysis yet.</p>
          <p className="text-sm">
            {isAuthenticated
              ? 'Click "Generate Analysis" to get a deep AI-powered market analysis, competitor check, revenue projections, and implementation plan.'
              : "Sign in to generate AI analysis for this idea."}
          </p>
        </div>
      )}
    </div>
  );
}
