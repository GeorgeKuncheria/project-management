import dotenv from "dotenv";
dotenv.config();
import { recreateIndices } from "./indices";
import { indexAll } from "./indexer";

async function main() {
  await recreateIndices();
  const counts = await indexAll();
  console.log("Reindexed:", counts);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
