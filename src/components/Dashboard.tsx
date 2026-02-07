"use client";

import { useState, useMemo, useCallback } from "react";
import { FileText, LogIn } from "lucide-react";
import { nanoid } from "nanoid";
import { UserMenu } from "./UserMenu";
import type { Transaction } from "@/lib/schema";
import type { Category } from "@/lib/types";
import { computeStats } from "@/lib/stats";
import { PawIcon } from "./CatIcon";
import { StatsCards } from "./StatsCards";
import { SavingsBanner } from "./SavingsBanner";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { ReportModal } from "./ReportModal";
import { SettlementBanner, SettlementCard } from "./SettlementCard";

interface DashboardProps {
  initialTransactions: Transaction[];
  isGuest?: boolean;
}

export function Dashboard({ initialTransactions, isGuest }: DashboardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [guestTransactions, setGuestTransactions] = useState<Transaction[]>(initialTransactions);

  const transactions = isGuest ? guestTransactions : initialTransactions;

  const [filterDate, setFilterDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
      const matchesCategory = filterCategory !== "All" ? t.category === filterCategory : true;
      return matchesDate && matchesCategory;
    });
  }, [transactions, filterDate, filterCategory]);

  const stats = useMemo(() => computeStats(filteredTransactions), [filteredTransactions]);

  const hasActiveFilters = filterDate !== "" || filterCategory !== "All";

  const guestAdd = useCallback((data: { date: string; amount: number; category: string; payer: string; description: string }) => {
    const newTx: Transaction = {
      id: nanoid(),
      date: data.date,
      amount: data.amount.toFixed(2),
      category: data.category as Transaction["category"],
      payer: data.payer as Transaction["payer"],
      description: data.description,
      createdAt: new Date(),
    };
    setGuestTransactions((prev) => [newTx, ...prev]);
    return { success: true } as const;
  }, []);

  const guestDelete = useCallback((id: string) => {
    setGuestTransactions((prev) => prev.filter((t) => t.id !== id));
    return { success: true } as const;
  }, []);

  const guestUpdate = useCallback((id: string, data: { date: string; amount: number; category: string; payer: string; description: string }) => {
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
          Demo Mode — changes are not saved.{" "}
          <a href="/auth/sign-in" className="underline hover:text-cat-cream ml-1">
            Sign In
          </a>
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
            <h1 className="text-2xl font-bold text-cat-dark tracking-tight">MeuwooMoney</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-2 bg-cat-dark text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-cat-dark/20"
            >
              <FileText size={16} /> Monthly Report
            </button>
            {isGuest ? (
              <a
                href="/auth/sign-in"
                className="flex items-center gap-2 bg-cat-orange text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-cat-brown transition"
              >
                <LogIn size={16} /> Sign In
              </a>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        <StatsCards stats={stats} hasActiveFilters={hasActiveFilters} />
        <SavingsBanner stats={stats} hasActiveFilters={hasActiveFilters} />
        {!isGuest && <SettlementCard stats={stats} />}
        <TransactionForm onAdd={isGuest ? guestAdd : undefined} />
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
      />
    </div>
  );
}
