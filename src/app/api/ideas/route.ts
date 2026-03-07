import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/ideas — list all ideas with vote counts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: any = {};
  if (category && category !== "all") where.category = category;
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tagline: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search.toLowerCase()] } },
    ];
  }

  const ideas = await prisma.idea.findMany({
    where,
    include: {
      votes: { select: { value: true } },
      _count: { select: { comments: true, analyses: true } },
    },
    orderBy: { id: "asc" },
  });

  const result = ideas.map((idea) => ({
    ...idea,
    voteCount: idea.votes.reduce((sum, v) => sum + v.value, 0),
    commentCount: idea._count.comments,
    hasAnalysis: idea._count.analyses > 0,
    votes: undefined,
    _count: undefined,
  }));

  return NextResponse.json(result);
}

// POST /api/ideas — submit a new idea (authenticated)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, tagline, description, category, targetMarket, tam, pricing, stack, effort, revenueModel, tags } = body;

  if (!name || !tagline || !description || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = await prisma.idea.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Idea with this name already exists" }, { status: 409 });
  }

  const idea = await prisma.idea.create({
    data: {
      name,
      slug,
      tagline,
      description,
      category,
      status: "brainstorm",
      targetMarket: targetMarket || "",
      tam: tam || "",
      pricing: pricing || "",
      stack: stack || [],
      effort: effort || "1-month",
      revenueModel: revenueModel || "",
      tags: tags || [],
      submittedBy: session.user.id,
    },
  });

  return NextResponse.json(idea, { status: 201 });
}
