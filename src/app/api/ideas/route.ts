import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/ideas — list ideas with vote counts, sorting, and pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "new";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Get total count for pagination metadata
  const total = await prisma.idea.count({ where });

  // For "new" sort, use DB-level pagination for performance
  const useDbPagination = sort === "new";
  const ideas = await prisma.idea.findMany({
    where,
    include: {
      votes: { select: { value: true } },
      analyses: { select: { score: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { comments: true, analyses: true } },
    },
    orderBy: sort === "new" ? { createdAt: "desc" } : { id: "asc" },
    ...(useDbPagination && { skip: (page - 1) * limit, take: limit }),
  });

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  const result = ideas.map((idea) => {
    const voteCount = idea.votes.reduce((sum, v) => sum + v.value, 0);
    const commentCount = idea._count.comments;
    const analysisScore = idea.analyses[0]?.score ?? 0;
    const ageMs = now - idea.createdAt.getTime();
    const recency = Math.max(0, 1 - ageMs / oneWeekMs);
    const compositeScore =
      analysisScore * 0.4 +
      voteCount * 0.3 * 10 +
      recency * 0.2 * 100 +
      commentCount * 0.1 * 10;

    return {
      ...idea,
      voteCount,
      commentCount,
      hasAnalysis: idea._count.analyses > 0,
      analysisScore,
      compositeScore: Math.round(compositeScore * 100) / 100,
      votes: undefined,
      analyses: undefined,
      _count: undefined,
    };
  });

  // Apply sorting
  switch (sort) {
    case "hot":
      result.sort((a, b) => b.compositeScore - a.compositeScore);
      break;
    case "voted":
      result.sort((a, b) => b.voteCount - a.voteCount);
      break;
    case "score":
      result.sort((a, b) => b.analysisScore - a.analysisScore);
      break;
    case "new":
    default:
      break;
  }

  // Apply pagination after sorting (skip for "new" — already paginated via DB)
  const totalPages = Math.ceil(total / limit);
  const paginatedIdeas = useDbPagination
    ? result
    : result.slice((page - 1) * limit, (page - 1) * limit + limit);
  const hasMore = page < totalPages;

  return NextResponse.json({
    ideas: paginatedIdeas,
    total,
    page,
    totalPages,
    hasMore,
  });
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
