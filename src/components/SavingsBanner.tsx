import type { MonthlyStats } from "@/lib/types";
import { PawIcon } from "./CatIcon";

interface SavingsBannerProps {
  stats: MonthlyStats;
  hasActiveFilters: boolean;
}

export function SavingsBanner({ stats, hasActiveFilters }: SavingsBannerProps) {
  return (
    <div className="bg-gradient-to-r from-cat-orange to-cat-brown rounded-3xl p-6 text-white shadow-xl shadow-cat-orange/20 relative overflow-hidden">
      <PawIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10 rotate-12" />
      <div className="relative z-10 flex justify-between items-end">
        <div>
          <p className="font-bold opacity-80 mb-1">Total {hasActiveFilters ? "Filtered" : "Household"} Savings</p>
          <p className={`text-4xl font-bold tracking-tight ${stats.netSavings >= 0 ? "" : "text-red-200"}`}>
            ${stats.netSavings.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Total Spent</p>
          <p className="text-xl font-bold text-red-100">-${stats.totalSpent.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
