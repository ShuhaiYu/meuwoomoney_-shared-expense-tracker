"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Filter, Calendar, XCircle, Search, Cat } from "lucide-react";
import type { Transaction } from "@/lib/schema";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { TransactionItem } from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
  filterDate: string;
  setFilterDate: (date: string) => void;
  filterCategory: Category | "All";
  setFilterCategory: (cat: Category | "All") => void;
}

export function TransactionList({ transactions, filterDate, setFilterDate, filterCategory, setFilterCategory }: TransactionListProps) {
  const hasActiveFilters = filterDate !== "" || filterCategory !== "All";

  const clearFilters = () => {
    setFilterDate("");
    setFilterCategory("All");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesDate = filterDate ? t.date.startsWith(filterDate) : true;
      const matchesCategory = filterCategory !== "All" ? t.category === filterCategory : true;
      return matchesDate && matchesCategory;
    });
  }, [transactions, filterDate, filterCategory]);

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
      </div>

      <div className="space-y-3">
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
          filteredTransactions.map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))
        )}
      </div>
    </div>
  );
}
