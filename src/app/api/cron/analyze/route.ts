import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAnalysis } from "@/lib/ai";

// GET /api/cron/analyze — nightly batch analysis of unanalyzed ideas
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ideasWithoutAnalysis = await prisma.idea.findMany({
    where: {
      analyses: { none: {} },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  if (ideasWithoutAnalysis.length === 0) {
    return NextResponse.json({ success: true, analyzed: 0, message: "No ideas need analysis" });
  }

  const results = [];
  for (const idea of ideasWithoutAnalysis) {
    try {
      const analysis = await generateAnalysis({
        name: idea.name,
        tagline: idea.tagline,
        description: idea.description,
        category: idea.category,
        targetMarket: idea.targetMarket,
        tam: idea.tam,
        pricing: idea.pricing,
        stack: idea.stack,
        revenueModel: idea.revenueModel,
        tags: idea.tags,
      });

      await prisma.analysis.create({
        data: {
          ideaId: idea.id,
          marketAnalysis: analysis.marketAnalysis,
          competitors: analysis.competitors,
          revenueProjection: analysis.revenueProjection,
          implementationPlan: analysis.implementationPlan,
          swotAnalysis: analysis.swotAnalysis,
          score: analysis.score,
          model: "claude",
        },
      });

      results.push({ id: idea.id, name: idea.name, score: analysis.score });
    } catch (err) {
      results.push({
        id: idea.id,
        name: idea.name,
        error: err instanceof Error ? err.message : "Analysis failed",
      });
    }
  }

  return NextResponse.json({ success: true, analyzed: results.length, results });
}
