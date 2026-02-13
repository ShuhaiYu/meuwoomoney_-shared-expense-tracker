"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { FileText, LogIn, LogOut } from "lucide-react";
import { nanoid } from "nanoid";
import { UserMenu } from "./UserMenu";
import type { UserInfo } from "@/lib/auth-check";
import type { Transaction, Deposit } from "@/lib/schema";
import type { Category } from "@/lib/types";
import { computeStats, computeLydiaHalfStats } from "@/lib/stats";
import { melbourneYearMonth, melbournePrevYearMonth } from "@/lib/melbourne-time";
import { PawIcon } from "./CatIcon";
import { StatsCards } from "./StatsCards";
import { SavingsBanner } from "./SavingsBanner";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { ReportModal } from "./ReportModal";
import { SettlementBanner, SettlementCard } from "./SettlementCard";
import { PaymentStatusCard } from "./PaymentStatusCard";
import { DepositsCard } from "./DepositsCard";
import type { MonthlyPayment, LydiaSettlement } from "@/lib/schema";

function getDayOfMonth(dateStr: string) {
  return parseInt(dateStr.split("-")[2], 10);
}

interface DashboardProps {
  initialTransactions: Transaction[];
  isGuest?: boolean;
  isRestricted?: boolean;
  restrictedUser?: UserInfo;
  paymentStatus?: { felix: MonthlyPayment | null; sophie: MonthlyPayment | null };
  initialDeposits?: Deposit[];
  lydiaSettlementStatus?: { firstHalf: LydiaSettlement | null; secondHalf: LydiaSettlement | null };
  prevMonthLydiaSettlement?: { firstHalf: LydiaSettlement | null; secondHalf: LydiaSettlement | null };
}

