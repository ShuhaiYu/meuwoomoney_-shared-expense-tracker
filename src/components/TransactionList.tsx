"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Filter, Calendar, XCircle, Search, Cat, FileSearch } from "lucide-react";
import type { Transaction } from "@/lib/schema";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { melbourneTodayDate } from "@/lib/melbourne-time";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  filterDate: string;
  setFilterDate: (date: string) => void;
  filterCategory: Category | "All";
  setFilterCategory: (cat: Category | "All") => void;
  onDelete?: (id: string) => { success: boolean; error?: string };
  onUpdate?: (id: string, data: { date: string; amount: number; category: string; payer: string; description: string }) => { success: boolean; error?: string };
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = melbourneTodayDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(year, month - 1, day);
  if (dateOnly.getTime() === today.getTime()) return "Today";
  if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${monthName} ${day}, ${year}`;
}

export function TransactionList({ transactions, filterDate, setFilterDate, filterCategory, setFilterCategory, onDelete, onUpdate }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const hasActiveFilters = filterDate !== "" || filterCategory !== "All" || searchQuery !== "";

  const clearFilters = () => {
    setFilterDate("");
    setFilterCategory("All");
    setSearchQuery("");
  };

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return transactions.filter((t) => {
      const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
      const matchesCategory = filterCategory !== "All" ? t.category === filterCategory : true;
      const matchesSearch = query ? t.description.toLowerCase().includes(query) : true;
      return matchesDate && matchesCategory && matchesSearch;
    });
  }, [transactions, filterDate, filterCategory, searchQuery]);

  const groupedByDate = useMemo(() => {
    const groups: { date: string; transactions: Transaction[] }[] = [];
    for (const t of filteredTransactions) {
      const last = groups[groups.length - 1];
      if (last && last.date === t.date) {
        last.transactions.push(t);
      } else {
        groups.push({ date: t.date, transactions: [t] });
      }
    }
    return groups;
  }, [filteredTransactions]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-cat-dark flex items-center gap-2">
          <TrendingUp className="text-cat-orange" size={20} />
          {hasActiveFilters ? "Search Results" : "Recent Activity"}
        </h2>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-3 text-cat-dark font-bold text-sm uppercase tracking-wide opacity-70">
          <Search size={16} />
          <span>Check Accounts</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            <input
              type="month"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-gray-700"
            />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | "All")}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-gray-700 appearance-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 transition"
            >
              <XCircle size={18} /> <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
        <div className="relative mt-3">
          <FileSearch className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-gray-700"
          />
        </div>
      </div>

      <div className="space-y-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <Cat className="mx-auto w-12 h-12 mb-2 opacity-50" />
            <p>No expenses found for this period/category.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-cat-orange font-bold mt-2 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          groupedByDate.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-3 py-3 mt-2 first:mt-0">
                <div className="w-2.5 h-2.5 rounded-full bg-cat-orange shrink-0" />
                <span className="text-sm font-bold text-cat-dark/70 tracking-wide">{formatDateLabel(group.date)}</span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">{group.transactions.length} item{group.transactions.length > 1 ? "s" : ""}</span>
              </div>
              <div className="space-y-3 ml-1 pl-4 border-l-2 border-cat-orange/20">
                {group.transactions.map((t) => (
                  <TransactionItem key={t.id} transaction={t} onDelete={onDelete} onUpdate={onUpdate} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
