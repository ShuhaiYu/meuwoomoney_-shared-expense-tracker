import type { MonthlyStats } from "@/lib/types";
import { FELIX, SOPHIE } from "@/lib/constants";

interface StatsCardsProps {
  stats: MonthlyStats;
  hasActiveFilters: boolean;
}

export function StatsCards({ stats, hasActiveFilters }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-transparent hover:border-cat-teal/30 transition">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{FELIX.avatar}</span>
          <span className="font-bold text-cat-dark">{FELIX.name}</span>
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Remaining Budget</p>
        <p className={`text-2xl font-bold mt-1 ${(FELIX.monthlyContribution + stats.felixExtraDeposits) - stats.felixTotalResponsibility < 500 ? "text-red-500" : "text-cat-teal"}`}>
          ${((FELIX.monthlyContribution + stats.felixExtraDeposits) - stats.felixTotalResponsibility).toFixed(2)}
        </p>
        {stats.felixExtraDeposits > 0 && (
          <span className="text-[10px] text-blue-500 font-bold block mt-1">+${stats.felixExtraDeposits.toFixed(2)} extra deposited</span>
        )}
        {hasActiveFilters && <span className="text-[10px] text-gray-400 block mt-1">(Filtered View)</span>}
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border-2 border-transparent hover:border-cat-brown/30 transition">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{SOPHIE.avatar}</span>
          <span className="font-bold text-cat-dark">{SOPHIE.name}</span>
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Remaining Budget</p>
        <p className={`text-2xl font-bold mt-1 ${(SOPHIE.monthlyContribution + stats.sophieExtraDeposits) - stats.sophieTotalResponsibility < 500 ? "text-red-500" : "text-cat-brown"}`}>
          ${((SOPHIE.monthlyContribution + stats.sophieExtraDeposits) - stats.sophieTotalResponsibility).toFixed(2)}
        </p>
        {stats.sophieExtraDeposits > 0 && (
          <span className="text-[10px] text-blue-500 font-bold block mt-1">+${stats.sophieExtraDeposits.toFixed(2)} extra deposited</span>
        )}
        {hasActiveFilters && <span className="text-[10px] text-gray-400 block mt-1">(Filtered View)</span>}
      </div>
    </div>
  );
}