export function Dashboard({ initialTransactions, isGuest, isRestricted, restrictedUser, paymentStatus, initialDeposits, lydiaSettlementStatus, prevMonthLydiaSettlement }: DashboardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [guestTransactions, setGuestTransactions] = useState<Transaction[]>(initialTransactions);

  const transactions = isGuest ? guestTransactions : initialTransactions;

  const [filterDate, setFilterDate] = useState<string>(() => melbourneYearMonth());
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
      const matchesCategory = filterCategory !== "All" ? t.category === filterCategory : true;
      return matchesDate && matchesCategory;
    });
  }, [transactions, filterDate, filterCategory]);

  const filteredDeposits = useMemo(() => {
    if (!initialDeposits) return [];
    return initialDeposits.filter((d) => (filterDate ? d.yearMonth === filterDate : true));
  }, [initialDeposits, filterDate]);

  const depositTotals = useMemo(() => {
    let felixExtra = 0;
    let sophieExtra = 0;
    let lydiaTransfers = 0;
    filteredDeposits.forEach((d) => {
      const amt = parseFloat(d.amount);
      if (d.depositor === "Felix") felixExtra += amt;
      else if (d.depositor === "Sophie") sophieExtra += amt;
      else if (d.depositor === "Lydia") lydiaTransfers += amt;
    });
    return { felixExtra, sophieExtra, lydiaTransfers };
  }, [filteredDeposits]);

  const stats = useMemo(() => computeStats(filteredTransactions, depositTotals), [filteredTransactions, depositTotals]);

  const { firstHalfStats, secondHalfStats } = useMemo(() => {
    const firstHalfTx = filteredTransactions.filter(t => getDayOfMonth(t.date) <= 15);
    const secondHalfTx = filteredTransactions.filter(t => getDayOfMonth(t.date) > 15);

    let firstHalfLydiaTransfers = 0;
    let secondHalfLydiaTransfers = 0;
    filteredDeposits.forEach((d) => {
      if (d.depositor !== "Lydia") return;
      const amt = parseFloat(d.amount);
      if (getDayOfMonth(d.date) <= 15) firstHalfLydiaTransfers += amt;
      else secondHalfLydiaTransfers += amt;
    });

    return {
      firstHalfStats: computeLydiaHalfStats(firstHalfTx, firstHalfLydiaTransfers),
      secondHalfStats: computeLydiaHalfStats(secondHalfTx, secondHalfLydiaTransfers),
    };
  }, [filteredTransactions, filteredDeposits]);

  const prevMonthSecondHalfStats = useMemo(() => {
    const prevYM = melbournePrevYearMonth();
    const prevMonthTx = transactions.filter(t => t.date.startsWith(prevYM) && getDayOfMonth(t.date) > 15);
    const prevMonthDeposits = (initialDeposits ?? []).filter(d => d.yearMonth === prevYM);
    let prevLydiaTransfers = 0;
    prevMonthDeposits.forEach(d => {
      if (d.depositor === "Lydia" && getDayOfMonth(d.date) > 15) {
        prevLydiaTransfers += parseFloat(d.amount);
      }
    });
    return computeLydiaHalfStats(prevMonthTx, prevLydiaTransfers);
  }, [transactions, initialDeposits]);

  const hasActiveFilters = filterDate !== "" || filterCategory !== "All";

  const guestAdd = useCallback((data: { date: string; amount: number; category: string; payer: string; description: string; lydiaShare?: number | null }) => {
    const newTx: Transaction = {
      id: nanoid(),
      date: data.date,
      amount: data.amount.toFixed(2),
      category: data.category as Transaction["category"],
      payer: data.payer as Transaction["payer"],
      description: data.description,
      lydiaShare: data.lydiaShare ? data.lydiaShare.toFixed(2) : null,
      createdAt: new Date(),
    };
    setGuestTransactions((prev) => [newTx, ...prev]);
    return { success: true } as const;
  }, []);

  const guestDelete = useCallback((id: string) => {
    setGuestTransactions((prev) => prev.filter((t) => t.id !== id));
    return { success: true } as const;
  }, []);

  const guestUpdate = useCallback((id: string, data: { date: string; amount: number; category: string; payer: string; description: string; lydiaShare?: number | null }) => {
    setGuestTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              date: data.date,
              amount: data.amount.toFixed(2),
              category: data.category as Transaction["category"],
              payer: data.payer as Transaction["payer"],
              description: data.description,
              lydiaShare: data.lydiaShare ? data.lydiaShare.toFixed(2) : null,
            }
          : t
      )
    );
    return { success: true } as const;
  }, []);

  return (
    <div className="min-h-screen bg-cat-cream font-sans text-gray-800 pb-20">
      {isGuest && (
        <div className="bg-cat-orange text-white text-center py-2 px-4 text-sm font-bold">
          {isRestricted ? (
            "This app is for authorized members only. Showing demo data."
          ) : (
            <>
              Demo Mode — changes are not saved.{" "}
              <a href="/auth/sign-in" className="underline hover:text-cat-cream ml-1">
                Sign In
              </a>
            </>
          )}
        </div>
      )}
      {!isGuest && <SettlementBanner />}
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-cat-orange text-white p-2 rounded-xl">
              <PawIcon className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-cat-dark tracking-tight">MeuwooMoney</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 bg-cat-dark text-white p-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-cat-dark/20"
            >
              <FileText size={16} /> <span className="hidden sm:inline">Monthly Report</span>
            </button>
            {isGuest && !isRestricted ? (
              <a
                href="/auth/sign-in"
                className="flex items-center gap-2 bg-cat-orange text-white p-2.5 sm:px-4 sm:py-2 rounded-xl text-sm font-bold hover:bg-cat-brown transition"
              >
                <LogIn size={16} /> <span className="hidden sm:inline">Sign In</span>
              </a>
            ) : isRestricted && restrictedUser ? (
              <RestrictedAvatar user={restrictedUser} />
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        <StatsCards stats={stats} hasActiveFilters={hasActiveFilters} />
        <SavingsBanner stats={stats} hasActiveFilters={hasActiveFilters} />
        <TransactionForm onAdd={isGuest ? guestAdd : undefined} />
        {!isGuest && paymentStatus && !(paymentStatus.felix && paymentStatus.sophie) && (
          <PaymentStatusCard paymentStatus={paymentStatus} />
        )}
        {!isGuest && <DepositsCard deposits={filteredDeposits} filterDate={filterDate} />}
        {!isGuest && <SettlementCard stats={stats} firstHalfStats={firstHalfStats} secondHalfStats={secondHalfStats} settlementStatus={lydiaSettlementStatus} filterDate={filterDate} prevMonthSettlement={prevMonthLydiaSettlement} prevMonthSecondHalfStats={prevMonthSecondHalfStats} />}
        <TransactionList
          transactions={transactions}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onDelete={isGuest ? guestDelete : undefined}
          onUpdate={isGuest ? guestUpdate : undefined}
        />
      </main>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        stats={stats}
        transactions={filteredTransactions}
        isGuest={isGuest}
        filterDate={filterDate}
      />
    </div>
  );
}

function RestrictedAvatar({ user }: { user: UserInfo }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cat-orange text-white font-bold text-lg flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-cat-orange/50 transition focus:outline-none focus:ring-2 focus:ring-cat-orange/50"
      >
        {user.image && !imgError ? (
          <Image
            src={user.image}
            alt={user.name ?? "Avatar"}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-4 py-2">
            <p className="font-bold text-cat-dark text-sm truncate">{user.name ?? "User"}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <hr className="border-gray-100 my-1" />
          <a
            href="/api/auth/sign-out"
            onClick={(e) => {
              e.preventDefault();
              fetch("/api/auth/sign-out", { method: "POST" }).finally(() => {
                window.location.href = "/auth/sign-in";
              });
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cat-brown hover:bg-cat-cream transition"
          >
            <LogOut size={16} />
            Sign out
          </a>
        </div>
      )}
    </div>
  );
}
