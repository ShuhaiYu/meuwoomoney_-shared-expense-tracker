"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, CheckCircle, ChevronDown, ChevronUp, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { MonthlyStats } from "@/lib/types";
import type { LydiaHalfStats } from "@/lib/stats";
import { computeLydiaPortion } from "@/lib/stats";
import type { Transaction, LydiaSettlement } from "@/lib/schema";
import { LYDIA } from "@/lib/constants";
import { melbourneDayOfMonth, melbourneLastDayOfMonth, melbourneYearMonth, lastDayOfMonth } from "@/lib/melbourne-time";
import { confirmLydiaSettlement, unconfirmLydiaSettlement } from "@/lib/payment-actions";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatHalfLabel(yearMonth: string, half: "first" | "second"): string {
  const [, m] = yearMonth.split("-").map(Number);
  const monthName = MONTH_NAMES[m - 1];
  if (half === "first") {
    return `${monthName} 1 - ${monthName} 15`;
  }
  const last = lastDayOfMonth(yearMonth);
  return `${monthName} 16 - ${monthName} ${last}`;
}

export function SettlementBanner() {
  const day = melbourneDayOfMonth();
  const lastDay = melbourneLastDayOfMonth();
  const isSettlementTime = (day >= 14 && day <= 15) || (day >= lastDay - 1);

  if (!isSettlementTime) return null;

  return (
    <div className="bg-gradient-to-r from-cat-purple to-purple-400 text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2">
      <Bell size={16} className="animate-bounce motion-reduce:animate-none" />
      Settlement reminder! Time to settle up with {LYDIA.name}.
    </div>
  );
}

