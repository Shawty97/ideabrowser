import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/ideas";

export const alt = "IdeaBrowser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const idea = await prisma.idea.findUnique({
    where: { slug },
    select: {
      name: true,
      tagline: true,
      category: true,
      tags: true,
    },
  });

  if (!idea) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#09090b",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          IdeaBrowser
        </div>
      ),
      { ...size }
    );
  }

  const cat = CATEGORIES[idea.category as Category] || {
    label: idea.category,
    color: "#6366f1",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#09090b",
          padding: "60px 70px",
        }}
      >
        {/* Top: Category badge */}
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 9999,
              fontSize: 20,
              fontWeight: 600,
              color: cat.color,
              backgroundColor: cat.color + "20",
            }}
          >
            {cat.label}
          </div>
        </div>

        {/* Middle: Name + Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              maxWidth: "90%",
            }}
          >
            {idea.name.length > 50 ? idea.name.slice(0, 47) + "..." : idea.name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#818cf8",
              lineHeight: 1.3,
              maxWidth: "85%",
            }}
          >
            {idea.tagline.length > 100
              ? idea.tagline.slice(0, 97) + "..."
              : idea.tagline}
          </div>
        </div>

        {/* Bottom: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#71717a",
            }}
          >
            IdeaBrowser — Powered by A-Impact
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            {idea.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 16,
                  color: "#a1a1aa",
                  backgroundColor: "#27272a",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
