"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { transactions, type NewTransaction } from "./schema";

export async function addTransaction(data: Omit<NewTransaction, "id" | "createdAt">) {
  await db.insert(transactions).values(data);
  revalidatePath("/");
}

export async function deleteTransaction(id: string) {
  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/");
}
