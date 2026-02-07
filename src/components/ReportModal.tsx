"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Wand2, Loader2, Cat, PiggyBank, Target, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import type { Transaction } from "@/lib/schema";
import type { MonthlyStats } from "@/lib/types";
import { FELIX, SOPHIE, LYDIA, ANNUAL_SAVINGS_GOAL } from "@/lib/constants";
import { PawIcon } from "./CatIcon";
import { ChartsSection } from "./ChartsSection";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  stats: MonthlyStats;
  isGuest?: boolean;
}

export function ReportModal({ isOpen, onClose, stats, transactions, isGuest }: ReportModalProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAllFelix, setShowAllFelix] = useState(false);
  const [showAllSophie, setShowAllSophie] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !advice && !isGuest) {
      fetchAdvice();
    }
  }, [isOpen]);

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, transactions }),
      });
      const data = await res.json();
      setAdvice(data.advice);
    } catch {
      setAdvice("The financial cat is currently chasing a laser pointer and cannot answer. (API Error)");
    }
    setLoadingAdvice(false);
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    const prevFelixState = showAllFelix;
    const prevSophieState = showAllSophie;
    setShowAllFelix(true);
    setShowAllSophie(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#FDF6E3",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfImgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`MeuwooMoney_Report_${new Date().toISOString().slice(0, 7)}.pdf`);
    } finally {
      setShowAllFelix(prevFelixState);
      setShowAllSophie(prevSophieState);
    }
  };

  const savingsProgress = Math.min((stats.netSavings / ANNUAL_SAVINGS_GOAL) * 100, 100);
  const remainingGoal = Math.max(ANNUAL_SAVINGS_GOAL - stats.netSavings, 0);

  const felixTx = transactions.filter((t) => t.payer === "Felix" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia");
  const sophieTx = transactions.filter((t) => t.payer === "Sophie" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia");

  const visibleFelixTx = showAllFelix ? felixTx : felixTx.slice(0, 5);
  const visibleSophieTx = showAllSophie ? sophieTx : sophieTx.slice(0, 5);

  const renderTransactionRow = (t: Transaction, colorClass: string) => {
    const isShared = t.payer === "Shared";
    const isThreeWay = t.payer === "SharedAll" || t.payer === "Lydia";
    const rawAmount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
    const displayAmount = isThreeWay ? rawAmount / 3 : isShared ? rawAmount / 2 : rawAmount;
    const isSplit = isShared || isThreeWay;

    const payerBadgeClass = isThreeWay
      ? "bg-cat-purple/10 text-cat-purple"
      : isShared
        ? "bg-cat-orange/10 text-cat-orange"
        : colorClass;

    const payerLabel = t.payer === "SharedAll" ? "All 3" : t.payer;

    return (
      <div key={t.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-gray-700">{t.description}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1"><Calendar size={10} /> {t.date}</div>
            <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wider ${payerBadgeClass}`}>
              {payerLabel}
            </span>
            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              {t.category}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-gray-800 block">-${displayAmount.toFixed(2)}</span>
          {isSplit && (
            <span className="text-[10px] text-gray-400 block">Total: -${rawAmount.toFixed(2)}</span>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Control */}
        <div className="p-4 bg-cat-dark text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cat /> Monthly Report Preview
          </h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="bg-cat-orange hover:bg-cat-brown text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition"
            >
              <Download size={16} /> Save PDF
            </button>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="overflow-y-auto p-8 bg-cat-cream" id="report-container">
          <div ref={reportRef} className="bg-white max-w-3xl mx-auto min-h-[1000px] p-8 shadow-sm space-y-12">

            {/* Page 1: Shared Overview */}
            <section className="space-y-6 border-b-4 border-dashed border-cat-orange/30 pb-12">
              <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-cat-dark">Monthly Meow Report</h1>
                <p className="text-gray-500">Shared Expenses & Family Budget</p>
                <div className="flex justify-center my-4">
                  <div className="w-16 h-16 bg-cat-orange/20 rounded-full flex items-center justify-center">
                    <PawIcon className="w-8 h-8 text-cat-orange" />
                  </div>
                </div>
              </div>

              {/* Savings & Goals Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                    <PiggyBank size={20} /> Household Savings
                  </div>
                  <p className={`text-4xl font-bold ${stats.netSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ${stats.netSavings.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.netSavings >= 0 ? "Saved this month!" : "Overspent this month!"}
                  </p>
                </div>
                <div className="flex-1 border-t sm:border-t-0 sm:border-l border-green-200 pt-4 sm:pt-0 sm:pl-8">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
                    <Target size={20} /> Annual Goal: ${ANNUAL_SAVINGS_GOAL.toLocaleString()}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(savingsProgress, 0)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    ${remainingGoal.toLocaleString()} more to reach goal
                  </p>
                </div>
              </div>

              <ChartsSection breakdown={stats.categoryBreakdown} limitMultiplier={1} />
            </section>

            {/* Page 2: Felix */}
            <section className="space-y-6 border-b-4 border-dashed border-cat-teal/30 pb-12 break-before-page">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{FELIX.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-cat-dark">{FELIX.name}&apos;s Breakdown</h2>
                  <p className="text-gray-500">The Boy Cat</p>
                </div>
              </div>

              <div className="bg-cat-teal/5 p-6 rounded-2xl border border-cat-teal/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-500">Monthly Contribution</p>
                    <p className="text-3xl font-bold text-cat-teal">${FELIX.monthlyContribution}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-500">Remaining</p>
                    <p className={`text-2xl font-bold ${FELIX.monthlyContribution - stats.felixTotalResponsibility >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${(FELIX.monthlyContribution - stats.felixTotalResponsibility).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-cat-teal h-full rounded-full"
                    style={{ width: `${Math.min((stats.felixTotalResponsibility / FELIX.monthlyContribution) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Used {Math.round((stats.felixTotalResponsibility / FELIX.monthlyContribution) * 100)}% of budget
                </p>
              </div>

              <div className="mt-8 mb-8">
                <h3 className="font-bold text-cat-dark mb-4">Expense Distribution & Limits Analysis</h3>
                <ChartsSection breakdown={stats.felixCategoryBreakdown} limitMultiplier={0.5} />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-cat-dark">Personal & Shared Expenses</h3>
                {felixTx.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No expenses recorded.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {visibleFelixTx.map((t) => renderTransactionRow(t, "bg-cat-teal/10 text-cat-teal"))}
                    </div>
                    {felixTx.length > 5 && (
                      <button
                        onClick={() => setShowAllFelix(!showAllFelix)}
                        className="w-full text-center text-xs font-bold text-cat-teal hover:bg-cat-teal/10 py-3 rounded-xl transition flex items-center justify-center gap-1 mt-2"
                      >
                        {showAllFelix ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View All ({felixTx.length})</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Page 3: Sophie */}
            <section className="space-y-6 border-b-4 border-dashed border-cat-brown/30 pb-12 break-before-page">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{SOPHIE.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-cat-dark">{SOPHIE.name}&apos;s Breakdown</h2>
                  <p className="text-gray-500">The Girl Cat</p>
                </div>
              </div>

              <div className="bg-cat-brown/5 p-6 rounded-2xl border border-cat-brown/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-sm font-bold text-gray-500">Monthly Contribution</p>
                    <p className="text-3xl font-bold text-cat-brown">${SOPHIE.monthlyContribution}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-500">Remaining</p>
                    <p className={`text-2xl font-bold ${SOPHIE.monthlyContribution - stats.sophieTotalResponsibility >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${(SOPHIE.monthlyContribution - stats.sophieTotalResponsibility).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-cat-brown h-full rounded-full"
                    style={{ width: `${Math.min((stats.sophieTotalResponsibility / SOPHIE.monthlyContribution) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Used {Math.round((stats.sophieTotalResponsibility / SOPHIE.monthlyContribution) * 100)}% of budget
                </p>
              </div>

              <div className="mt-8 mb-8">
                <h3 className="font-bold text-cat-dark mb-4">Expense Distribution & Limits Analysis</h3>
                <ChartsSection breakdown={stats.sophieCategoryBreakdown} limitMultiplier={0.5} />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-cat-dark">Personal & Shared Expenses</h3>
                {sophieTx.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No expenses recorded.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {visibleSophieTx.map((t) => renderTransactionRow(t, "bg-cat-brown/10 text-cat-brown"))}
                    </div>
                    {sophieTx.length > 5 && (
                      <button
                        onClick={() => setShowAllSophie(!showAllSophie)}
                        className="w-full text-center text-xs font-bold text-cat-brown hover:bg-cat-brown/10 py-3 rounded-xl transition flex items-center justify-center gap-1 mt-2"
                      >
                        {showAllSophie ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View All ({sophieTx.length})</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Page 4: Lydia Settlement */}
            {(stats.totalSharedAll > 0 || stats.totalLydiaPaid > 0) && (
              <section className="space-y-6 border-b-4 border-dashed border-cat-purple/30 pb-12 break-before-page">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{LYDIA.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-cat-dark">Roommate Settlement</h2>
                    <p className="text-gray-500">{LYDIA.name}&apos;s Shared Expenses</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-cat-purple/5 p-4 rounded-2xl border border-cat-purple/20 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">{LYDIA.name} Owes</p>
                    <p className="text-2xl font-bold text-cat-purple">${stats.lydiaOwes.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">1/3 of couple-paid</p>
                  </div>
                  <div className="bg-cat-purple/5 p-4 rounded-2xl border border-cat-purple/20 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1">Couple Owes</p>
                    <p className="text-2xl font-bold text-cat-purple">${stats.coupleOwesLydia.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">2/3 of Lydia-paid</p>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${stats.lydiaNetBalance >= 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                    <p className="text-xs font-bold text-gray-500 mb-1">Net Balance</p>
                    <p className={`text-2xl font-bold ${stats.lydiaNetBalance >= 0 ? "text-green-600" : "text-orange-600"}`}>
                      ${Math.abs(stats.lydiaNetBalance).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {stats.lydiaNetBalance >= 0 ? `${LYDIA.name} pays couple` : `Couple pays ${LYDIA.name}`}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Page 5: AI Advice */}
            <section className="space-y-6 break-before-page min-h-[400px]">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <Wand2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-cat-dark">Professor Paws&apos; Advice</h2>
              </div>

              {isGuest ? (
                <div className="prose prose-orange max-w-none bg-yellow-50 p-8 rounded-3xl border-2 border-yellow-200 relative">
                  <span className="absolute top-4 left-4 text-6xl text-yellow-200 font-serif opacity-50">&ldquo;</span>
                  <div className="markdown-body whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    AI-powered financial advice from Professor Paws is available for signed-in users. Sign in to get personalized tips based on your spending habits!
                  </div>
                  <div className="mt-6 flex justify-end">
                    <a href="/auth/sign-in" className="text-sm font-bold text-cat-orange hover:underline">
                      Sign in for AI advice
                    </a>
                  </div>
                </div>
              ) : loadingAdvice ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  <p>Consulting with the Grand Cat Council...</p>
                </div>
              ) : (
                <div className="prose prose-orange max-w-none bg-yellow-50 p-8 rounded-3xl border-2 border-yellow-200 relative">
                  <span className="absolute top-4 left-4 text-6xl text-yellow-200 font-serif opacity-50">&ldquo;</span>
                  <div className="markdown-body whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {advice}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-bold uppercase tracking-wider">
                      Generated by Gemini <Cat size={16} />
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
