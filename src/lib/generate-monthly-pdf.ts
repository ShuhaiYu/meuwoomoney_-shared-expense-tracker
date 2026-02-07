import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Transaction } from "./schema";
import type { MonthlyStats, Category } from "./types";
import { FELIX, SOPHIE, CATEGORIES, CATEGORY_LIMITS, ANNUAL_SAVINGS_GOAL } from "./constants";

// Brand colors
const DARK = "#264653";
const TEAL = "#2A9D8F";
const BROWN = "#E76F51";
const ORANGE = "#F4A261";
const PURPLE = "#9B59B6";
const CREAM = "#FDF6E3";

interface GeneratePdfParams {
  stats: MonthlyStats;
  transactions: Transaction[];
  monthLabel: string;
  yearToDateSavings: number;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function addFooter(doc: jsPDF, monthLabel: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(DARK));
    doc.text(`MeuwooMoney Monthly Report — ${monthLabel}`, 20, 285);
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: "right" });
  }
}

export function generateMonthlyReportPdf({ stats, transactions, monthLabel, yearToDateSavings }: GeneratePdfParams): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Page 1: Overview ──
  // Header bar
  doc.setFillColor(...hexToRgb(DARK));
  doc.rect(0, 0, 210, 40, "F");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("Monthly Meow Report", 105, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(monthLabel, 105, 32, { align: "center" });

  // Net savings highlight
  const savingsColor = stats.netSavings >= 0 ? TEAL : BROWN;
  doc.setFillColor(...hexToRgb(CREAM));
  doc.roundedRect(20, 50, 170, 30, 4, 4, "F");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(DARK));
  doc.text("Net Savings This Month", 105, 60, { align: "center" });
  doc.setFontSize(22);
  doc.setTextColor(...hexToRgb(savingsColor));
  doc.text(fmt(stats.netSavings), 105, 73, { align: "center" });

  // Annual goal progress bar
  const goalPct = Math.min(Math.max(yearToDateSavings / ANNUAL_SAVINGS_GOAL, 0), 1);
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(DARK));
  doc.text(`Annual Savings Goal: ${fmt(yearToDateSavings)} / ${fmt(ANNUAL_SAVINGS_GOAL)}`, 20, 95);

  // Progress bar background
  doc.setFillColor(220, 220, 220);
  doc.roundedRect(20, 99, 170, 8, 3, 3, "F");
  // Progress bar fill
  if (goalPct > 0) {
    doc.setFillColor(...hexToRgb(TEAL));
    doc.roundedRect(20, 99, Math.max(170 * goalPct, 6), 8, 3, 3, "F");
  }
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`${(goalPct * 100).toFixed(0)}%`, 20 + 170 * goalPct / 2, 104.5, { align: "center" });

  // Summary table
  autoTable(doc, {
    startY: 115,
    head: [["Metric", "Amount"]],
    body: [
      ["Total Income", fmt(stats.totalIncome)],
      ["Total Spent", fmt(stats.totalSpent)],
      ["Net Savings", fmt(stats.netSavings)],
    ],
    theme: "grid",
    headStyles: { fillColor: hexToRgb(DARK), textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });

  // ── Page 2: Category Breakdown ──
  doc.addPage();
  doc.setFillColor(...hexToRgb(DARK));
  doc.rect(0, 0, 210, 25, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Category Breakdown", 105, 16, { align: "center" });

  const categoryRows = CATEGORIES.map((cat: Category) => {
    const spent = stats.categoryBreakdown[cat];
    const limit = CATEGORY_LIMITS[cat];
    const over = spent > limit;
    return [cat, fmt(spent), fmt(limit), over ? "OVER" : "OK"];
  });

  autoTable(doc, {
    startY: 35,
    head: [["Category", "Spent", "Budget Limit", "Status"]],
    body: categoryRows,
    theme: "grid",
    headStyles: { fillColor: hexToRgb(DARK), textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "center" },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = val === "OVER" ? hexToRgb(BROWN) : hexToRgb(TEAL);
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 20, right: 20 },
  });

  // ── Page 3: Felix ──
  doc.addPage();
  addPersonPage(doc, "Felix", FELIX.color, FELIX.monthlyContribution, stats.felixTotalResponsibility, stats.felixCategoryBreakdown, transactions.filter(t => t.payer === "Felix" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia"));

  // ── Page 4: Sophie ──
  doc.addPage();
  addPersonPage(doc, "Sophie", SOPHIE.color, SOPHIE.monthlyContribution, stats.sophieTotalResponsibility, stats.sophieCategoryBreakdown, transactions.filter(t => t.payer === "Sophie" || t.payer === "Shared" || t.payer === "SharedAll" || t.payer === "Lydia"));

  // ── Page 5: Lydia Settlement (conditional) ──
  if (stats.totalSharedAll > 0 || stats.totalLydiaPaid > 0) {
    doc.addPage();
    addLydiaPage(doc, stats);
  }

  // Add footers
  addFooter(doc, monthLabel);

  // Return as Buffer
  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
}

function addPersonPage(
  doc: jsPDF,
  name: string,
  color: string,
  contribution: number,
  totalResponsibility: number,
  categoryBreakdown: Record<Category, number>,
  relevantTransactions: Transaction[]
) {
  // Header
  doc.setFillColor(...hexToRgb(color));
  doc.rect(0, 0, 210, 25, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(`${name}'s Summary`, 105, 16, { align: "center" });

  // Budget card
  const remaining = contribution - totalResponsibility;
  const remainingColor = remaining >= 0 ? TEAL : BROWN;

  doc.setFillColor(...hexToRgb(CREAM));
  doc.roundedRect(20, 35, 170, 35, 4, 4, "F");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(DARK));
  doc.text(`Monthly Contribution: ${fmt(contribution)}`, 30, 46);
  doc.text(`Total Responsibility: ${fmt(totalResponsibility)}`, 30, 54);
  doc.setTextColor(...hexToRgb(remainingColor));
  doc.setFontSize(12);
  doc.text(`Remaining: ${fmt(remaining)}`, 30, 64);

  // Category breakdown table
  const catRows = CATEGORIES
    .filter((cat: Category) => categoryBreakdown[cat] > 0)
    .map((cat: Category) => [cat, fmt(categoryBreakdown[cat])]);

  if (catRows.length > 0) {
    autoTable(doc, {
      startY: 78,
      head: [["Category", "Amount"]],
      body: catRows,
      theme: "grid",
      headStyles: { fillColor: hexToRgb(color), textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { halign: "right" } },
      margin: { left: 20, right: 20 },
    });
  }

  // Top 5 transactions
  const parseAmt = (v: string | number) => typeof v === "string" ? parseFloat(v) : v;
  const sorted = [...relevantTransactions].sort((a, b) => parseAmt(b.amount) - parseAmt(a.amount)).slice(0, 5);
  if (sorted.length > 0) {
    // Get the Y position after the previous table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lastY = (doc as any).lastAutoTable?.finalY ?? 150;
    const startY = lastY + 10;

    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(DARK));
    doc.text("Top 5 Transactions", 20, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [["Date", "Description", "Category", "Amount"]],
      body: sorted.map(t => [t.date, t.description, t.category, fmt(parseAmt(t.amount))]),
      theme: "grid",
      headStyles: { fillColor: hexToRgb(color), textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 3: { halign: "right" } },
      margin: { left: 20, right: 20 },
    });
  }
}

