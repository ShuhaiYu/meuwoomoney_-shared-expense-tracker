import { desc, gte } from "drizzle-orm";
import { db } from "./db";
import { transactions } from "./schema";

export async function getAllTransactions() {
  // Limit to last 12 months for performance
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-01`;

  return db
    .select()
    .from(transactions)
    .where(gte(transactions.date, cutoffStr))
    .orderBy(desc(transactions.date));
}
