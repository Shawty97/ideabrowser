import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CATEGORIES, STATUS_CONFIG, type Category, type Status } from "@/lib/ideas";
import { AnalysisPanel } from "@/components/analysis-panel";
import { VoteButton } from "@/components/vote-button";
import { CommentSection } from "@/components/comment-section";
import { EcosystemFooter } from "@/components/ecosystem-footer";
import { auth } from "@/lib/auth";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await prisma.idea.findUnique({ where: { slug } });
  return {
    title: idea ? `${idea.name} — IdeaBrowser` : "IdeaBrowser",
    description: idea?.tagline,
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const idea = await prisma.idea.findUnique({
    where: { slug },
    include: {
      votes: { select: { value: true, userId: true } },
      _count: { select: { comments: true } },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!idea) notFound();

  const cat = CATEGORIES[idea.category as Category] || { label: idea.category, color: "#6366f1" };
  const status = STATUS_CONFIG[idea.status as Status] || { label: idea.status, color: "#94a3b8", emoji: "?" };
  const voteCount = idea.votes.reduce((sum, v) => sum + v.value, 0);
  const userVoted = session?.user?.id ? idea.votes.some((v) => v.userId === session.user!.id) : false;
  const latestAnalysis = idea.analyses[0] || null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
          {latestAnalysis && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
              Score: {latestAnalysis.score}/100
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-4xl font-black text-white">{idea.name}</h1>
            <p className="text-xl text-indigo-400">{idea.tagline}</p>
          </div>
          <VoteButton ideaId={idea.id} voteCount={voteCount} userVoted={userVoted} />
        </div>
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

      {/* Details Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {idea.stack.map((tech) => (
              <span key={tech} className="rounded-lg bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Revenue Model</h3>
          <p className="text-zinc-300">{idea.revenueModel}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold uppercase text-zinc-500">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <AnalysisPanel
        ideaId={idea.id}
        existingAnalysis={latestAnalysis ? { ...latestAnalysis, createdAt: latestAnalysis.createdAt.toISOString() } : null}
        isAuthenticated={!!session?.user}
      />

      {/* Comments */}
      <CommentSection ideaId={idea.id} isAuthenticated={!!session?.user} />

      {/* CTA — Build with BOS */}
      <div className="mt-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-8 text-center">
        <h3 className="mb-2 text-xl font-bold text-white">Want to build this?</h3>
        <p className="mb-4 text-zinc-400">
          Use Business OS to generate your complete business blueprint in 90 seconds.
        </p>
        <a
          href={`https://business-os-v2-mu.vercel.app?idea=${encodeURIComponent(idea.name)}&tagline=${encodeURIComponent(idea.tagline)}&market=${encodeURIComponent(idea.targetMarket)}&pricing=${encodeURIComponent(idea.pricing)}&category=${encodeURIComponent(idea.category)}&stack=${encodeURIComponent(idea.stack.join(","))}&revenue=${encodeURIComponent(idea.revenueModel)}&source=ideabrowser`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Start Building with Business OS &rarr;
        </a>
      </div>

      {/* Ecosystem Footer */}
      <EcosystemFooter />
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
