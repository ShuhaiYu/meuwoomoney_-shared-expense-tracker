import { desc, gte } from "drizzle-orm";
import { db } from "./db";
import { transactions } from "./schema";
import { getMelbourneParts } from "./melbourne-time";

export async function getAllTransactions() {
  // Limit to last 12 months for performance (Melbourne timezone)
  const { year, month } = getMelbourneParts();
  const cutoff = new Date(year, month - 1 - 12, 1);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-01`;

  return db
    .select()
    .from(transactions)
    .where(gte(transactions.date, cutoffStr))
    .orderBy(desc(transactions.date));
}
