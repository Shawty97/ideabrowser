"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function VoteButton({
  ideaId,
  voteCount: initialCount,
  userVoted: initialVoted,
}: {
  ideaId: number;
  voteCount: number;
  userVoted: boolean;
}) {
  const { data: session } = useSession();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggleVote() {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/vote`, { method: "POST" });
      const data = await res.json();
      setVoted(data.voted);
      if (data.voted) {
        setCount((c) => c + 1);
      } else {
        setCount((c) => c - 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleVote}
      disabled={loading || !session?.user}
      className={`flex flex-col items-center rounded-xl border px-4 py-3 transition-colors ${
        voted
          ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
      } ${!session?.user ? "opacity-50 cursor-default" : ""}`}
      title={session?.user ? (voted ? "Remove vote" : "Upvote") : "Sign in to vote"}
    >
      <svg className="h-5 w-5" fill={voted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
      <span className="text-sm font-bold">{count}</span>
    </button>
  );
}
