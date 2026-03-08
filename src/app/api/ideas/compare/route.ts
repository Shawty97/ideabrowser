import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ideas/compare?ids=1,2,3 — returns full idea data for given IDs (max 3)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const ids = [...new Set(
    idsParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
  )];

  if (ids.length < 2 || ids.length > 3) {
    return NextResponse.json(
      { error: "Provide 2 or 3 valid idea IDs" },
      { status: 400 }
    );
  }

  const ideas = await prisma.idea.findMany({
    where: { id: { in: ids } },
    include: {
      votes: { select: { value: true } },
      analyses: {
        select: { score: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { comments: true } },
    },
  });

  const result = ideas.map((idea) => {
    const voteCount = idea.votes.reduce((sum, v) => sum + v.value, 0);
    const analysisScore = idea.analyses[0]?.score ?? null;

    return {
      id: idea.id,
      name: idea.name,
      slug: idea.slug,
      tagline: idea.tagline,
      description: idea.description,
      category: idea.category,
      status: idea.status,
      targetMarket: idea.targetMarket,
      tam: idea.tam,
      pricing: idea.pricing,
      stack: idea.stack,
      effort: idea.effort,
      revenueModel: idea.revenueModel,
      tags: idea.tags,
      voteCount,
      commentCount: idea._count.comments,
      analysisScore,
    };
  });

  // Preserve the order requested by the user
  const ordered = ids
    .map((id) => result.find((r) => r.id === id))
    .filter(Boolean);

  return NextResponse.json({ ideas: ordered });
}