function addLydiaPage(doc: jsPDF, stats: MonthlyStats) {
  // Header
  doc.setFillColor(...hexToRgb(PURPLE));
  doc.rect(0, 0, 210, 25, "F");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Lydia Settlement", 105, 16, { align: "center" });

  // Net balance highlight
  const netBalance = stats.lydiaNetBalance;
  const absAmount = Math.abs(netBalance);
  const direction = netBalance > 0
    ? `Lydia owes the couple ${fmt(absAmount)}`
    : netBalance < 0
      ? `Couple owes Lydia ${fmt(absAmount)}`
      : "Settled — no balance";
  const balanceColor = netBalance >= 0 ? TEAL : BROWN;

  doc.setFillColor(...hexToRgb(CREAM));
  doc.roundedRect(20, 35, 170, 25, 4, 4, "F");
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(balanceColor));
  doc.text(direction, 105, 50, { align: "center" });

  // Settlement details table
  autoTable(doc, {
    startY: 70,
    head: [["Item", "Amount"]],
    body: [
      ["Total SharedAll expenses", fmt(stats.totalSharedAll)],
      ["Total Lydia-paid expenses", fmt(stats.totalLydiaPaid)],
      ["Lydia owes (1/3 of SharedAll)", fmt(stats.lydiaOwes)],
      ["Couple owes Lydia (2/3 of Lydia-paid)", fmt(stats.coupleOwesLydia)],
      ["Net balance", fmt(netBalance)],
    ],
    theme: "grid",
    headStyles: { fillColor: hexToRgb(PURPLE), textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 11, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" } },
    didParseCell(data) {
      if (data.section === "body" && data.row.index === 4) {
        data.cell.styles.fontStyle = "bold";
        if (data.column.index === 1) {
          data.cell.styles.textColor = hexToRgb(balanceColor);
        }
      }
    },
    margin: { left: 20, right: 20 },
  });
}
