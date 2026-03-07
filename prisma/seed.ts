import { PrismaClient } from "@prisma/client";
import { IDEAS } from "../src/lib/ideas";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with", IDEAS.length, "ideas...");

  for (const idea of IDEAS) {
    await prisma.idea.upsert({
      where: { slug: idea.slug },
      update: {
        name: idea.name,
        tagline: idea.tagline,
        description: idea.description,
        category: idea.category,
        status: idea.status,
        targetMarket: idea.targetMarket,
        tam: idea.tam,
        pricing: idea.pricing,
        stack: idea.stack,
        effort: idea.effort,
        revenueModel: idea.revenueModel,
        tags: idea.tags,
      },
      create: {
        id: idea.id,
        name: idea.name,
        slug: idea.slug,
        tagline: idea.tagline,
        description: idea.description,
        category: idea.category,
        status: idea.status,
        targetMarket: idea.targetMarket,
        tam: idea.tam,
        pricing: idea.pricing,
        stack: idea.stack,
        effort: idea.effort,
        revenueModel: idea.revenueModel,
        tags: idea.tags,
      },
    });
  }

  console.log("Seeded", IDEAS.length, "ideas successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
