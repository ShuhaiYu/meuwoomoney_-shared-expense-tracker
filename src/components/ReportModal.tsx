"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Loader2, Cat, PiggyBank, Target, ChevronDown, ChevronUp, Calendar } from "lucide-react";
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
  filterDate: string;
}

export function ReportModal({ isOpen, onClose, stats, transactions, isGuest, filterDate }: ReportModalProps) {
  const [advice, setAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAllFelix, setShowAllFelix] = useState(false);
  const [showAllSophie, setShowAllSophie] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const lydiaReportRef = useRef<HTMLDivElement>(null);

  const displayMonth = (() => {
    const [year, month] = filterDate.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
  })();

  useEffect(() => {
    if (!isOpen) {
      setAdvice("");
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
      setAdvice("聪明饼饼正在追逗猫棒，暂时无法回答喵~ (API Error)");
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
      const html2canvas = (await import("html2canvas-pro")).default;
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

      pdf.save(`MeuwooMoney_Report_${filterDate}.pdf`);
    } finally {
      setShowAllFelix(prevFelixState);
      setShowAllSophie(prevSophieState);
    }
  };

  const generateLydiaPDF = async () => {
    if (!lydiaReportRef.current) return;

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(lydiaReportRef.current, {
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

      pdf.save(`MeuwooMoney_Lydia_Settlement_${filterDate}.pdf`);
    } catch {
      // PDF generation failed silently
    }
  };

  const savingsProgress = Math.min((stats.netSavings / ANNUAL_SAVINGS_GOAL) * 100, 100);
  const remainingGoal = Math.max(ANNUAL_SAVINGS_GOAL - stats.netSavings, 0);

  const felixTx = transactions.filter((t) => t.payer === "Felix" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia");
  const sophieTx = transactions.filter((t) => t.payer === "Sophie" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia");
  const lydiaTx = transactions.filter((t) => t.payer === "SharedAll" || t.payer === "Lydia");

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
      <div key={t.id} className="flex justify-between items-center text-sm p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span className="font-bold text-gray-700 truncate">{t.description}</span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1"><Calendar size={10} /> {t.date}</div>
            <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wider ${payerBadgeClass}`}>
              {payerLabel}
            </span>
            <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              {t.category}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:max-w-4xl rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header Control */}
        <div className="p-3 sm:p-4 bg-cat-dark text-white flex justify-between items-center shrink-0">
          <h2 className="text-base sm:text-xl font-bold flex items-center gap-2">
            <Cat size={20} /> <span className="hidden sm:inline">Monthly Report Preview</span><span className="sm:hidden">Report</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="bg-cat-orange hover:bg-cat-brown text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition"
            >
              <Download size={16} /> <span className="hidden sm:inline">Save</span> PDF
            </button>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="overflow-y-auto p-3 sm:p-8 bg-cat-cream" id="report-container">
          <div ref={reportRef} className="bg-white max-w-3xl mx-auto p-4 sm:p-8 shadow-sm space-y-8 sm:space-y-12">

            {/* Page 1: Shared Overview */}
            <section className="space-y-5 sm:space-y-6 border-b-4 border-dashed border-cat-orange/30 pb-8 sm:pb-12">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-cat-dark">{displayMonth} Meow Report</h1>
                <p className="text-sm sm:text-base text-gray-500">Shared Expenses & Family Budget</p>
                <div className="flex justify-center my-3 sm:my-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cat-orange/20 rounded-full flex items-center justify-center">
                    <PawIcon className="w-6 h-6 sm:w-8 sm:h-8 text-cat-orange" />
                  </div>
                </div>
              </div>

              {/* Savings & Goals Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-6 rounded-2xl border border-green-100 flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                    <PiggyBank size={20} /> Household Savings
                  </div>
                  <p className={`text-3xl sm:text-4xl font-bold ${stats.netSavings >= 0 ? "text-green-600" : "text-red-500"}`}>
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
            <section className="space-y-5 sm:space-y-6 border-b-4 border-dashed border-cat-teal/30 pb-8 sm:pb-12 break-before-page">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl">{FELIX.avatar}</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-cat-dark">{FELIX.name}&apos;s Breakdown</h2>
                  <p className="text-sm text-gray-500">The Boy Cat</p>
                </div>
              </div>

              <div className="bg-cat-teal/5 p-4 sm:p-6 rounded-2xl border border-cat-teal/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Monthly Contribution</p>
                    <p className="text-2xl sm:text-3xl font-bold text-cat-teal">
                      ${FELIX.monthlyContribution}
                      {stats.felixExtraDeposits > 0 && (
                        <span className="text-sm text-blue-500 ml-1">+${stats.felixExtraDeposits.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Remaining</p>
                    <p className={`text-xl sm:text-2xl font-bold ${(FELIX.monthlyContribution + stats.felixExtraDeposits) - stats.felixTotalResponsibility >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${((FELIX.monthlyContribution + stats.felixExtraDeposits) - stats.felixTotalResponsibility).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-cat-teal h-full rounded-full"
                    style={{ width: `${Math.min((stats.felixTotalResponsibility / (FELIX.monthlyContribution + stats.felixExtraDeposits)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Used {Math.round((stats.felixTotalResponsibility / (FELIX.monthlyContribution + stats.felixExtraDeposits)) * 100)}% of budget
                </p>
              </div>

              <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
                <h3 className="font-bold text-cat-dark mb-4 text-sm sm:text-base">Expense Distribution & Limits Analysis</h3>
                <ChartsSection breakdown={stats.felixCategoryBreakdown} limitMultiplier={0.5} />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-cat-dark text-sm sm:text-base">Personal & Shared Expenses</h3>
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
            <section className="space-y-5 sm:space-y-6 border-b-4 border-dashed border-cat-brown/30 pb-8 sm:pb-12 break-before-page">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl">{SOPHIE.avatar}</div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-cat-dark">{SOPHIE.name}&apos;s Breakdown</h2>
                  <p className="text-sm text-gray-500">The Girl Cat</p>
                </div>
              </div>

              <div className="bg-cat-brown/5 p-4 sm:p-6 rounded-2xl border border-cat-brown/20">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Monthly Contribution</p>
                    <p className="text-2xl sm:text-3xl font-bold text-cat-brown">
                      ${SOPHIE.monthlyContribution}
                      {stats.sophieExtraDeposits > 0 && (
                        <span className="text-sm text-blue-500 ml-1">+${stats.sophieExtraDeposits.toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Remaining</p>
                    <p className={`text-xl sm:text-2xl font-bold ${(SOPHIE.monthlyContribution + stats.sophieExtraDeposits) - stats.sophieTotalResponsibility >= 0 ? "text-green-500" : "text-red-500"}`}>
                      ${((SOPHIE.monthlyContribution + stats.sophieExtraDeposits) - stats.sophieTotalResponsibility).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-cat-brown h-full rounded-full"
                    style={{ width: `${Math.min((stats.sophieTotalResponsibility / (SOPHIE.monthlyContribution + stats.sophieExtraDeposits)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Used {Math.round((stats.sophieTotalResponsibility / (SOPHIE.monthlyContribution + stats.sophieExtraDeposits)) * 100)}% of budget
                </p>
              </div>

              <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
                <h3 className="font-bold text-cat-dark mb-4 text-sm sm:text-base">Expense Distribution & Limits Analysis</h3>
                <ChartsSection breakdown={stats.sophieCategoryBreakdown} limitMultiplier={0.5} />
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-cat-dark text-sm sm:text-base">Personal & Shared Expenses</h3>
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
              <section className="space-y-5 sm:space-y-6 border-b-4 border-dashed border-cat-purple/30 pb-8 sm:pb-12 break-before-page">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-3xl sm:text-4xl">{LYDIA.avatar}</div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-cat-dark">Roommate Settlement</h2>
                    <p className="text-sm text-gray-500">{LYDIA.name}&apos;s Shared Expenses</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-cat-purple/5 p-3 sm:p-4 rounded-2xl border border-cat-purple/20 flex sm:flex-col sm:text-center items-center sm:items-stretch justify-between">
                    <p className="text-xs font-bold text-gray-500 sm:mb-1">{LYDIA.name} Owes</p>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-cat-purple">${stats.lydiaOwes.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 sm:mt-1 hidden sm:block">1/3 of couple-paid</p>
                    </div>
                  </div>
                  <div className="bg-cat-purple/5 p-3 sm:p-4 rounded-2xl border border-cat-purple/20 flex sm:flex-col sm:text-center items-center sm:items-stretch justify-between">
                    <p className="text-xs font-bold text-gray-500 sm:mb-1">Couple Owes</p>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-cat-purple">${stats.coupleOwesLydia.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 sm:mt-1 hidden sm:block">2/3 of Lydia-paid</p>
                    </div>
                  </div>
                  <div className={`p-3 sm:p-4 rounded-2xl border flex sm:flex-col sm:text-center items-center sm:items-stretch justify-between ${stats.lydiaNetBalance >= 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                    <p className="text-xs font-bold text-gray-500 sm:mb-1">Net Balance</p>
                    <div>
                      <p className={`text-xl sm:text-2xl font-bold ${stats.lydiaNetBalance >= 0 ? "text-green-600" : "text-orange-600"}`}>
                        ${Math.abs(stats.lydiaNetBalance).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400 sm:mt-1 hidden sm:block">
                        {stats.lydiaNetBalance >= 0 ? `${LYDIA.name} pays couple` : `Couple pays ${LYDIA.name}`}
                      </p>
                    </div>
                  </div>
                </div>

                {stats.lydiaTransfers > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-2xl border border-blue-200 flex sm:flex-col sm:text-center items-center sm:items-stretch justify-between">
                      <p className="text-xs font-bold text-gray-500 sm:mb-1">{LYDIA.name} Transferred</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">${stats.lydiaTransfers.toFixed(2)}</p>
                    </div>
                    <div className={`p-3 sm:p-4 rounded-2xl border flex sm:flex-col sm:text-center items-center sm:items-stretch justify-between ${Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                      <p className="text-xs font-bold text-gray-500 sm:mb-1">Remaining After Transfers</p>
                      <p className={`text-xl sm:text-2xl font-bold ${Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "text-green-600" : "text-orange-600"}`}>
                        ${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {!isGuest && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={generateLydiaPDF}
                      className="bg-cat-purple hover:bg-cat-purple/80 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition"
                    >
                      <Download size={16} /> Save PDF for Lydia
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Page 5: AI Advice */}
            <section className="space-y-5 sm:space-y-6 break-before-page">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-full text-3xl">
                  🐱
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-cat-dark">聪明饼饼的建议</h2>
              </div>

              {isGuest ? (
                <div className="prose prose-orange max-w-none bg-yellow-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-yellow-200 relative">
                  <span className="absolute top-3 left-3 sm:top-4 sm:left-4 text-4xl sm:text-6xl text-yellow-200 font-serif opacity-50">&ldquo;</span>
                  <div className="markdown-body whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm sm:text-base pl-6 sm:pl-0">
                    聪明饼饼的AI理财建议仅对登录用户开放喵~ 登录后即可获取基于你消费习惯的个性化建议！
                  </div>
                  <div className="mt-4 sm:mt-6 flex justify-end">
                    <a href="/auth/sign-in" className="text-sm font-bold text-cat-orange hover:underline">
                      Sign in for AI advice
                    </a>
                  </div>
                </div>
              ) : loadingAdvice ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400">
                  <Loader2 className="animate-spin mb-4" size={40} />
                  <p className="text-sm sm:text-base">聪明饼饼正在思考中...</p>
                </div>
              ) : advice ? (
                <div className="prose prose-orange max-w-none bg-yellow-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-yellow-200 relative">
                  <span className="absolute top-3 left-3 sm:top-4 sm:left-4 text-4xl sm:text-6xl text-yellow-200 font-serif opacity-50">&ldquo;</span>
                  <div className="markdown-body whitespace-pre-wrap font-sans text-gray-700 leading-relaxed text-sm sm:text-base pl-6 sm:pl-0">
                    {advice}
                  </div>
                  <div className="mt-4 sm:mt-6 flex justify-end">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
                      Generated by Gemini <Cat size={16} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                  <button
                    onClick={fetchAdvice}
                    className="bg-cat-orange hover:bg-cat-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm sm:text-base transition"
                  >
                    <PawIcon className="w-5 h-5" /> 问问聪明饼饼
                  </button>
                  <p className="text-xs text-gray-400 mt-3">Get AI-powered financial advice</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      {/* Hidden Lydia Report for PDF generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={lydiaReportRef} style={{ width: 700, padding: 40, backgroundColor: "#FDF6E3", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: "bold", color: "#264653", marginBottom: 8 }}>
              {displayMonth} Settlement Statement
            </h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>
              {LYDIA.name}&apos;s Shared Expense Summary
            </p>
          </div>

          {/* Transaction Details */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", color: "#264653", marginBottom: 16, borderBottom: "2px solid #9B59B6", paddingBottom: 8 }}>
              Transaction Details
            </h2>
            {lydiaTx.length === 0 ? (
              <p style={{ fontSize: 14, color: "#9ca3af", fontStyle: "italic" }}>No shared expenses recorded.</p>
            ) : (
              <div>
                {lydiaTx.map((t) => {
                  const rawAmount = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
                  const thirdAmount = rawAmount / 3;
                  const payerLabel = t.payer === "SharedAll" ? "All 3" : t.payer;
                  return (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", marginBottom: 8, backgroundColor: "white", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#374151", fontSize: 14 }}>{t.description}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                          {t.date} &middot; <span style={{ color: "#9B59B6", fontWeight: "bold" }}>{payerLabel}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "bold", color: "#374151", fontSize: 14 }}>
                          ${thirdAmount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          Total: ${rawAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settlement Summary */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: "bold", color: "#264653", marginBottom: 16, borderBottom: "2px solid #9B59B6", paddingBottom: 8 }}>
              Settlement Summary
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ backgroundColor: "white", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#6b7280", marginBottom: 4 }}>{LYDIA.name} Owes</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: "#9B59B6" }}>${stats.lydiaOwes.toFixed(2)}</p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>1/3 of couple-paid</p>
              </div>
              <div style={{ backgroundColor: "white", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#6b7280", marginBottom: 4 }}>Couple Owes {LYDIA.name}</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: "#9B59B6" }}>${stats.coupleOwesLydia.toFixed(2)}</p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>2/3 of Lydia-paid</p>
              </div>
              <div style={{ backgroundColor: stats.lydiaNetBalance >= 0 ? "#f0fdf4" : "#fff7ed", padding: 16, borderRadius: 12, border: `1px solid ${stats.lydiaNetBalance >= 0 ? "#bbf7d0" : "#fed7aa"}`, textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: "bold", color: "#6b7280", marginBottom: 4 }}>Net Balance</p>
                <p style={{ fontSize: 24, fontWeight: "bold", color: stats.lydiaNetBalance >= 0 ? "#16a34a" : "#ea580c" }}>
                  ${Math.abs(stats.lydiaNetBalance).toFixed(2)}
                </p>
                <p style={{ fontSize: 10, color: "#9ca3af" }}>
                  {stats.lydiaNetBalance >= 0 ? `${LYDIA.name} pays couple` : `Couple pays ${LYDIA.name}`}
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Info */}
          {stats.lydiaTransfers > 0 && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: "bold", color: "#264653", marginBottom: 16, borderBottom: "2px solid #3b82f6", paddingBottom: 8 }}>
                Transfer Records
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ backgroundColor: "#eff6ff", padding: 16, borderRadius: 12, border: "1px solid #bfdbfe", textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#6b7280", marginBottom: 4 }}>{LYDIA.name} Transferred</p>
                  <p style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>${stats.lydiaTransfers.toFixed(2)}</p>
                </div>
                <div style={{ backgroundColor: Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "#f0fdf4" : "#fff7ed", padding: 16, borderRadius: 12, border: `1px solid ${Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "#bbf7d0" : "#fed7aa"}`, textAlign: "center" }}>
                  <p style={{ fontSize: 12, fontWeight: "bold", color: "#6b7280", marginBottom: 4 }}>Remaining Balance</p>
                  <p style={{ fontSize: 24, fontWeight: "bold", color: Math.abs(stats.lydiaRemainingBalance) < 0.01 ? "#16a34a" : "#ea580c" }}>
                    ${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              Generated by MeuwooMoney &mdash; {displayMonth}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
