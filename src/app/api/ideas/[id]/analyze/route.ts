import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateAnalysis } from "@/lib/ai";

// POST /api/ideas/[id]/analyze — generate AI analysis for an idea
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

  // Check if analysis already exists for this user
  const existing = await prisma.analysis.findFirst({
    where: { ideaId, requestedBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Return cached analysis if less than 24h old
  if (existing && Date.now() - existing.createdAt.getTime() < 86400000) {
    return NextResponse.json(existing);
  }

  const result = await generateAnalysis(idea);

  const analysis = await prisma.analysis.create({
    data: {
      ideaId,
      requestedBy: session.user.id,
      ...result,
      model: "claude-sonnet-4.6",
    },
  });

  return NextResponse.json(analysis);
}

// GET /api/ideas/[id]/analyze — get existing analyses
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ideaId = parseInt(id, 10);
  if (isNaN(ideaId)) {
    return NextResponse.json({ error: "Invalid idea ID" }, { status: 400 });
  }

  const analyses = await prisma.analysis.findMany({
    where: { ideaId },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(analyses[0] || null);
}
