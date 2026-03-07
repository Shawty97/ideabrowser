"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

export function CommentSection({
  ideaId,
  isAuthenticated,
}: {
  ideaId: number;
  isAuthenticated: boolean;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/ideas/${ideaId}/comments`)
      .then((r) => r.json())
      .then(setComments)
      .catch(() => {});
  }, [ideaId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-lg font-bold text-white">
        Discussion ({comments.length})
      </h3>

      {isAuthenticated && (
        <form onSubmit={submitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this idea..."
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors resize-none"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No comments yet. {isAuthenticated ? "Be the first to share your thoughts!" : "Sign in to comment."}
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                {comment.user.image && (
                  <img src={comment.user.image} alt="" className="h-6 w-6 rounded-full" />
                )}
                <span className="text-sm font-medium text-zinc-300">
                  {comment.user.name || "Anonymous"}
                </span>
                <span className="text-xs text-zinc-600">
                  {new Date(comment.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
