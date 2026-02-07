"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import type { Transaction } from "@/lib/schema";
import type { PayerType } from "@/lib/types";
import { deleteTransaction } from "@/lib/actions";
import { CategoryIcon } from "./CatIcon";

interface TransactionItemProps {
  transaction: Transaction;
}

function getPayerBadge(payer: PayerType) {
  if (payer === "Shared") return <span className="bg-cat-orange/20 text-cat-brown px-2 py-1 rounded-md text-xs font-bold border border-cat-orange/30">Shared</span>;
  if (payer === "Felix") return <span className="bg-cat-teal/20 text-cat-teal px-2 py-1 rounded-md text-xs font-bold border border-cat-teal/30">Felix</span>;
  if (payer === "SharedAll") return <span className="bg-cat-purple/20 text-cat-purple px-2 py-1 rounded-md text-xs font-bold border border-cat-purple/30">All 3</span>;
  if (payer === "Lydia") return <span className="bg-cat-purple/20 text-cat-purple px-2 py-1 rounded-md text-xs font-bold border border-cat-purple/30">Lydia</span>;
  return <span className="bg-cat-brown/20 text-cat-brown px-2 py-1 rounded-md text-xs font-bold border border-cat-brown/30">Sophie</span>;
}

export function TransactionItem({ transaction: t }: TransactionItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTransaction(t.id);
    });
  };

  return (
    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition ${isPending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-cat-cream flex items-center justify-center text-cat-dark">
          <CategoryIcon category={t.category as any} />
        </div>
        <div>
          <p className="font-bold text-gray-800">{t.description}</p>
          <div className="flex items-center gap-2 mt-1">
            {getPayerBadge(t.payer as PayerType)}
            <span className="text-xs text-gray-400">{t.date}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 rounded-full">{t.category}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg text-cat-dark">-${t.amount.toFixed(2)}</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
