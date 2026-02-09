"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { monthlyPayments } from "./schema";
import { isApprovedUser, getUserInfo } from "./auth-check";
import { melbourneYearMonth } from "./melbourne-time";

const PAYERS = ["Felix", "Sophie"] as const;
type PayerName = (typeof PAYERS)[number];

async function requireAuth(): Promise<{ success: boolean; error?: string } | null> {
  const approved = await isApprovedUser();
  if (!approved) {
    return { success: false, error: "Not authorized" };
  }
  return null;
}

export async function confirmMonthlyPayment({
  payer,
  yearMonth,
}: {
  payer: string;
  yearMonth?: string;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!PAYERS.includes(payer as PayerName)) {
    return { success: false, error: "Invalid payer" };
  }

  const ym = yearMonth ?? melbourneYearMonth();
  const userInfo = await getUserInfo();
  const confirmedBy = userInfo?.email ?? "unknown";

  try {
    // Check if already confirmed
    const existing = await db
      .select()
      .from(monthlyPayments)
      .where(and(eq(monthlyPayments.yearMonth, ym), eq(monthlyPayments.payer, payer as PayerName)));

    if (existing.length > 0) {
      return { success: true }; // Already confirmed
    }

    await db.insert(monthlyPayments).values({
      yearMonth: ym,
      payer: payer as PayerName,
      confirmedBy,
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to confirm payment" };
  }
}

export async function unconfirmMonthlyPayment({
  payer,
  yearMonth,
}: {
  payer: string;
  yearMonth?: string;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!PAYERS.includes(payer as PayerName)) {
    return { success: false, error: "Invalid payer" };
  }

  const ym = yearMonth ?? melbourneYearMonth();

  try {
    await db
      .delete(monthlyPayments)
      .where(and(eq(monthlyPayments.yearMonth, ym), eq(monthlyPayments.payer, payer as PayerName)));

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to unconfirm payment" };
  }
}
