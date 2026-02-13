"use client";

import { useState, useTransition } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/lib/schema";
import type { PayerType, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { deleteTransaction, updateTransaction } from "@/lib/actions";
import { CategoryIcon } from "./CatIcon";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => { success: boolean; error?: string };
  onUpdate?: (id: string, data: { date: string; amount: number; category: string; payer: string; description: string; lydiaShare?: number | null }) => { success: boolean; error?: string };
}

const PAYERS: PayerType[] = ["Shared", "Felix", "Sophie", "SharedAll", "Lydia"];

function getPayerBadge(payer: PayerType) {
  if (payer === "Shared") return <span className="bg-cat-orange/20 text-cat-brown px-2 py-1 rounded-md text-xs font-bold border border-cat-orange/30">Shared</span>;
  if (payer === "Felix") return <span className="bg-cat-teal/20 text-cat-teal px-2 py-1 rounded-md text-xs font-bold border border-cat-teal/30">Felix</span>;
  if (payer === "SharedAll") return <span className="bg-cat-purple/20 text-cat-purple px-2 py-1 rounded-md text-xs font-bold border border-cat-purple/30">All 3</span>;
  if (payer === "Lydia") return <span className="bg-cat-purple/20 text-cat-purple px-2 py-1 rounded-md text-xs font-bold border border-cat-purple/30">Lydia</span>;
  return <span className="bg-cat-brown/20 text-cat-brown px-2 py-1 rounded-md text-xs font-bold border border-cat-brown/30">Sophie</span>;
}

export function TransactionItem({ transaction: t, onDelete, onUpdate }: TransactionItemProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editDate, setEditDate] = useState(t.date);
  const [editAmount, setEditAmount] = useState(String(typeof t.amount === "string" ? t.amount : t.amount));
  const [editCategory, setEditCategory] = useState(t.category);
  const [editPayer, setEditPayer] = useState(t.payer);
  const [editDescription, setEditDescription] = useState(t.description);
  const [editLydiaShare, setEditLydiaShare] = useState(t.lydiaShare ? String(t.lydiaShare) : "");

  const amount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;

  const handleDelete = () => {
    if (onDelete) {
      const result = onDelete(t.id);
      if (result.success) {
        toast.success("Deleted");
      } else {
        toast.error(result.error || "Failed to delete");
      }
      setConfirmingDelete(false);
      return;
    }
    startTransition(async () => {
      const result = await deleteTransaction(t.id);
      if (result.success) {
        toast.success("Deleted");
      } else {
        toast.error(result.error || "Failed to delete");
      }
      setConfirmingDelete(false);
    });
  };

  const handleSaveEdit = () => {
    const parsedLs = editLydiaShare ? parseFloat(editLydiaShare) : null;
    const data = {
      date: editDate,
      amount: parseFloat(editAmount),
      category: editCategory,
      payer: editPayer,
      description: editDescription,
      lydiaShare: parsedLs && parsedLs > 0 ? parsedLs : null,
    };

    if (onUpdate) {
      const result = onUpdate(t.id, data);
      if (result.success) {
        toast.success("Updated");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update");
      }
      return;
    }

    startTransition(async () => {
      const result = await updateTransaction(t.id, data);
      if (result.success) {
        toast.success("Updated");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update");
      }
    });
  };

  const handleCancelEdit = () => {
    setEditDate(t.date);
    setEditAmount(String(typeof t.amount === "string" ? t.amount : t.amount));
    setEditCategory(t.category);
    setEditPayer(t.payer);
    setEditDescription(t.description);
    setEditLydiaShare(t.lydiaShare ? String(t.lydiaShare) : "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`bg-white p-4 rounded-2xl shadow-sm border-2 border-cat-orange/30 space-y-3 ${isPending ? "opacity-50" : ""}`}>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
          />
          <div className="relative">
            <span className="absolute left-3 top-1.5 text-gray-500 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value as Category)}
            className="px-3 py-1.5 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={editPayer}
            onChange={(e) => {
              const newPayer = e.target.value as PayerType;
              setEditPayer(newPayer);
              if (!["Shared", "Felix", "Sophie"].includes(newPayer)) setEditLydiaShare("");
            }}
            className="px-3 py-1.5 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
          >
            {PAYERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {["Shared", "Felix", "Sophie"].includes(editPayer) && (
          <div className="relative">
            <span className="absolute left-3 top-1.5 text-purple-400 text-[10px] font-bold">Lydia $</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editLydiaShare}
              onChange={(e) => setEditLydiaShare(e.target.value)}
              placeholder="0.00"
              className="w-full pl-16 pr-3 py-1.5 rounded-xl border-purple-200 bg-purple-50 focus:border-purple-400 focus:ring-purple-400 text-sm"
            />
          </div>
        )}
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="w-full px-3 py-1.5 rounded-xl border-gray-200 bg-cat-cream/30 focus:border-cat-orange focus:ring-cat-orange text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancelEdit}
            disabled={isPending}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition flex items-center gap-1"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-cat-dark text-white rounded-xl hover:bg-gray-800 transition flex items-center gap-1"
          >
            <Check size={14} /> Save
          </button>
        </div>
      </div>
    );
  }

  if (confirmingDelete) {
    return (
      <div className={`bg-red-50 p-4 rounded-2xl shadow-sm border border-red-200 flex items-center justify-between ${isPending ? "opacity-50" : ""}`}>
        <span className="text-sm font-bold text-red-700">Delete &quot;{t.description}&quot;?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-bold"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-white text-gray-600 rounded-xl hover:bg-gray-100 transition font-bold border border-gray-200"
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-cat-cream flex items-center justify-center text-cat-dark">
          <CategoryIcon category={t.category as any} />
        </div>
        <div>
          <p className="font-bold text-gray-800">{t.description}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getPayerBadge(t.payer as PayerType)}
            {t.lydiaShare && parseFloat(String(t.lydiaShare)) > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-purple-200">
                Lydia: ${parseFloat(String(t.lydiaShare)).toFixed(2)}
              </span>
            )}
            <span className="text-xs text-gray-400">{t.date}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 rounded-full">{t.category}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg text-cat-dark">-${amount.toFixed(2)}</span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-gray-300 hover:text-cat-orange transition"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setConfirmingDelete(true)}
          className="text-gray-300 hover:text-red-400 transition"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
