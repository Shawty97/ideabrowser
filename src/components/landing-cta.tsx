import Link from "next/link";

export function LandingCta() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-10 text-center sm:p-14">
          {/* Gradient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[200px] w-[400px] rounded-full bg-indigo-600/15 blur-[80px]" />
          </div>

          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to find your next idea?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-zinc-400">
              Sign in to unlock AI-powered analysis, vote on your favorites,
              bookmark ideas, and submit your own startup concepts.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-indigo-500 hover:to-emerald-500 hover:shadow-indigo-500/30"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Get Started Free
              </Link>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-8 py-3.5 text-base font-semibold text-zinc-200 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                Generate Custom Ideas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
