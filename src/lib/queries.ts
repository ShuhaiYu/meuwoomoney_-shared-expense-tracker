import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "./db";
import { transactions, monthlyPayments, deposits, lydiaSettlements } from "./schema";
import type { MonthlyPayment, LydiaSettlement } from "./schema";
import { getMelbourneParts, melbourneYearMonth } from "./melbourne-time";

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

export async function getMonthlyPaymentStatus(yearMonth?: string): Promise<{ felix: MonthlyPayment | null; sophie: MonthlyPayment | null }> {
  const ym = yearMonth ?? melbourneYearMonth();
  const rows = await db
    .select()
    .from(monthlyPayments)
    .where(eq(monthlyPayments.yearMonth, ym));

  return {
    felix: rows.find((r) => r.payer === "Felix") ?? null,
    sophie: rows.find((r) => r.payer === "Sophie") ?? null,
  };
}

export async function getLydiaSettlementStatus(yearMonth?: string): Promise<{
  firstHalf: LydiaSettlement | null;
  secondHalf: LydiaSettlement | null;
}> {
  const ym = yearMonth ?? melbourneYearMonth();
  const rows = await db.select().from(lydiaSettlements).where(eq(lydiaSettlements.yearMonth, ym));
  return {
    firstHalf: rows.find(r => r.period === "first-half") ?? null,
    secondHalf: rows.find(r => r.period === "second-half") ?? null,
  };
}

export async function getAllDeposits() {
  const { year, month } = getMelbourneParts();
  const cutoff = new Date(year, month - 1 - 12, 1);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;

  return db
    .select()
    .from(deposits)
    .where(gte(deposits.yearMonth, cutoffStr))
    .orderBy(desc(deposits.date));
}
