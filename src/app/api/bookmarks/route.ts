import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/bookmarks — toggle bookmark (add if not exists, remove if exists)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ideaId } = body as { ideaId: number };

  if (!ideaId || typeof ideaId !== "number") {
    return NextResponse.json({ error: "ideaId (number) is required" }, { status: 400 });
  }

  // Check if idea exists
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  // Check if already bookmarked
  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_ideaId: {
        userId: session.user.id,
        ideaId,
      },
    },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ bookmarked: false, ideaId });
  } else {
    try {
      await prisma.bookmark.create({
        data: {
          userId: session.user.id,
          ideaId,
        },
      });
      return NextResponse.json({ bookmarked: true, ideaId });
    } catch (error) {
      // Handle race condition: another request already created the bookmark
      if (error instanceof Error && error.message.includes("P2002")) {
        return NextResponse.json({ bookmarked: true, ideaId });
      }
      throw error;
    }
  }
}

// GET /api/bookmarks — list user's bookmarked ideas
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      idea: {
        include: {
          votes: { select: { value: true } },
          analyses: { select: { score: true }, orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { comments: true, analyses: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

  const ideas = bookmarks.map((bookmark) => {
    const idea = bookmark.idea;
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
      bookmarkedAt: bookmark.createdAt,
      votes: undefined,
      analyses: undefined,
      _count: undefined,
    };
  });

  return NextResponse.json({ ideas });
}
