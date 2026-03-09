import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

let _groq: OpenAI | null = null;
function getGroq(): OpenAI {
  if (!_groq) {
    _groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || "",
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return _groq;
}

interface SemanticMatch {
  id: number;
  relevance: number;
  reason: string;
}

// GET /api/ideas/search?q=... — semantic AI search (auth required to prevent cost abuse)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use AI Search" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get("q");

  if (!rawQuery || rawQuery.trim().length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Truncate to prevent token abuse and reduce prompt injection surface
  const query = rawQuery.trim().slice(0, 500);

  // Fetch all ideas with minimal fields for context
  const ideas = await prisma.idea.findMany({
    select: {
      id: true,
      name: true,
      tagline: true,
      description: true,
      category: true,
      tags: true,
      targetMarket: true,
      pricing: true,
      tam: true,
    },
  });

  if (ideas.length === 0) {
    return NextResponse.json({ ideas: [], query });
  }

  // Build compact representation for Claude
  const ideaSummaries = ideas.map((idea) =>
    `[ID:${idea.id}] ${idea.name} — ${idea.tagline} | Category: ${idea.category} | Tags: ${idea.tags.join(", ")} | Market: ${idea.targetMarket} | Pricing: ${idea.pricing} | TAM: ${idea.tam} | Desc: ${idea.description.slice(0, 200)}`
  ).join("\n");

  const prompt = `Du bist ein semantischer Such-Algorithmus für Geschäftsideen.

ALLE VERFÜGBAREN IDEEN:
${ideaSummaries}

---
AUFGABE: Finde die TOP 10 relevantesten Ideen für folgende Suchanfrage.
Bewerte semantische Relevanz, nicht nur Keywords.
Berücksichtige: Branche, Zielgruppe, Geschäftsmodell, Technologie, Problembereich.

Antworte NUR mit einem JSON-Array in diesem Format (keine Erklärungen, kein Markdown):
[{"id": 1, "relevance": 95, "reason": "Kurzer Grund auf Deutsch"}, ...]

relevance: 0-100, sortiert nach Relevanz absteigend.
Nur IDs aus der obigen Liste verwenden. Maximal 10 Ergebnisse. Minimum relevance: 20.

SUCHANFRAGE: "${query}"`;

  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1500,
      messages: [
        { role: "system", content: "Du bist ein semantischer Such-Algorithmus." },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    let matches: SemanticMatch[];
    try {
      matches = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ ideas: [], query, error: "AI parse error" });
      }
    }

    // Validate and filter matches
    const validIds = new Set(ideas.map((i) => i.id));
    const validMatches = matches
      .filter((m) => validIds.has(m.id) && m.relevance >= 20)
      .slice(0, 10);

    // Fetch full idea data for matched IDs
    const matchedIds = validMatches.map((m) => m.id);
    const fullIdeas = await prisma.idea.findMany({
      where: { id: { in: matchedIds } },
      include: {
        votes: { select: { value: true } },
        analyses: { select: { score: true }, orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { comments: true, analyses: true } },
      },
    });

    // Map to response format with relevance data
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    const resultMap = new Map(
      fullIdeas.map((idea) => {
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

        return [
          idea.id,
          {
            ...idea,
            voteCount,
            commentCount,
            hasAnalysis: idea._count.analyses > 0,
            analysisScore,
            compositeScore: Math.round(compositeScore * 100) / 100,
            votes: undefined,
            analyses: undefined,
            _count: undefined,
          },
        ] as const;
      })
    );

    // Preserve relevance ordering
    const sortedResults = validMatches
      .map((match) => {
        const idea = resultMap.get(match.id);
        if (!idea) return null;
        return {
          ...idea,
          relevance: match.relevance,
          matchReason: match.reason,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ideas: sortedResults, query });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: "AI search failed", ideas: [], query },
      { status: 500 }
    );
  }
}
