export type { Transaction, NewTransaction } from "./schema";

export type PayerType = "Shared" | "Felix" | "Sophie" | "SharedAll" | "Lydia";

export type Category =
  | "Food"
  | "Rent"
  | "Utilities"
  | "Cats"
  | "Shopping"
  | "Entertainment"
  | "Transport"
  | "Other";

export interface UserProfile {
  name: string;
  avatar: string;
  monthlyContribution: number;
  color: string;
}

export interface MonthlyStats {
  totalShared: number;
  totalFelixPersonal: number;
  totalSophiePersonal: number;
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  categoryBreakdown: Record<Category, number>;
  felixCategoryBreakdown: Record<Category, number>;
  sophieCategoryBreakdown: Record<Category, number>;
  felixTotalResponsibility: number;
  sophieTotalResponsibility: number;
  totalSharedAll: number;
  totalLydiaPaid: number;
  lydiaOwes: number;
  coupleOwesLydia: number;
  lydiaNetBalance: number;
  felixExtraDeposits: number;
  sophieExtraDeposits: number;
  lydiaTransfers: number;
  lydiaRemainingBalance: number;
}
