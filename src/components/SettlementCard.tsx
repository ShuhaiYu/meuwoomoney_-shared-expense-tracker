"use client";

import { useState } from "react";
import { ArrowRight, Bell, CheckCircle, Circle, Loader2 } from "lucide-react";
import type { MonthlyStats } from "@/lib/types";
import type { LydiaHalfStats } from "@/lib/stats";
import type { LydiaSettlement } from "@/lib/schema";
import { LYDIA } from "@/lib/constants";
import { melbourneDayOfMonth, melbourneLastDayOfMonth } from "@/lib/melbourne-time";
import { confirmLydiaSettlement, unconfirmLydiaSettlement } from "@/lib/payment-actions";

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
  firstHalfStats: LydiaHalfStats;
  secondHalfStats: LydiaHalfStats;
  settlementStatus?: { firstHalf: LydiaSettlement | null; secondHalf: LydiaSettlement | null };
}

function HalfPeriodSection({
  label,
  halfStats,
  settlement,
  period,
}: {
  label: string;
  halfStats: LydiaHalfStats;
  settlement: LydiaSettlement | null;
  period: "first-half" | "second-half";
}) {
  const [loading, setLoading] = useState(false);
  const confirmed = !!settlement;

  async function handleToggle() {
    setLoading(true);
    try {
      if (confirmed) {
        await unconfirmLydiaSettlement({ period });
      } else {
        await confirmLydiaSettlement({ period });
      }
    } finally {
      setLoading(false);
    }
  }

  const hasActivity = halfStats.totalSharedAll > 0 || halfStats.totalLydiaPaid > 0;

  return (
    <div className={`p-4 rounded-xl border ${confirmed ? "bg-green-50 border-green-200" : "bg-cat-purple/5 border-cat-purple/10"}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm text-cat-dark">{label}</h4>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
            confirmed
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-cat-purple text-white hover:bg-purple-600"
          }`}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : confirmed ? (
            <CheckCircle size={14} />
          ) : (
            <Circle size={14} />
          )}
          {loading ? "" : confirmed ? "Confirmed" : "Confirm"}
        </button>
      </div>

      {confirmed && settlement.confirmedBy && (
        <p className="text-[11px] text-gray-400 mb-2">
          Confirmed by {settlement.confirmedBy}
        </p>
      )}

      {hasActivity ? (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[11px] text-gray-500">{LYDIA.name} Owes</p>
            <p className="font-bold text-cat-purple">${halfStats.lydiaOwes.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-500">Couple Owes</p>
            <p className="font-bold text-cat-purple">${halfStats.coupleOwesLydia.toFixed(2)}</p>
          </div>
          {halfStats.lydiaTransfers > 0 && (
            <>
              <div>
                <p className="text-[11px] text-gray-500">Transfers</p>
                <p className="font-bold text-blue-600">${halfStats.lydiaTransfers.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Remaining</p>
                <p className={`font-bold ${Math.abs(halfStats.lydiaRemainingBalance) < 0.01 ? "text-green-600" : halfStats.lydiaRemainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                  ${Math.abs(halfStats.lydiaRemainingBalance).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No shared expenses this period</p>
      )}
    </div>
  );
}

export function SettlementCard({ stats, firstHalfStats, secondHalfStats, settlementStatus }: SettlementCardProps) {
  const { totalSharedAll, totalLydiaPaid, lydiaNetBalance } = stats;

  if (totalSharedAll === 0 && totalLydiaPaid === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-cat-purple/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{LYDIA.avatar}</div>
        <h3 className="font-bold text-cat-dark text-lg">Roommate Settlement</h3>
      </div>

      <div className="space-y-3 mb-4">
        <HalfPeriodSection
          label="Upper Half (1st - 15th)"
          halfStats={firstHalfStats}
          settlement={settlementStatus?.firstHalf ?? null}
          period="first-half"
        />
        <HalfPeriodSection
          label="Lower Half (16th - End)"
          halfStats={secondHalfStats}
          settlement={settlementStatus?.secondHalf ?? null}
          period="second-half"
        />
      </div>

      {stats.lydiaTransfers > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-gray-500 mb-1">{LYDIA.name} Total Transferred</p>
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
