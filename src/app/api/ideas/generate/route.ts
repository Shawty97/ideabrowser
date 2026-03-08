import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateIdeas } from "@/lib/ai";

// Simple IP-based rate limiting for guests
const guestUsage = new Map<string, { count: number; resetAt: number }>();

function getGuestAllowed(ip: string): boolean {
  const now = Date.now();
  const entry = guestUsage.get(ip);
  if (!entry || now > entry.resetAt) {
    guestUsage.set(ip, { count: 1, resetAt: now + 86400000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

// POST /api/ideas/generate — generate new AI business ideas
export async function POST(req: NextRequest) {
  const session = await auth();
  const isGuest = !session?.user?.id;

  if (isGuest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!getGuestAllowed(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Sign in for unlimited generations." },
        { status: 429 }
      );
    }
  }

  const body = await req.json();
  const { market, niche, audience, budget, category, count } = body;

  if (!market) {
    return NextResponse.json({ error: "Market/Nische is required" }, { status: 400 });
  }

  const clampedCount = Math.min(50, Math.max(1, Number(count) || 5));

  // Get existing slugs for dedup
  const existingIdeas = await prisma.idea.findMany({ select: { slug: true } });
  const existingSlugs = existingIdeas.map((i) => i.slug);

  const generated = await generateIdeas({
    market,
    niche,
    audience,
    budget,
    category,
    count: clampedCount,
    existingSlugs,
  });

  // Save to DB
  const savedIdeas = [];
  for (const idea of generated) {
    // Ensure unique slug
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
        submittedBy: session?.user?.id || null,
      },
    });
    savedIdeas.push(saved);
  }

  // Create GenerationRun record
  await prisma.generationRun.create({
    data: {
      userId: session?.user?.id || null,
      market,
      niche,
      audience,
      category,
      count: clampedCount,
      ideasGenerated: savedIdeas.length,
    },
  });

  return NextResponse.json(
    savedIdeas.map((idea) => ({
      ...idea,
      voteCount: 0,
      commentCount: 0,
      hasAnalysis: false,
    })),
    { status: 201 }
  );
}
