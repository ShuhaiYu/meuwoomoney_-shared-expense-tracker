"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { monthlyPayments, lydiaSettlements, deposits } from "./schema";
import { isApprovedUser, getUserInfo } from "./auth-check";
import { melbourneYearMonth, lastDayOfMonth } from "./melbourne-time";

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

const PERIODS = ["first-half", "second-half"] as const;
type SettlementPeriod = (typeof PERIODS)[number];

export async function confirmLydiaSettlement({
  period,
  yearMonth,
  netBalance,
}: {
  period: string;
  yearMonth?: string;
  netBalance?: number;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!PERIODS.includes(period as SettlementPeriod)) {
    return { success: false, error: "Invalid period" };
  }

  const ym = yearMonth ?? melbourneYearMonth();
  const userInfo = await getUserInfo();
  const confirmedBy = userInfo?.email ?? "unknown";

  try {
    const existing = await db
      .select()
      .from(lydiaSettlements)
      .where(and(eq(lydiaSettlements.yearMonth, ym), eq(lydiaSettlements.period, period as SettlementPeriod)));

    if (existing.length > 0) {
      return { success: true };
    }

    // Auto-create a Lydia deposit to settle this half-period
    let depositId: string | null = null;
    const absBalance = Math.abs(netBalance ?? 0);

    if (absBalance >= 0.01) {
      const depositDate = period === "first-half"
        ? `${ym}-15`
        : `${ym}-${lastDayOfMonth(ym)}`;

      const periodLabel = period === "first-half" ? "1st-15th" : "16th-end";
      const direction = (netBalance ?? 0) >= 0 ? "" : " (couple → Lydia)";
      const description = `Settlement ${periodLabel}${direction}`;

      const [inserted] = await db.insert(deposits).values({
        yearMonth: ym,
        depositor: "Lydia",
        amount: absBalance.toFixed(2),
        description,
        date: depositDate,
        createdBy: confirmedBy,
      }).returning({ id: deposits.id });

      depositId = inserted.id;
    }

    await db.insert(lydiaSettlements).values({
      yearMonth: ym,
      period: period as SettlementPeriod,
      confirmedBy,
      depositId,
    });

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to confirm Lydia settlement" };
  }
}

export async function unconfirmLydiaSettlement({
  period,
  yearMonth,
}: {
  period: string;
  yearMonth?: string;
}): Promise<{ success: boolean; error?: string }> {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!PERIODS.includes(period as SettlementPeriod)) {
    return { success: false, error: "Invalid period" };
  }

  const ym = yearMonth ?? melbourneYearMonth();

  try {
    // Find the settlement and its linked deposit
    const [settlement] = await db
      .select()
      .from(lydiaSettlements)
      .where(and(eq(lydiaSettlements.yearMonth, ym), eq(lydiaSettlements.period, period as SettlementPeriod)));

    if (settlement?.depositId) {
      await db.delete(deposits).where(eq(deposits.id, settlement.depositId));
    }

    await db
      .delete(lydiaSettlements)
      .where(and(eq(lydiaSettlements.yearMonth, ym), eq(lydiaSettlements.period, period as SettlementPeriod)));

    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to unconfirm Lydia settlement" };
  }
}
