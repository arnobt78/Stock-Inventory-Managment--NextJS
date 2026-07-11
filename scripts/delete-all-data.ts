/**
 * Delete All Data
 *
 * Removes all documents from the database (fresh start). Run from project root
 * with the same DATABASE_URL as your app (local or VPS).
 *
 * Usage:
 *   npm run script:delete-all-data
 *   npx tsx scripts/delete-all-data.ts
 *
 * To wipe AND recreate demo accounts in one step, prefer:
 *   npm run script:reset-demo-db
 */

import { PrismaClient } from "@prisma/client";
import { deleteAllDbData } from "./lib/delete-all-db-data";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🗑 Deleting all data...\n");

  const counts = await deleteAllDbData(prisma);
  for (const [model, count] of Object.entries(counts)) {
    console.log(`   ${model}: ${count}`);
  }

  console.log(
    "\n✅ All data deleted. Run  npm run script:reset-demo-db  to recreate demo accounts.\n",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
