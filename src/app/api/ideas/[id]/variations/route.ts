import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateVariations } from "@/lib/ai";

// POST /api/ideas/[id]/variations — generate variations of an existing idea
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ideaId = parseInt(id, 10);
  if (isNaN(ideaId)) {
    return NextResponse.json({ error: "Invalid idea ID" }, { status: 400 });
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const variations = await generateVariations(idea);

  // Get existing slugs
  const existingIdeas = await prisma.idea.findMany({ select: { slug: true } });
  const existingSlugs = existingIdeas.map((i) => i.slug);

  const savedVariations = [];
  for (const variation of variations) {
    let slug = variation.slug;
    let suffix = 2;
    while (existingSlugs.includes(slug)) {
      slug = `${variation.slug}-${suffix}`;
      suffix++;
    }
    existingSlugs.push(slug);

    const saved = await prisma.idea.create({
      data: {
        name: variation.name,
        slug,
        tagline: variation.tagline,
        description: variation.description,
        category: variation.category,
        status: variation.status,
        targetMarket: variation.targetMarket,
        tam: variation.tam,
        pricing: variation.pricing,
        stack: variation.stack,
        effort: variation.effort,
        revenueModel: variation.revenueModel,
        tags: variation.tags,
        aiGenerated: true,
        parentId: ideaId,
        submittedBy: session.user.id,
      },
    });
    savedVariations.push(saved);
  }

  return NextResponse.json(
    savedVariations.map((v) => ({
      ...v,
      voteCount: 0,
      commentCount: 0,
      hasAnalysis: false,
    })),
    { status: 201 }
  );
}
