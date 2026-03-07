import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface IdeaInput {
  name: string;
  tagline: string;
  description: string;
  category: string;
  targetMarket: string;
  tam: string;
  pricing: string;
  stack: string[];
  revenueModel: string;
  tags: string[];
}

export interface AnalysisResult {
  marketAnalysis: string;
  competitors: string;
  revenueProjection: string;
  implementationPlan: string;
  swotAnalysis: string;
  score: number;
}

export async function generateAnalysis(idea: IdeaInput): Promise<AnalysisResult> {
  const prompt = `Du bist ein erfahrener Business-Analyst und Venture-Stratege. Analysiere diese Geschäftsidee tiefgreifend.

**Idee:** ${idea.name}
**Tagline:** ${idea.tagline}
**Beschreibung:** ${idea.description}
**Kategorie:** ${idea.category}
**Zielmarkt:** ${idea.targetMarket}
**TAM:** ${idea.tam}
**Pricing:** ${idea.pricing}
**Tech Stack:** ${idea.stack.join(", ")}
**Revenue Model:** ${idea.revenueModel}
**Tags:** ${idea.tags.join(", ")}

Erstelle eine TIEFE Analyse in exakt diesem JSON-Format (auf Deutsch, alle Felder als Strings):

{
  "marketAnalysis": "Detaillierte Marktanalyse: Marktgröße, Wachstumsraten, Timing, regulatorische Faktoren, Markteintrittsbarrieren, 3-5 spezifische Datenpunkte mit Quellen",
  "competitors": "Top 5-8 direkte und indirekte Wettbewerber mit ihren Stärken, Schwächen, Pricing und Marktanteil. Wo ist die Lücke die diese Idee füllt?",
  "revenueProjection": "12-Monats Revenue Forecast: Month 1-3 (Launch), Month 4-6 (Growth), Month 7-12 (Scale). Konkrete Zahlen basierend auf dem Pricing-Model und realistischen Conversion Rates (1-3% trial-to-paid).",
  "implementationPlan": "8-Wochen Sprint Plan: Woche 1-2 (MVP), Woche 3-4 (Beta), Woche 5-6 (Launch), Woche 7-8 (Iterate). Konkrete Deliverables, Tech-Entscheidungen, Team-Anforderungen.",
  "swotAnalysis": "SWOT Matrix: 3-4 Punkte pro Quadrant (Strengths, Weaknesses, Opportunities, Threats). Spezifisch auf DACH-Markt und A-Impact Kontext bezogen.",
  "score": 75
}

Der Score (0-100) bewertet die Gesamtviabilität: Marktpotenzial (30%), Umsetzbarkeit (25%), Wettbewerbsvorteil (25%), Revenue Potential (20%).

WICHTIG: Antworte NUR mit dem JSON-Objekt, kein Markdown, keine Erklärungen.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return {
      marketAnalysis: parsed.marketAnalysis,
      competitors: parsed.competitors,
      revenueProjection: parsed.revenueProjection,
      implementationPlan: parsed.implementationPlan,
      swotAnalysis: parsed.swotAnalysis,
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
    };
  } catch {
    // If JSON parsing fails, try to extract from potential markdown code block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        marketAnalysis: parsed.marketAnalysis || "",
        competitors: parsed.competitors || "",
        revenueProjection: parsed.revenueProjection || "",
        implementationPlan: parsed.implementationPlan || "",
        swotAnalysis: parsed.swotAnalysis || "",
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      };
    }
    throw new Error("Failed to parse AI analysis response");
  }
}
