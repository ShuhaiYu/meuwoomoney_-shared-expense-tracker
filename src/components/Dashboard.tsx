"use client";

import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
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
}

export function Dashboard({ initialTransactions }: DashboardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  const [filterDate, setFilterDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((t) => {
      const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
      const matchesCategory = filterCategory !== "All" ? t.category === filterCategory : true;
      return matchesDate && matchesCategory;
    });
  }, [initialTransactions, filterDate, filterCategory]);

  const stats = useMemo(() => computeStats(filteredTransactions), [filteredTransactions]);

  const hasActiveFilters = filterDate !== "" || filterCategory !== "All";

  return (
    <div className="min-h-screen bg-cat-cream font-sans text-gray-800 pb-20">
      <SettlementBanner />
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-cat-orange text-white p-2 rounded-xl">
              <PawIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-cat-dark tracking-tight">MeuwooMoney</h1>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 bg-cat-dark text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-cat-dark/20"
          >
            <FileText size={16} /> Monthly Report
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-8">
        <StatsCards stats={stats} hasActiveFilters={hasActiveFilters} />
        <SavingsBanner stats={stats} hasActiveFilters={hasActiveFilters} />
        <SettlementCard stats={stats} />
        <TransactionForm />
        <TransactionList
          transactions={initialTransactions}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
        />
      </main>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        stats={stats}
        transactions={filteredTransactions}
      />
    </div>
  );
}
