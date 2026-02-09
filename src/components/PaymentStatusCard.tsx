"use client";

import { useState } from "react";
import { DollarSign, CheckCircle, Circle, Loader2 } from "lucide-react";
import { confirmMonthlyPayment, unconfirmMonthlyPayment } from "@/lib/payment-actions";
import { FELIX, SOPHIE } from "@/lib/constants";
import { melbourneYearMonth } from "@/lib/melbourne-time";
import type { MonthlyPayment } from "@/lib/schema";

interface PaymentStatusCardProps {
  paymentStatus: { felix: MonthlyPayment | null; sophie: MonthlyPayment | null };
}

function PayerRow({
  name,
  avatar,
  amount,
  color,
  payment,
}: {
  name: string;
  avatar: string;
  amount: number;
  color: string;
  payment: MonthlyPayment | null;
}) {
  const [loading, setLoading] = useState(false);
  const confirmed = !!payment;

  async function handleToggle() {
    setLoading(true);
    try {
      if (confirmed) {
        await unconfirmMonthlyPayment({ payer: name });
      } else {
        await confirmMonthlyPayment({ payer: name });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        confirmed ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{avatar}</span>
        <div>
          <span className="font-bold text-cat-dark">{name}</span>
          <span className="ml-2 font-bold" style={{ color }}>
            ${amount.toLocaleString()}
          </span>
          {confirmed && payment.confirmedBy && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Confirmed by {payment.confirmedBy}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
          confirmed
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-cat-teal text-white hover:bg-teal-600"
        }`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : confirmed ? (
          <CheckCircle size={16} />
        ) : (
          <Circle size={16} />
        )}
        {loading ? "" : confirmed ? "Confirmed" : "Confirm"}
      </button>
    </div>
  );
}

export function PaymentStatusCard({ paymentStatus }: PaymentStatusCardProps) {
  const ym = melbourneYearMonth();
  const [yearStr, monthStr] = ym.split("-");

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-teal-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-cat-teal/10 p-2 rounded-xl">
          <DollarSign size={20} className="text-cat-teal" />
        </div>
        <div>
          <h3 className="font-bold text-cat-dark text-lg">Monthly Payment</h3>
          <p className="text-xs text-gray-400">
            {yearStr}年{parseInt(monthStr)}月 打款状态
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <PayerRow
          name={FELIX.name}
          avatar={FELIX.avatar}
          amount={FELIX.monthlyContribution}
          color={FELIX.color}
          payment={paymentStatus.felix}
        />
        <PayerRow
          name={SOPHIE.name}
          avatar={SOPHIE.avatar}
          amount={SOPHIE.monthlyContribution}
          color={SOPHIE.color}
          payment={paymentStatus.sophie}
        />
      </div>
    </div>
  );
}
