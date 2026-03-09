"use client";

import { useEffect, useState } from "react";

interface StatsData {
  totalIdeas: number;
  totalAnalyses: number;
  totalVotes: number;
  totalUsers: number;
}

function AnimatedNumber({ value, label, color }: { value: number; label: string; color: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplay(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className={`text-4xl font-black tabular-nums sm:text-5xl ${color}`}>
        {display.toLocaleString()}
      </div>
      <div className="mt-1 text-sm font-medium text-zinc-500">{label}</div>
    </div>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => { if (!r.ok) throw new Error("stats fetch failed"); return r.json(); })
      .then((data: StatsData) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  if (!stats) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 sm:p-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <AnimatedNumber
              value={stats.totalIdeas}
              label="Startup Ideas"
              color="text-white"
            />
            <AnimatedNumber
              value={stats.totalAnalyses}
              label="AI Analyses"
              color="text-indigo-400"
            />
            <AnimatedNumber
              value={stats.totalVotes}
              label="Community Votes"
              color="text-emerald-400"
            />
            <AnimatedNumber
              value={stats.totalUsers}
              label="Active Members"
              color="text-amber-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
