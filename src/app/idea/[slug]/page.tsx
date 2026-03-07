import { IDEAS, CATEGORIES, STATUS_CONFIG } from "@/lib/ideas";
import { notFound } from "next/navigation";
import Link from "next/link";

export function generateStaticParams() {
  return IDEAS.map((idea) => ({ slug: idea.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  // Next.js 15: params is a Promise in generateMetadata for static pages,
  // but generateStaticParams ensures all slugs exist.
  // We handle this synchronously for metadata.
  return {
    title: "IdeaBrowser — A-Impact",
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = IDEAS.find((i) => i.slug === slug);
  if (!idea) notFound();

  const cat = CATEGORIES[idea.category];
  const status = STATUS_CONFIG[idea.status];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
      >
        &larr; Back to all ideas
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: cat.color + "20", color: cat.color }}
          >
            {cat.label}
          </span>
          <span className="flex items-center gap-1 text-sm" style={{ color: status.color }}>
            {status.emoji} {status.label}
          </span>
          <span className="text-xs text-zinc-600">#{idea.id}</span>
        </div>
        <h1 className="mb-2 text-4xl font-black text-white">{idea.name}</h1>
        <p className="text-xl text-indigo-400">{idea.tagline}</p>
      </div>

      {/* Description */}
      <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-300 leading-relaxed">{idea.description}</p>
      </div>

      {/* Key Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Target Market" value={idea.targetMarket} />
        <MetricCard label="TAM" value={idea.tam} />
        <MetricCard label="Pricing" value={idea.pricing} />
        <MetricCard label="Build Effort" value={idea.effort} />
      </div>

      {/* Details */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {idea.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-lg bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">
            Revenue Model
          </h3>
          <p className="text-zinc-300">{idea.revenueModel}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-8 text-center">
        <h3 className="mb-2 text-xl font-bold text-white">
          Want to build this?
        </h3>
        <p className="mb-4 text-zinc-400">
          Use Business OS to generate your complete business blueprint in 90
          seconds.
        </p>
        <a
          href="https://business-os-v2-mu.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Start Building with Business OS &rarr;
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-600">
        <a href="https://a-impact.io" className="text-indigo-500 hover:underline">
          A-Impact
        </a>{" "}
        — AI Departments as a Service
      </footer>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-zinc-200">{value}</div>
    </div>
  );
}
