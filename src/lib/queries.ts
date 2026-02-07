import { desc } from "drizzle-orm";
import { db } from "./db";
import { transactions } from "./schema";

export async function getAllTransactions() {
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}
