import type { Transaction } from "./schema";
import type { Category, MonthlyStats } from "./types";
import { FELIX, SOPHIE } from "./constants";

export function computeStats(filteredTransactions: Transaction[]): MonthlyStats {
  let totalShared = 0;
  let totalFelixPersonal = 0;
  let totalSophiePersonal = 0;
  let totalSharedAll = 0;
  let totalLydiaPaid = 0;

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
    categoryBreakdown[t.category as Category] = (categoryBreakdown[t.category as Category] || 0) + t.amount;

    let felixPortion = 0;
    let sophiePortion = 0;

    if (t.payer === "Shared") {
      totalShared += t.amount;
      felixPortion = t.amount / 2;
      sophiePortion = t.amount / 2;
    } else if (t.payer === "Felix") {
      totalFelixPersonal += t.amount;
      felixPortion = t.amount;
    } else if (t.payer === "Sophie") {
      totalSophiePersonal += t.amount;
      sophiePortion = t.amount;
    } else if (t.payer === "SharedAll") {
      totalSharedAll += t.amount;
      felixPortion = t.amount / 3;
      sophiePortion = t.amount / 3;
    } else if (t.payer === "Lydia") {
      totalLydiaPaid += t.amount;
      felixPortion = t.amount / 3;
      sophiePortion = t.amount / 3;
    }

    felixCategoryBreakdown[t.category as Category] += felixPortion;
    sophieCategoryBreakdown[t.category as Category] += sophiePortion;
  });

  // Couple's total spending: full couple-only + their 2/3 share of 3-way expenses
  const totalSpent = totalShared + totalFelixPersonal + totalSophiePersonal
    + (totalSharedAll * 2 / 3) + (totalLydiaPaid * 2 / 3);
  const totalIncome = FELIX.monthlyContribution + SOPHIE.monthlyContribution;

  // Settlement: Lydia owes 1/3 of SharedAll, couple owes 2/3 of Lydia-paid
  const lydiaOwes = totalSharedAll / 3;
  const coupleOwesLydia = (totalLydiaPaid * 2) / 3;
  const lydiaNetBalance = lydiaOwes - coupleOwesLydia;

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
    felixTotalResponsibility: (totalShared / 2) + totalFelixPersonal + (totalSharedAll / 3) + (totalLydiaPaid / 3),
    sophieTotalResponsibility: (totalShared / 2) + totalSophiePersonal + (totalSharedAll / 3) + (totalLydiaPaid / 3),
    totalSharedAll,
    totalLydiaPaid,
    lydiaOwes,
    coupleOwesLydia,
    lydiaNetBalance,
  };
}
