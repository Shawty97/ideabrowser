"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user?.image && (
        <img
          src={session.user.image}
          alt=""
          className="h-8 w-8 rounded-full border border-zinc-700"
        />
      )}
      <span className="text-sm text-zinc-300">{session.user?.name}</span>
      <button
        onClick={() => signOut()}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
