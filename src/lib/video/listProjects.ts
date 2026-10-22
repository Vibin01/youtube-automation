import { prisma } from "../database/prisma";

async function list() {
  const projects = await prisma.videoProject.findMany({
    include: {
      script: true,
      scenes: { orderBy: { orderIndex: "asc" } },
      renders: true,
    },
  });
  console.log(`Found ${projects.length} projects in database.`);
  for (const p of projects) {
    console.log(`- Project ID: ${p.id} | Title: "${p.title}" | Format: ${p.format} | Scenes: ${p.scenes.length} | Status: ${p.status}`);
  }
}

list().catch(console.error);
