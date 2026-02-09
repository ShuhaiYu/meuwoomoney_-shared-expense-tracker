"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { deposits } from "./schema";
import { isApprovedUser, getUserInfo } from "./auth-check";

const DEPOSITORS = ["Felix", "Sophie", "Lydia"] as const;

const depositSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM"),
  depositor: z.enum(DEPOSITORS),
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required").max(200, "Description too long"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

async function requireAuth(): Promise<{ success: boolean; error?: string } | null> {
  const approved = await isApprovedUser();
  if (!approved) {
    return { success: false, error: "Not authorized" };
  }
  return null;
}

export async function addDeposit(data: {
  yearMonth: string;
  depositor: string;
  amount: number;
  description: string;
  date: string;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const parsed = depositSchema.parse(data);
    const userInfo = await getUserInfo();
    const createdBy = userInfo?.email ?? "unknown";

    await db.insert(deposits).values({
      yearMonth: parsed.yearMonth,
      depositor: parsed.depositor,
      amount: parsed.amount.toFixed(2),
      description: parsed.description,
      date: parsed.date,
      createdBy,
    });

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.errors[0].message };
    }
    return { success: false, error: "Failed to add deposit" };
  }
}

export async function deleteDeposit(id: string): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid deposit ID" };
    }
    await db.delete(deposits).where(eq(deposits.id, id));
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete deposit" };
  }
}
