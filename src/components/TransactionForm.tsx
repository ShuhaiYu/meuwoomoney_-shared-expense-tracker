"use client";

import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import { Plus, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { CATEGORIES, FELIX, SOPHIE, LYDIA } from "@/lib/constants";
import type { Category, PayerType } from "@/lib/types";
import { addTransaction, addMultipleTransactions } from "@/lib/actions";
import { melbourneToday, melbourneTodayDate } from "@/lib/melbourne-time";
import { PawIcon } from "./CatIcon";

interface EntryRow {
  id: string;
  amount: string;
  description: string;
  category: Category;
}

const createRow = (category: Category = "Food"): EntryRow => ({
  id: nanoid(8),
  amount: "",
  description: "",
  category,
});

interface TransactionFormProps {
  onAdd?: (data: { date: string; amount: number; category: string; payer: string; description: string; lydiaShare?: number | null }) => { success: boolean; error?: string };
}

export function TransactionForm({ onAdd }: TransactionFormProps) {
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = melbourneToday();

  const [rows, setRows] = useState<EntryRow[]>([createRow()]);
  const [payer, setPayer] = useState<PayerType>("Shared");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);
  const [lydiaShare, setLydiaShare] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const newRowRef = useRef<HTMLInputElement | null>(null);

  const displayedDays = useMemo(() => {
    const days = [];
    const today = melbourneTodayDate();
    const viewEndDate = new Date(today);
    viewEndDate.setDate(today.getDate() - (weekOffset * 7));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(viewEndDate);
      d.setDate(viewEndDate.getDate() - i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isMultiRow = rows.length > 1;

  const updateRow = (id: string, field: "amount" | "description", value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const updateRowCategory = (id: string, value: Category) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, category: value } : r)));
  };

  const addRow = () => {
    // Inherit category from last row for convenience
    const lastCategory = rows[rows.length - 1]?.category ?? "Food";
    const newRow = createRow(lastCategory);
    setRows((prev) => [...prev, newRow]);
    // Focus the new row's amount input after render
    setTimeout(() => newRowRef.current?.focus(), 0);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const resetAll = () => {
    setRows([createRow()]);
    setPayer("Shared");
    setLydiaShare("");
    setSelectedDate(todayStr);
    setWeekOffset(0);
    setIsExpanded(false);
  };

  // Collect valid rows into submission entries
  const getValidEntries = () => {
    const parsedLydiaShare = lydiaShare ? parseFloat(lydiaShare) : null;
    return rows
      .filter((r) => r.amount && r.description)
      .map((r) => ({
        amount: parseFloat(r.amount),
        category: r.category,
        payer,
        description: r.description,
        // Only apply lydiaShare for single-row mode
        lydiaShare: !isMultiRow && parsedLydiaShare && parsedLydiaShare > 0 ? parsedLydiaShare : null,
      }))
      .filter((e) => !isNaN(e.amount) && e.amount > 0);
  };

  const filledRowCount = rows.filter((r) => r.amount && r.description).length;
  const rowTotal = rows.reduce((sum, r) => {
    const v = parseFloat(r.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entries = getValidEntries();

    if (entries.length === 0) {
      toast.error("请填写金额和描述");
      return;
    }

    if (onAdd) {
      // Guest mode
      let allSuccess = true;
      for (const entry of entries) {
        const result = onAdd({ date: selectedDate, ...entry });
        if (!result.success) {
          allSuccess = false;
          toast.error(result.error || "Failed to save");
          break;
        }
      }
      if (allSuccess) {
        toast.success(entries.length > 1 ? `已保存 ${entries.length} 笔记录！` : "Saved!");
        resetAll();
      }
      return;
    }

    startTransition(async () => {
      if (entries.length === 1) {
        const entry = entries[0];
        const result = await addTransaction({ date: selectedDate, ...entry });
        if (result.success) {
          toast.success("已保存！");
          resetAll();
        } else {
          toast.error(result.error || "保存失败");
        }
      } else {
        const result = await addMultipleTransactions(selectedDate, entries);
        if (result.success) {
          toast.success(`已保存 ${result.count} 笔记录！`);
          resetAll();
        } else {
          toast.error(result.error || "批量保存失败");
        }
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
        className="w-full bg-cat-orange hover:bg-cat-brown text-white font-bold py-4 rounded-2xl shadow-lg transform transition hover:scale-[1.02] motion-reduce:hover:transform-none flex items-center justify-center gap-2"
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
        <button onClick={() => resetAll()} className="text-gray-500 hover:text-gray-600">Cancel</button>
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
                aria-label="Previous week"
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 focus-visible:ring-2 focus-visible:ring-cat-orange"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold text-gray-500 flex items-center">
                {weekOffset === 0 ? "Current Week" : `${weekOffset} Week(s) Ago`}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                aria-label="Next week"
                className={`p-2 rounded-full hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-cat-orange ${weekOffset === 0 ? "text-gray-200" : "text-gray-500"}`}
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
                    focus-visible:ring-2 focus-visible:ring-cat-orange focus-visible:ring-offset-1
                    ${isSelected
                      ? "border-cat-dark bg-cat-dark text-white shadow-md transform scale-105"
                      : "border-gray-100 bg-white text-gray-500 hover:border-cat-orange/50 hover:bg-cat-cream"}
                  `}
                >
                  <span className="text-[11px] uppercase font-bold tracking-wider opacity-80 mb-0.5">
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

        {/* Payer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Who Paid / For Whom?</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPayer("Shared")}
              className={`py-2 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-cat-orange ${payer === "Shared" ? "border-cat-orange bg-cat-orange/10 text-cat-dark font-bold" : "border-gray-100 text-gray-500"}`}
            >
              Shared (50/50)
            </button>
            <button
              type="button"
              onClick={() => setPayer("Felix")}
              className={`py-2 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-cat-orange ${payer === "Felix" ? "border-cat-teal bg-cat-teal/10 text-cat-teal font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {FELIX.name} Only
            </button>
            <button
              type="button"
              onClick={() => setPayer("Sophie")}
              className={`py-2 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-cat-orange ${payer === "Sophie" ? "border-cat-brown bg-cat-brown/10 text-cat-brown font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {SOPHIE.name} Only
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => { setPayer("SharedAll"); setLydiaShare(""); }}
              className={`py-2 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-cat-orange ${payer === "SharedAll" ? "border-cat-purple bg-cat-purple/10 text-cat-purple font-bold" : "border-gray-100 text-gray-500"}`}
            >
              All 3 (1/3 each)
            </button>
            <button
              type="button"
              onClick={() => { setPayer("Lydia"); setLydiaShare(""); }}
              className={`py-2 rounded-xl border-2 transition-all focus-visible:ring-2 focus-visible:ring-cat-orange ${payer === "Lydia" ? "border-cat-purple bg-cat-purple/10 text-cat-purple font-bold" : "border-gray-100 text-gray-500"}`}
            >
              {LYDIA.name} Paid
            </button>
          </div>
        </div>

        {/* Amount + Description rows */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {isMultiRow ? `明细 (${filledRowCount} 笔 · $${rowTotal.toFixed(2)})` : "明细"}
            </label>
          </div>
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex items-center gap-2">
                <div className="relative w-28 flex-shrink-0">
                  <span className="absolute left-2.5 top-2.5 text-gray-500 text-sm">$</span>
                  <input
                    ref={idx === rows.length - 1 ? newRowRef : undefined}
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                    className="w-full pl-7 pr-2 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
                    placeholder="0.00"
                    step="0.01"
                    required={rows.length === 1}
                  />
                </div>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, "description", e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
                  placeholder="买了什么？"
                  required={rows.length === 1}
                />
                <select
                  value={row.category}
                  onChange={(e) => updateRowCategory(row.id, e.target.value as Category)}
                  className="w-24 flex-shrink-0 px-2 py-2 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
                  aria-label="分类"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {isMultiRow && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition flex-shrink-0"
                    aria-label="删除此行"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 text-xs font-medium hover:border-cat-orange hover:text-cat-orange hover:bg-cat-cream/30 transition flex items-center justify-center gap-1"
          >
            <Plus size={14} /> 再加一笔
          </button>
        </div>

        {/* Lydia share - only in single row mode */}
        {!isMultiRow && ["Shared", "Felix", "Sophie"].includes(payer) && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
            <label className="block text-xs font-bold text-purple-700 mb-1">
              {LYDIA.name} <span lang="zh">代购份额</span> (optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-purple-400 text-sm">$</span>
              <input
                type="number"
                value={lydiaShare}
                onChange={(e) => setLydiaShare(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 rounded-lg border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-400 text-sm"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            {lydiaShare && parseFloat(lydiaShare) > 0 && rows[0].amount && parseFloat(rows[0].amount) > 0 && (
              <p className="text-[11px] text-purple-600 mt-1.5 font-medium">
                {payer === "Shared"
                  ? `Couple: $${(parseFloat(rows[0].amount) - parseFloat(lydiaShare)).toFixed(2)} ($${((parseFloat(rows[0].amount) - parseFloat(lydiaShare)) / 2).toFixed(2)} each) · ${LYDIA.name}: $${parseFloat(lydiaShare).toFixed(2)}`
                  : `${payer}: $${(parseFloat(rows[0].amount) - parseFloat(lydiaShare)).toFixed(2)} · ${LYDIA.name}: $${parseFloat(lydiaShare).toFixed(2)}`}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-cat-dark hover:bg-gray-800 text-white font-bold py-3 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>Saving...</>
          ) : filledRowCount > 1 ? (
            <><Check size={20} /> 全部保存 ({filledRowCount} 笔 · ${rowTotal.toFixed(2)})</>
          ) : (
            <><Check size={20} /> Save</>
          )}
        </button>
      </form>
    </div>
  );
}
