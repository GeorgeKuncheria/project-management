import { PrismaClient } from "../generated/prisma";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { recreateIndices } from "../src/search/indices";
import { indexAll } from "../src/search/indexer";
dotenv.config();
const prisma = new PrismaClient();

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    try {
      await model.deleteMany({});
      console.log(`Cleared data from ${modelName}`);
    } catch (error) {
      console.error(`Error clearing data from ${modelName}:`, error);
    }
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  const orderedFileNames = [
    "team.json",
    "project.json",
    "projectTeam.json",
    "user.json",
    "task.json",
    "attachment.json",
    "comment.json",
    "taskAssignment.json",
  ];

  await deleteAllData([...orderedFileNames].reverse());

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const modelName = path.basename(fileName, path.extname(fileName));
    const model: any = prisma[modelName as keyof typeof prisma];

    try {
      for (const data of jsonData) {
        await model.create({ data });
      }
      console.log(`Seeded ${modelName} with data from ${fileName}`);
    } catch (error) {
      console.error(`Error seeding data for ${modelName}:`, error);
    }
  }
}

// Keep Elasticsearch in step with the freshly seeded data (best effort).
async function reindexSearch() {
  try {
    await recreateIndices();
    console.log("Reindexed Elasticsearch:", await indexAll());
  } catch (e: any) {
    console.warn(`Skipped Elasticsearch reindex: ${e.message}`);
  }
}

main()
  .then(reindexSearch)
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
