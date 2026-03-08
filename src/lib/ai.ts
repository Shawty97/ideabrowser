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

// --- Idea Generation Types ---

export interface GenerateIdeasInput {
  market: string;
  niche?: string;
  audience?: string;
  budget?: string;
  category?: string;
  count: number;
  existingSlugs: string[];
}

export interface GeneratedIdea {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  status: string;
  targetMarket: string;
  tam: string;
  pricing: string;
  stack: string[];
  effort: string;
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

function parseJsonFromResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    throw new Error("Failed to parse JSON from AI response");
  }
}

export async function generateIdeas(input: GenerateIdeasInput): Promise<GeneratedIdea[]> {
  const categoryConstraint = input.category && input.category !== "all"
    ? `Generate ideas ONLY in the "${input.category}" category.`
    : `Use a mix of these categories: ai-departments, saas, marketplace, agency, content, vertical, consumer, infrastructure, moonshot.`;

  const budgetHint = input.budget
    ? `Budget context: ${input.budget}. Tailor pricing and effort accordingly.`
    : "";

  const prompt = `Du bist ein erfahrener Startup-Stratege und Business-Ideengenerator.

Generiere exakt ${input.count} einzigartige, umsetzbare Geschäftsideen basierend auf diesen Parametern:

**Markt/Nische:** ${input.market}
${input.niche ? `**Spezifische Nische:** ${input.niche}` : ""}
${input.audience ? `**Zielgruppe:** ${input.audience}` : ""}
${budgetHint}
${categoryConstraint}

**WICHTIG — Diese Slugs existieren bereits, verwende sie NICHT:** ${input.existingSlugs.slice(0, 100).join(", ")}

Jede Idee MUSS diese Felder haben:
- name: Einzigartiger, einprägsamer Produktname
- slug: Aus dem Namen generiert (lowercase, Bindestriche, keine Sonderzeichen)
- tagline: Ein Satz, max 80 Zeichen, der sofort den Wert kommuniziert
- description: Mindestens 100 Wörter. Konkreter Use Case, Marktchance, Differenzierung, warum JETZT
- category: Einer von: ai-departments, saas, marketplace, agency, content, vertical, consumer, infrastructure, moonshot
- status: "brainstorm"
- targetMarket: Zielmarkt mit Größenordnung
- tam: Total Addressable Market mit konkreter Zahl
- pricing: Konkretes Pricing-Modell mit Zahlen
- stack: Array mit 3-5 relevanten Technologien
- effort: Einer von: 1-week, 2-weeks, 1-month, 3-months, 6-months, 1-year
- revenueModel: Wie wird Geld verdient
- tags: Array mit 3-6 relevanten Tags (lowercase)

Fokus auf DACH-Markt UND globale Chancen. Ideen müssen realistisch, differenziert und sofort umsetzbar sein.

Antworte NUR mit einem JSON-Array, kein Markdown, keine Erklärungen:
[{ "name": "...", ... }, ...]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseJsonFromResponse(text) as GeneratedIdea[];

  return parsed.map((idea) => ({
    name: idea.name || "Unnamed Idea",
    slug: (idea.slug || idea.name || "idea")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    tagline: idea.tagline || "",
    description: idea.description || "",
    category: idea.category || "saas",
    status: "brainstorm",
    targetMarket: idea.targetMarket || "",
    tam: idea.tam || "",
    pricing: idea.pricing || "",
    stack: Array.isArray(idea.stack) ? idea.stack : [],
    effort: idea.effort || "1-month",
    revenueModel: idea.revenueModel || "",
    tags: Array.isArray(idea.tags) ? idea.tags : [],
  }));
}

export async function generateVariations(idea: IdeaInput): Promise<GeneratedIdea[]> {
  const prompt = `Du bist ein Startup-Stratege. Basierend auf dieser Geschäftsidee, generiere 3-5 VARIATIONEN:

**Original-Idee:**
- Name: ${idea.name}
- Tagline: ${idea.tagline}
- Beschreibung: ${idea.description}
- Kategorie: ${idea.category}
- Zielmarkt: ${idea.targetMarket}
- Pricing: ${idea.pricing}
- Tech Stack: ${idea.stack.join(", ")}

Variationen können sein:
1. Anderer Zielmarkt (z.B. DACH → Global, B2B → B2C)
2. Anderes Pricing-Modell (z.B. SaaS → Marketplace → Pay-per-use)
3. Anderer Tech-Ansatz (z.B. Voice statt Text, Mobile statt Web)
4. Nischen-Version (z.B. nur für Ärzte, nur für Anwälte)
5. Enterprise-Version oder Consumer-Version

Jede Variation muss ein VOLLSTÄNDIGES Ideen-Objekt sein mit:
name, slug, tagline, description (100+ Wörter), category, status ("brainstorm"), targetMarket, tam, pricing, stack, effort, revenueModel, tags

Antworte NUR mit einem JSON-Array:
[{ "name": "...", ... }, ...]`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 6000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseJsonFromResponse(text) as GeneratedIdea[];

  return parsed.map((v) => ({
    name: v.name || "Variation",
    slug: (v.slug || v.name || "variation")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    tagline: v.tagline || "",
    description: v.description || "",
    category: v.category || idea.category,
    status: "brainstorm",
    targetMarket: v.targetMarket || "",
    tam: v.tam || "",
    pricing: v.pricing || "",
    stack: Array.isArray(v.stack) ? v.stack : [],
    effort: v.effort || "1-month",
    revenueModel: v.revenueModel || "",
    tags: Array.isArray(v.tags) ? v.tags : [],
  }));
}
