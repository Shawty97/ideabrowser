import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  try {
    const [totalIdeas, totalAnalyses, totalVotes, totalUsers] =
      await Promise.all([
        prisma.idea.count(),
        prisma.analysis.count(),
        prisma.vote.count(),
        prisma.user.count(),
      ]);

    return NextResponse.json({
      totalIdeas,
      totalAnalyses,
      totalVotes,
      totalUsers: Math.floor(totalUsers / 10) * 10,
    });
  } catch {
    return NextResponse.json(
      { totalIdeas: 0, totalAnalyses: 0, totalVotes: 0, totalUsers: 0 },
      { status: 500 }
    );
  }
}
