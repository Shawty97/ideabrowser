const STEPS = [
  {
    number: "01",
    title: "Browse Curated Ideas",
    description:
      "Explore a growing collection of startup ideas across SaaS, marketplace, AI/ML, fintech, and more. Filter by category, sort by votes, or use AI-powered semantic search.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
    accent: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
  },
  {
    number: "02",
    title: "Get AI Deep Analysis",
    description:
      "Request an AI-powered analysis covering market size, competitors, revenue projections, implementation plan, and SWOT — all generated in seconds.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  {
    number: "03",
    title: "Build with Business OS",
    description:
      "Found your idea? One click sends it to Business OS, which generates a complete business blueprint with GTM strategy, pricing, and tech stack in 90 seconds.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    ),
    accent: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="text-zinc-400">
            From discovery to execution in three simple steps
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${step.accent}`}
              >
                {step.icon}
              </div>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-600">
                Step {step.number}
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
