"use client";

import { ArrowRight, Bell } from "lucide-react";
import type { MonthlyStats } from "@/lib/types";
import { LYDIA } from "@/lib/constants";
import { melbourneDayOfMonth, melbourneLastDayOfMonth } from "@/lib/melbourne-time";

export function SettlementBanner() {
  const day = melbourneDayOfMonth();
  const lastDay = melbourneLastDayOfMonth();
  const isSettlementTime = (day >= 14 && day <= 15) || (day >= lastDay - 1);

  if (!isSettlementTime) return null;

  return (
    <div className="bg-gradient-to-r from-cat-purple to-purple-400 text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2">
      <Bell size={16} className="animate-bounce" />
      Settlement reminder! Time to settle up with {LYDIA.name}.
    </div>
  );
}

interface SettlementCardProps {
  stats: MonthlyStats;
}

export function SettlementCard({ stats }: SettlementCardProps) {
  const { totalSharedAll, totalLydiaPaid, lydiaOwes, coupleOwesLydia, lydiaNetBalance } = stats;

  if (totalSharedAll === 0 && totalLydiaPaid === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-cat-purple/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{LYDIA.avatar}</div>
        <h3 className="font-bold text-cat-dark text-lg">Roommate Settlement</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-cat-purple/5 p-4 rounded-xl border border-cat-purple/10">
          <p className="text-xs font-bold text-gray-500 mb-1">{LYDIA.name} Owes Couple</p>
          <p className="text-xl font-bold text-cat-purple">${lydiaOwes.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">1/3 of ${totalSharedAll.toFixed(2)} shared</p>
        </div>
        <div className="bg-cat-purple/5 p-4 rounded-xl border border-cat-purple/10">
          <p className="text-xs font-bold text-gray-500 mb-1">Couple Owes {LYDIA.name}</p>
          <p className="text-xl font-bold text-cat-purple">${coupleOwesLydia.toFixed(2)}</p>
          <p className="text-[10px] text-gray-400 mt-1">2/3 of ${totalLydiaPaid.toFixed(2)} Lydia paid</p>
        </div>
      </div>

      {stats.lydiaTransfers > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-gray-500 mb-1">{LYDIA.name} Has Transferred</p>
            <p className="text-xl font-bold text-blue-600">${stats.lydiaTransfers.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-xl border ${stats.lydiaRemainingBalance >= 0 ? "bg-green-50 border-green-100" : stats.lydiaRemainingBalance < 0 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
            <p className="text-xs font-bold text-gray-500 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "text-green-600" : stats.lydiaRemainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
              ${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
            </p>
            {Math.abs(stats.lydiaRemainingBalance) < 0.01 && (
              <p className="text-[10px] text-green-500 font-bold mt-1">Fully settled!</p>
            )}
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl flex items-center justify-between ${lydiaNetBalance >= 0 ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
        <div className="flex items-center gap-2">
          {lydiaNetBalance >= 0 ? (
            <>
              <span className="font-bold text-sm text-gray-700">{LYDIA.name}</span>
              <ArrowRight size={16} className="text-green-500" />
              <span className="font-bold text-sm text-gray-700">Couple</span>
            </>
          ) : (
            <>
              <span className="font-bold text-sm text-gray-700">Couple</span>
              <ArrowRight size={16} className="text-orange-500" />
              <span className="font-bold text-sm text-gray-700">{LYDIA.name}</span>
            </>
          )}
        </div>
        <div className="text-right">
          {stats.lydiaTransfers > 0 ? (
            <>
              <p className={`text-2xl font-bold ${stats.lydiaRemainingBalance >= 0 ? "text-green-600" : "text-orange-600"}`}>
                ${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-400">after transfers</p>
            </>
          ) : (
            <p className={`text-2xl font-bold ${lydiaNetBalance >= 0 ? "text-green-600" : "text-orange-600"}`}>
              ${Math.abs(lydiaNetBalance).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
