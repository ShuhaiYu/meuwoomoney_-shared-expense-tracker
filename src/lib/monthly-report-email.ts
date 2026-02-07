import type { MonthlyStats } from "./types";
import { FELIX, SOPHIE } from "./constants";

interface BuildEmailParams {
  stats: MonthlyStats;
  monthLabel: string;
  yearToDateSavings: number;
  transactionCount: number;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function buildMonthlyReportEmail({ stats, monthLabel, yearToDateSavings, transactionCount }: BuildEmailParams): { subject: string; html: string } {
  const subject = `MeuwooMoney Monthly Report — ${monthLabel}`;

  const savingsColor = stats.netSavings >= 0 ? "#2A9D8F" : "#E76F51";
  const ytdColor = yearToDateSavings >= 0 ? "#2A9D8F" : "#E76F51";

  const felixRemaining = FELIX.monthlyContribution - stats.felixTotalResponsibility;
  const sophieRemaining = SOPHIE.monthlyContribution - stats.sophieTotalResponsibility;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FDF6E3;font-family:'Quicksand',Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:#264653;padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#fff;">🐱 Monthly Meow Report</h1>
      <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${monthLabel}</p>
    </div>

    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#666;">Total Spent</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#264653;">${fmt(stats.totalSpent)}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#666;">Monthly Savings</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:${savingsColor};">${fmt(stats.netSavings)}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#666;">Year-to-Date Savings</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:${ytdColor};">${fmt(yearToDateSavings)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#666;">Transactions</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#264653;">${transactionCount}</td>
        </tr>
      </table>

      <div style="display:flex;gap:12px;margin-top:20px;">
        <div style="flex:1;background:#F0FAF8;border-radius:10px;padding:14px;border-left:4px solid #2A9D8F;">
          <p style="margin:0;font-size:12px;color:#666;">Felix</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:700;color:#2A9D8F;">${fmt(stats.felixTotalResponsibility)} / ${fmt(FELIX.monthlyContribution)}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:${felixRemaining >= 0 ? "#2A9D8F" : "#E76F51"};">Remaining: ${fmt(felixRemaining)}</p>
        </div>
        <div style="flex:1;background:#FEF5F0;border-radius:10px;padding:14px;border-left:4px solid #E76F51;">
          <p style="margin:0;font-size:12px;color:#666;">Sophie</p>
          <p style="margin:4px 0 0 0;font-size:15px;font-weight:700;color:#E76F51;">${fmt(stats.sophieTotalResponsibility)} / ${fmt(SOPHIE.monthlyContribution)}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:${sophieRemaining >= 0 ? "#2A9D8F" : "#E76F51"};">Remaining: ${fmt(sophieRemaining)}</p>
        </div>
      </div>

      <div style="background-color:#F0FAF8;border:1px solid #2A9D8F40;border-radius:12px;padding:16px;text-align:center;margin-top:20px;">
        <p style="margin:0;font-size:14px;font-weight:600;color:#264653;">📎 Full report attached as PDF</p>
        <p style="margin:6px 0 0 0;font-size:12px;color:#666;">Open the attachment for category breakdown, personal summaries, and Lydia settlement details.</p>
      </div>
    </div>

    <div style="padding:16px 24px;text-align:center;background:#F8F4EE;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#999;">Sent by MeuwooMoney 🐱 — meow~</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, html };
}
