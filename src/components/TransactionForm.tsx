"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, FELIX, SOPHIE, LYDIA } from "@/lib/constants";
import type { Category, PayerType } from "@/lib/types";
import { addTransaction } from "@/lib/actions";
import { PawIcon } from "./CatIcon";

interface TransactionFormProps {
  onAdd?: (data: { date: string; amount: number; category: string; payer: string; description: string }) => { success: boolean; error?: string };
}

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDate(new Date());

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [payer, setPayer] = useState<PayerType>("Shared");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const getDisplayedDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewEndDate = new Date(today);
    viewEndDate.setDate(today.getDate() - (weekOffset * 7));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(viewEndDate);
      d.setDate(viewEndDate.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const displayedDays = getDisplayedDays();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const data = {
      date: selectedDate,
      amount: parseFloat(amount),
      category,
      payer,
      description,
    };

    if (onAdd) {
      const result = onAdd(data);
      if (result.success) {
        toast.success("Saved!");
        setAmount("");
        setDescription("");
        setCategory("Food");
        setPayer("Shared");
        setSelectedDate(todayStr);
        setWeekOffset(0);
        setIsExpanded(false);
      } else {
        toast.error(result.error || "Failed to save");
      }
      return;
    }

    startTransition(async () => {
      const result = await addTransaction(data);

      if (result.success) {
        toast.success("Saved!");
        setAmount("");
        setDescription("");
        setCategory("Food");
        setPayer("Shared");
        setSelectedDate(todayStr);
        setWeekOffset(0);
        setIsExpanded(false);
      } else {
        toast.error(result.error || "Failed to save");
      }
    });
  };

  useEffect(() => {
    if (isExpanded) {
      setSelectedDate(todayStr);
      setWeekOffset(0);
    }
  }, [isExpanded, todayStr]);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-cat-orange hover:bg-cat-brown text-white font-bold py-4 rounded-2xl shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        <Plus size={24} />
        <span>Add New Expense</span>
        <PawIcon className="w-5 h-5 opacity-50" />
      </button>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-cat-orange/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-cat-dark text-lg flex items-center gap-2">
          <PawIcon className="text-cat-orange w-5 h-5" /> New Expense
        </h3>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold text-gray-400 flex items-center">
                {weekOffset === 0 ? "Current Week" : `${weekOffset} Week(s) Ago`}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className={`p-1 rounded-full hover:bg-gray-100 ${weekOffset === 0 ? "text-gray-200" : "text-gray-500"}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {displayedDays.map((d) => {
              const dStr = formatDate(d);
              const isSelected = selectedDate === dStr;
              const isToday = dStr === todayStr;

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => setSelectedDate(dStr)}
                  className={`
                    flex flex-col items-center justify-center py-2 rounded-xl border-2 transition-all
                    ${isSelected
                      ? "border-cat-dark bg-cat-dark text-white shadow-md transform scale-105"
                      : "border-gray-100 bg-white text-gray-500 hover:border-cat-orange/50 hover:bg-cat-cream"}
                  `}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">
                    {isToday ? "Tdy" : dayNames[d.getDay()]}
                  </span>
                  <span className="text-sm sm:text-lg font-bold">
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange"
                placeholder="0.00"
                required
                step="0.01"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Who Paid / For Whom?</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPayer("Shared")}
              className={`py-2 rounded-xl border-2 transition-all ${payer === "Shared" ? "border-cat-orange bg-cat-orange/10 text-cat-dark font-bold" : "border-gray-100 text-gray-500"}`}
            >
              Shared (50/50)
            </button>
            <button
              type="button"
              onClick={() => setPayer("Felix")}
              className={`py-2 rounded-xl border-2 transition-all ${payer === "Felix" ? "border-cat-teal bg-cat-teal/10 text-cat-teal font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {FELIX.name} Only
            </button>
            <button
              type="button"
              onClick={() => setPayer("Sophie")}
              className={`py-2 rounded-xl border-2 transition-all ${payer === "Sophie" ? "border-cat-brown bg-cat-brown/10 text-cat-brown font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {SOPHIE.name} Only
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPayer("SharedAll")}
              className={`py-2 rounded-xl border-2 transition-all ${payer === "SharedAll" ? "border-cat-purple bg-cat-purple/10 text-cat-purple font-bold" : "border-gray-100 text-gray-500"}`}
            >
              All 3 (1/3 each)
            </button>
            <button
              type="button"
              onClick={() => setPayer("Lydia")}
              className={`py-2 rounded-xl border-2 transition-all ${payer === "Lydia" ? "border-cat-purple bg-cat-purple/10 text-cat-purple font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {LYDIA.name} Paid
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange"
            placeholder="What did you buy?"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-cat-dark hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>Saving...</>
          ) : (
            <><Check size={20} /> Save Transaction</>
          )}
        </button>
      </form>
    </div>
  );
}
