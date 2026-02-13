import type { Transaction } from "./schema";
import type { Category, MonthlyStats } from "./types";
import { FELIX, SOPHIE } from "./constants";

export interface LydiaHalfStats {
  totalSharedAll: number;
  totalLydiaPaid: number;
  totalLydiaShare: number;
  lydiaOwes: number;
  coupleOwesLydia: number;
  lydiaNetBalance: number;
  lydiaTransfers: number;
  lydiaRemainingBalance: number;
}

export function computeLydiaHalfStats(transactions: Transaction[], lydiaTransfers: number): LydiaHalfStats {
  let totalSharedAll = 0;
  let totalLydiaPaid = 0;
  let totalLydiaShare = 0;

  transactions.forEach((t) => {
    const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
    const ls = t.lydiaShare ? parseFloat(String(t.lydiaShare)) : 0;
    if (t.payer === "SharedAll") totalSharedAll += amt;
    else if (t.payer === "Lydia") totalLydiaPaid += amt;
    if (["Shared", "Felix", "Sophie"].includes(t.payer) && ls > 0) totalLydiaShare += ls;
  });

  const lydiaOwes = totalSharedAll / 3 + totalLydiaShare;
  const coupleOwesLydia = (totalLydiaPaid * 2) / 3;
  const lydiaNetBalance = lydiaOwes - coupleOwesLydia;

  return {
    totalSharedAll,
    totalLydiaPaid,
    totalLydiaShare,
    lydiaOwes,
    coupleOwesLydia,
    lydiaNetBalance,
    lydiaTransfers,
    lydiaRemainingBalance: lydiaNetBalance >= 0
      ? lydiaNetBalance - lydiaTransfers
      : lydiaNetBalance + lydiaTransfers,
  };
}

interface DepositTotals {
  felixExtra: number;
  sophieExtra: number;
  lydiaTransfers: number;
}

export function computeStats(
  filteredTransactions: Transaction[],
  depositTotals: DepositTotals = { felixExtra: 0, sophieExtra: 0, lydiaTransfers: 0 },
): MonthlyStats {
  let totalShared = 0;
  let totalFelixPersonal = 0;
  let totalSophiePersonal = 0;
  let totalSharedAll = 0;
  let totalLydiaPaid = 0;
  let totalLydiaShare = 0;

  const categoryBreakdown: Record<Category, number> = {
    Food: 0, Rent: 0, Utilities: 0, Cats: 0, Shopping: 0, Entertainment: 0, Transport: 0, Other: 0
  };
  const felixCategoryBreakdown: Record<Category, number> = {
    Food: 0, Rent: 0, Utilities: 0, Cats: 0, Shopping: 0, Entertainment: 0, Transport: 0, Other: 0
  };
  const sophieCategoryBreakdown: Record<Category, number> = {
    Food: 0, Rent: 0, Utilities: 0, Cats: 0, Shopping: 0, Entertainment: 0, Transport: 0, Other: 0
  };

  filteredTransactions.forEach((t) => {
    const amt = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
    const ls = t.lydiaShare ? parseFloat(String(t.lydiaShare)) : 0;

    categoryBreakdown[t.category as Category] = (categoryBreakdown[t.category as Category] || 0) + amt;

    let felixPortion = 0;
    let sophiePortion = 0;

    if (t.payer === "Shared") {
      totalShared += amt;
      felixPortion = (amt - ls) / 2;
      sophiePortion = (amt - ls) / 2;
    } else if (t.payer === "Felix") {
      totalFelixPersonal += amt;
      felixPortion = amt - ls;
    } else if (t.payer === "Sophie") {
      totalSophiePersonal += amt;
      sophiePortion = amt - ls;
    } else if (t.payer === "SharedAll") {
      totalSharedAll += amt;
      felixPortion = amt / 3;
      sophiePortion = amt / 3;
    } else if (t.payer === "Lydia") {
      totalLydiaPaid += amt;
      felixPortion = amt / 3;
      sophiePortion = amt / 3;
    }

    if (["Shared", "Felix", "Sophie"].includes(t.payer) && ls > 0) {
      totalLydiaShare += ls;
    }

    felixCategoryBreakdown[t.category as Category] += felixPortion;
    sophieCategoryBreakdown[t.category as Category] += sophiePortion;
  });

  // Couple's total spending: full couple-only + their 2/3 share of 3-way expenses - lydiaShare (Lydia's portion)
  const totalSpent = totalShared + totalFelixPersonal + totalSophiePersonal
    + (totalSharedAll * 2 / 3) + (totalLydiaPaid * 2 / 3) - totalLydiaShare;
  const totalIncome = FELIX.monthlyContribution + SOPHIE.monthlyContribution
    + depositTotals.felixExtra + depositTotals.sophieExtra;

  // Settlement: Lydia owes 1/3 of SharedAll + lydiaShare from couple purchases, couple owes 2/3 of Lydia-paid
  const lydiaOwes = totalSharedAll / 3 + totalLydiaShare;
  const coupleOwesLydia = (totalLydiaPaid * 2) / 3;
  const lydiaNetBalance = lydiaOwes - coupleOwesLydia;

  // Compute felix/sophie total responsibility from category breakdowns (already accounts for lydiaShare)
  let felixTotalResponsibility = 0;
  let sophieTotalResponsibility = 0;
  for (const cat of Object.keys(felixCategoryBreakdown) as Category[]) {
    felixTotalResponsibility += felixCategoryBreakdown[cat];
    sophieTotalResponsibility += sophieCategoryBreakdown[cat];
  }

  return {
    totalShared,
    totalFelixPersonal,
    totalSophiePersonal,
    totalSpent,
    totalIncome,
    netSavings: totalIncome - totalSpent,
    categoryBreakdown,
    felixCategoryBreakdown,
    sophieCategoryBreakdown,
    felixTotalResponsibility,
    sophieTotalResponsibility,
    totalSharedAll,
    totalLydiaPaid,
    totalLydiaShare,
    lydiaOwes,
    coupleOwesLydia,
    lydiaNetBalance,
    felixExtraDeposits: depositTotals.felixExtra,
    sophieExtraDeposits: depositTotals.sophieExtra,
    lydiaTransfers: depositTotals.lydiaTransfers,
    lydiaRemainingBalance: lydiaNetBalance >= 0
      ? lydiaNetBalance - depositTotals.lydiaTransfers
      : lydiaNetBalance + depositTotals.lydiaTransfers,
  };
}
