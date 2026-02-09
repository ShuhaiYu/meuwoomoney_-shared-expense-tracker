"use client";

import { useState } from "react";
import { Wallet, Plus, Trash2, Loader2, X } from "lucide-react";
import { addDeposit, deleteDeposit } from "@/lib/deposit-actions";
import { FELIX, SOPHIE, LYDIA } from "@/lib/constants";
import { melbourneToday } from "@/lib/melbourne-time";
import type { Deposit } from "@/lib/schema";

const DEPOSITOR_OPTIONS = [
  { value: "Felix", label: "Felix Extra Deposit", avatar: FELIX.avatar, activeClass: "bg-cat-teal/10 border-cat-teal/40 text-cat-teal" },
  { value: "Sophie", label: "Sophie Extra Deposit", avatar: SOPHIE.avatar, activeClass: "bg-cat-brown/10 border-cat-brown/40 text-cat-brown" },
  { value: "Lydia", label: "Lydia Transfer", avatar: LYDIA.avatar, activeClass: "bg-cat-purple/10 border-cat-purple/40 text-cat-purple" },
] as const;

interface DepositsCardProps {
  deposits: Deposit[];
  filterDate: string;
}

export function DepositsCard({ deposits, filterDate }: DepositsCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDepositor, setSelectedDepositor] = useState<string>("Felix");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => melbourneToday());
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await addDeposit({
        yearMonth: filterDate,
        depositor: selectedDepositor,
        amount: parseFloat(amount),
        description: description.trim(),
        date,
      });
      if (result.success) {
        setShowForm(false);
        setAmount("");
        setDescription("");
        setDate(melbourneToday());
      } else {
        setError(result.error ?? "Failed to add deposit");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteDeposit(id);
    } finally {
      setDeletingId(null);
    }
  }

  const felixDeposits = deposits.filter((d) => d.depositor === "Felix");
  const sophieDeposits = deposits.filter((d) => d.depositor === "Sophie");
  const lydiaDeposits = deposits.filter((d) => d.depositor === "Lydia");

  const groups = [
    { name: FELIX.name, avatar: FELIX.avatar, color: "cat-teal", items: felixDeposits },
    { name: SOPHIE.name, avatar: SOPHIE.avatar, color: "cat-brown", items: sophieDeposits },
    { name: LYDIA.name, avatar: LYDIA.avatar, color: "cat-purple", items: lydiaDeposits },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl">
            <Wallet size={20} className="text-blue-500" />
          </div>
          <h3 className="font-bold text-cat-dark text-lg">Extra Deposits & Transfers</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition ${
            showForm
              ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
          <div className="flex gap-2">
            {DEPOSITOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDepositor(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition border-2 ${
                  selectedDepositor === opt.value
                    ? opt.activeClass
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span>{opt.avatar}</span>
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.value}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              placeholder="e.g. Extra contribution, Lydia payment..."
            />
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {loading ? "Adding..." : "Add Deposit"}
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-4">
          No extra deposits or transfers this month.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{group.avatar}</span>
                <span className="text-sm font-bold text-gray-600">{group.name}</span>
                <span className="text-xs text-gray-400">
                  (${group.items.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(2)})
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-700 truncate">{d.description}</p>
                      <p className="text-xs text-gray-400">{d.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-sm font-bold text-blue-600">
                        +${parseFloat(d.amount).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        {deletingId === d.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
