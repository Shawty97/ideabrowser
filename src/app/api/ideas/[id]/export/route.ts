import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/ideas";
import { jsPDF } from "jspdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ideaId = parseInt(id, 10);

  if (isNaN(ideaId)) {
    return NextResponse.json({ error: "Invalid idea ID" }, { status: 400 });
  }

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      votes: { select: { value: true } },
      analyses: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { comments: true } },
    },
  });

  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const voteCount = idea.votes.reduce((sum, v) => sum + v.value, 0);
  const analysis = idea.analyses[0] ?? null;
  const cat = CATEGORIES[idea.category as Category] || {
    label: idea.category,
    color: "#6366f1",
  };

  // Create PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to add text with wrapping
  function addText(
    text: string,
    x: number,
    yPos: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number] = [255, 255, 255],
    fontStyle: "normal" | "bold" = "normal"
  ): number {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", fontStyle);
    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = fontSize * 0.5;
    for (const line of lines) {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, x, yPos);
      yPos += lineHeight;
    }
    return yPos;
  }

  function addSection(title: string, yPos: number): number {
    if (yPos > 255) {
      doc.addPage();
      yPos = margin;
    }
    yPos += 4;
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 6;
    yPos = addText(title, margin, yPos, contentWidth, 14, [129, 140, 248], "bold");
    yPos += 2;
    return yPos;
  }

  // --- PAGE 1: Idea Overview ---

  // Dark background header strip
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageWidth, 297, "F");

  // Category badge
  y = addText(cat.label.toUpperCase(), margin, y, contentWidth, 10, [99, 102, 241], "bold");
  y += 2;

  // Idea name
  y = addText(idea.name, margin, y, contentWidth, 24, [255, 255, 255], "bold");
  y += 2;

  // Tagline
  y = addText(idea.tagline, margin, y, contentWidth, 12, [129, 140, 248]);
  y += 6;

  // Description
  y = addSection("Description", y);
  y = addText(idea.description, margin, y, contentWidth, 10, [212, 212, 216]);
  y += 4;

  // Key Metrics
  y = addSection("Key Metrics", y);

  const metrics = [
    { label: "Target Market", value: idea.targetMarket },
    { label: "TAM", value: idea.tam },
    { label: "Pricing", value: idea.pricing },
    { label: "Build Effort", value: idea.effort },
    { label: "Revenue Model", value: idea.revenueModel },
    { label: "Votes", value: String(voteCount) },
    { label: "Comments", value: String(idea._count.comments) },
  ];

  for (const metric of metrics) {
    y = addText(`${metric.label}:`, margin, y, 45, 10, [161, 161, 170], "bold");
    y = addText(metric.value, margin + 46, y - 5, contentWidth - 46, 10, [212, 212, 216]);
    y += 1;
  }

  // Tech Stack
  y = addSection("Tech Stack", y);
  y = addText(idea.stack.join("  |  "), margin, y, contentWidth, 10, [129, 140, 248]);
  y += 2;

  // Tags
  y = addSection("Tags", y);
  y = addText(idea.tags.join(", "), margin, y, contentWidth, 10, [161, 161, 170]);

  // --- PAGE 2: Analysis (if exists) ---
  if (analysis) {
    doc.addPage();
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, pageWidth, 297, "F");
    y = margin;

    y = addText("AI Analysis Report", margin, y, contentWidth, 20, [255, 255, 255], "bold");
    y += 2;
    y = addText(
      `Score: ${analysis.score}/100  |  Model: ${analysis.model}  |  ${analysis.createdAt.toLocaleDateString("en-US")}`,
      margin,
      y,
      contentWidth,
      10,
      [34, 197, 94]
    );
    y += 4;

    // Market Analysis
    y = addSection("Market Analysis", y);
    y = addText(analysis.marketAnalysis, margin, y, contentWidth, 9, [212, 212, 216]);

    // Competitors
    y = addSection("Competitors", y);
    y = addText(analysis.competitors, margin, y, contentWidth, 9, [212, 212, 216]);

    // Revenue Projection
    y = addSection("Revenue Projection", y);
    y = addText(analysis.revenueProjection, margin, y, contentWidth, 9, [212, 212, 216]);

    // Implementation Plan
    y = addSection("Implementation Plan", y);
    y = addText(analysis.implementationPlan, margin, y, contentWidth, 9, [212, 212, 216]);

    // SWOT
    y = addSection("SWOT Analysis", y);
    y = addText(analysis.swotAnalysis, margin, y, contentWidth, 9, [212, 212, 216]);
  }

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(9, 9, 11);
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(
      `Generated by IdeaBrowser — a-impact.io  |  ${new Date().toLocaleDateString("en-US")}`,
      margin,
      290
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, 290);
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${idea.slug.replace(/[^\w\-]/g, "-")}-ideabrowser.pdf"`,
    },
  });
}
