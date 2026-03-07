import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/ideas/[id]/vote — toggle vote
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

  const existing = await prisma.vote.findUnique({
    where: { ideaId_userId: { ideaId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await prisma.vote.create({
    data: { ideaId, userId: session.user.id, value: 1 },
  });

  const count = await prisma.vote.aggregate({
    where: { ideaId },
    _sum: { value: true },
  });

  return NextResponse.json({ voted: true, count: count._sum.value || 0 });
}
