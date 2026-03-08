import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateIdeas } from "@/lib/ai";

const MARKETS = [
  "DACH SaaS",
  "AI Tools Global",
  "FinTech Europe",
  "HealthTech",
  "EdTech",
  "MarTech",
  "LegalTech",
  "PropTech",
];

// GET /api/cron/generate — weekly auto-generation of 10-20 ideas
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = Math.floor(Math.random() * 11) + 10; // 10-20
  const market = MARKETS[Math.floor(Math.random() * MARKETS.length)];

  const existingIdeas = await prisma.idea.findMany({ select: { slug: true } });
  const existingSlugs = existingIdeas.map((i) => i.slug);

  const generated = await generateIdeas({
    market,
    count,
    existingSlugs,
  });

  const savedIdeas = [];
  for (const idea of generated) {
    let slug = idea.slug;
    let suffix = 2;
    while (existingSlugs.includes(slug)) {
      slug = `${idea.slug}-${suffix}`;
      suffix++;
    }
    existingSlugs.push(slug);

    const saved = await prisma.idea.create({
      data: {
        name: idea.name,
        slug,
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
        aiGenerated: true,
      },
    });
    savedIdeas.push(saved);
  }

  await prisma.generationRun.create({
    data: {
      market,
      count,
      ideasGenerated: savedIdeas.length,
    },
  });

  return NextResponse.json({
    success: true,
    market,
    generated: savedIdeas.length,
  });
}