function LydiaTransactionRow({ transaction: t }: { transaction: Transaction }) {
  const { direction, amount } = computeLydiaPortion(t);
  const isLydiaOwes = direction === "lydia-owes";
  const payerLabel = t.payer === "SharedAll" ? "All 3" : t.payer;
  const payerColor = t.payer === "SharedAll" || t.payer === "Lydia"
    ? "bg-cat-purple/15 text-cat-purple border-cat-purple/20"
    : t.payer === "Felix"
      ? "bg-cat-teal/15 text-cat-teal border-cat-teal/20"
      : t.payer === "Shared"
        ? "bg-cat-orange/15 text-cat-brown border-cat-orange/20"
        : "bg-cat-brown/15 text-cat-brown border-cat-brown/20";

  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-bold text-gray-700 truncate max-w-[120px]">{t.description}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${payerColor}`}>
          {payerLabel}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-[11px] text-gray-400">{t.date.slice(5)}</span>
        <span className={`font-bold tabular-nums w-16 text-right ${isLydiaOwes ? "text-cat-purple" : "text-orange-600"}`}>
          ${amount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

interface SettlementCardProps {
  stats: MonthlyStats;
  firstHalfStats: LydiaHalfStats;
  secondHalfStats: LydiaHalfStats;
  firstHalfTransactions?: Transaction[];
  secondHalfTransactions?: Transaction[];
  settlementStatus?: { firstHalf: LydiaSettlement | null; secondHalf: LydiaSettlement | null };
  filterDate: string;
  prevMonthSettlement?: { firstHalf: LydiaSettlement | null; secondHalf: LydiaSettlement | null };
  prevMonthSecondHalfStats?: LydiaHalfStats;
  prevMonthSecondHalfTransactions?: Transaction[];
}

function HalfPeriodSection({
  label,
  halfStats,
  settlement,
  period,
  yearMonth,
  transactions,
}: {
  label: string;
  halfStats: LydiaHalfStats;
  settlement: LydiaSettlement | null;
  period: "first-half" | "second-half";
  yearMonth: string;
  transactions?: Transaction[];
}) {
  const [loading, setLoading] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const router = useRouter();
  const confirmed = !!settlement;

  async function handleToggle() {
    setLoading(true);
    try {
      const result = confirmed
        ? await unconfirmLydiaSettlement({ period, yearMonth })
        : await confirmLydiaSettlement({ period, yearMonth });
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  const hasActivity = halfStats.totalSharedAll > 0 || halfStats.totalLydiaPaid > 0 || halfStats.totalLydiaShare > 0;

  // Confirmed: compact one-line display
  if (confirmed) {
    const netAmt = Math.abs(halfStats.lydiaNetBalance);
    const direction = halfStats.lydiaNetBalance >= 0 ? `${LYDIA.name} paid` : `Couple paid`;
    return (
      <div className="px-4 py-3 rounded-xl border bg-green-50 border-green-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-green-600 shrink-0" />
          <span className="font-bold text-sm text-gray-600">{label}</span>
          {hasActivity && (
            <span className="text-xs text-green-700">{direction} ${netAmt.toFixed(2)}</span>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-green-600 hover:bg-green-100 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin motion-reduce:animate-none" /> : "Undo"}
        </button>
      </div>
    );
  }

  // Unconfirmed: full detail view
  return (
    <div className="p-4 rounded-xl border bg-cat-purple/5 border-cat-purple/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-sm text-cat-dark">{label}</h4>
        <button
          onClick={handleToggle}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 bg-cat-purple text-white hover:bg-purple-600"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Circle size={14} />
          )}
          {loading ? "..." : "Confirm"}
        </button>
      </div>

      {hasActivity ? (
        <>
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

          {transactions && transactions.length > 0 && (
            <>
              <button
                onClick={() => setShowTx(!showTx)}
                className="w-full text-center text-[11px] font-bold text-cat-purple hover:bg-cat-purple/10 py-2 rounded-lg transition flex items-center justify-center gap-1 mt-3"
              >
                {showTx ? (
                  <><ChevronUp size={12} /> Hide Transactions</>
                ) : (
                  <><ChevronDown size={12} /> {transactions.length} Transactions</>
                )}
              </button>
              {showTx && (
                <div className="mt-1 space-y-0 border-t border-gray-100 pt-2">
                  {transactions.map(t => <LydiaTransactionRow key={t.id} transaction={t} />)}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-500">No shared expenses this period</p>
      )}
    </div>
  );
}

export function SettlementCard({ stats, firstHalfStats, secondHalfStats, firstHalfTransactions, secondHalfTransactions, settlementStatus, filterDate, prevMonthSettlement, prevMonthSecondHalfStats, prevMonthSecondHalfTransactions }: SettlementCardProps) {
  const { totalSharedAll, totalLydiaPaid, lydiaNetBalance } = stats;

  if (totalSharedAll === 0 && totalLydiaPaid === 0 && stats.totalLydiaShare === 0) return null;

  const currentYM = melbourneYearMonth();
  const isCurrentMonth = filterDate === currentYM;
  const day = melbourneDayOfMonth();

  // Determine which sections to show
  let showPrevLowerHalf = false;
  let showCurrentUpperHalf = false;
  let showCurrentLowerHalf = false;
  let prevYM = "";

  if (!isCurrentMonth) {
    // Historical view: show both halves of the filtered month
    showCurrentUpperHalf = true;
    showCurrentLowerHalf = true;
  } else if (day <= 15) {
    // Upper half period
    const [y, m] = currentYM.split("-").map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    prevYM = `${py}-${String(pm).padStart(2, "0")}`;
    showPrevLowerHalf = !prevMonthSettlement?.secondHalf;
    showCurrentUpperHalf = true;
    showCurrentLowerHalf = false;
  } else {
    // Lower half period
    showPrevLowerHalf = false;
    showCurrentUpperHalf = !settlementStatus?.firstHalf;
    showCurrentLowerHalf = true;
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-cat-purple/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{LYDIA.avatar}</div>
        <h3 className="font-bold text-cat-dark text-lg">Roommate Settlement</h3>
      </div>

      <div className="space-y-3 mb-4">
        {showPrevLowerHalf && prevMonthSecondHalfStats && (
          <HalfPeriodSection
            label={formatHalfLabel(prevYM, "second")}
            halfStats={prevMonthSecondHalfStats}
            settlement={prevMonthSettlement?.secondHalf ?? null}
            period="second-half"
            yearMonth={prevYM}
            transactions={prevMonthSecondHalfTransactions}
          />
        )}
        {showCurrentUpperHalf && (
          <HalfPeriodSection
            label={formatHalfLabel(filterDate, "first")}
            halfStats={firstHalfStats}
            settlement={settlementStatus?.firstHalf ?? null}
            period="first-half"
            yearMonth={filterDate}
            transactions={firstHalfTransactions}
          />
        )}
        {showCurrentLowerHalf && (
          <HalfPeriodSection
            label={formatHalfLabel(filterDate, "second")}
            halfStats={secondHalfStats}
            settlement={settlementStatus?.secondHalf ?? null}
            period="second-half"
            yearMonth={filterDate}
            transactions={secondHalfTransactions}
          />
        )}
      </div>

      {/* Monthly net balance summary - only for historical months or when transfers exist */}
      {(!isCurrentMonth && stats.lydiaTransfers > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="text-xs font-bold text-gray-500 mb-1">{LYDIA.name} Total Transferred</p>
            <p className="text-xl font-bold text-blue-600">${stats.lydiaTransfers.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-xl border ${stats.lydiaRemainingBalance >= 0 ? "bg-green-50 border-green-100" : "bg-orange-50 border-orange-100"}`}>
            <p className="text-xs font-bold text-gray-500 mb-1">Remaining</p>
            <p className={`text-xl font-bold ${Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "text-green-600" : stats.lydiaRemainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
              ${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
            </p>
            {Math.abs(stats.lydiaRemainingBalance) < 0.01 && (
              <p className="text-[11px] text-green-500 font-bold mt-1">Fully settled!</p>
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
              <p className="text-[11px] text-gray-500">after transfers</p>
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
