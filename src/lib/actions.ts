"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { transactions } from "./schema";
import { isApprovedUser } from "./auth-check";

const PAYERS = ["Shared", "Felix", "Sophie", "SharedAll", "Lydia"] as const;
const CATEGORIES = ["Food", "Rent", "Utilities", "Cats", "Shopping", "Entertainment", "Transport", "Other"] as const;

const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.enum(CATEGORIES),
  payer: z.enum(PAYERS),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  lydiaShare: z.number().min(0).optional().nullable(),
}).refine(
  (data) => {
    if (data.lydiaShare && data.lydiaShare > 0) {
      if (!["Shared", "Felix", "Sophie"].includes(data.payer)) return false;
      if (data.lydiaShare >= data.amount) return false;
    }
    return true;
  },
  { message: "Lydia share must be less than amount and only for Shared/Felix/Sophie" }
);

async function requireAuth(): Promise<{ success: boolean; error?: string } | null> {
  const approved = await isApprovedUser();
  if (!approved) {
    return { success: false, error: "Not authorized" };
  }
  return null;
}

export async function addTransaction(data: {
  date: string;
  amount: number;
  category: string;
  payer: string;
  description: string;
  lydiaShare?: number | null;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const parsed = transactionSchema.parse(data);
    await db.insert(transactions).values({
      date: parsed.date,
      amount: parsed.amount.toFixed(2),
      category: parsed.category,
      payer: parsed.payer,
      description: parsed.description,
      lydiaShare: parsed.lydiaShare ? parsed.lydiaShare.toFixed(2) : null,
    });
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.errors[0].message };
    }
    return { success: false, error: "Failed to add transaction" };
  }
}

export async function deleteTransaction(id: string): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid transaction ID" };
    }
    await db.delete(transactions).where(eq(transactions.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("deleteTransaction error:", e);
    return { success: false, error: "Failed to delete transaction" };
  }
}

export async function updateTransaction(
  id: string,
  data: {
    date: string;
    amount: number;
    category: string;
    payer: string;
    description: string;
    lydiaShare?: number | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid transaction ID" };
    }
    const parsed = transactionSchema.parse(data);
    await db.update(transactions).set({
      date: parsed.date,
      amount: parsed.amount.toFixed(2),
      category: parsed.category,
      payer: parsed.payer,
      description: parsed.description,
      lydiaShare: parsed.lydiaShare ? parsed.lydiaShare.toFixed(2) : null,
    }).where(eq(transactions.id, id));
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.errors[0].message };
    }
    return { success: false, error: "Failed to update transaction" };
  }
}
