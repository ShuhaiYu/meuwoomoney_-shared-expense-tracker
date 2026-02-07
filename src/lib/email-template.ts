import type { MonthlyStats } from "./types";
import { FELIX, SOPHIE } from "./constants";

type EmailType = "two-days" | "one-day" | "last-day";

interface BuildEmailParams {
  emailType: EmailType;
  stats: MonthlyStats;
  monthPrefix: string;
}

const URGENCY_COLORS: Record<EmailType, string> = {
  "two-days": "#3B82F6",
  "one-day": "#EAB308",
  "last-day": "#EF4444",
};

const URGENCY_LABELS: Record<EmailType, string> = {
  "two-days": "还有两天",
  "one-day": "还有一天",
  "last-day": "请今天结算",
};

export function buildSettlementEmail({ emailType, stats, monthPrefix }: BuildEmailParams): { subject: string; html: string } {
  const netBalance = stats.lydiaNetBalance;
  const absAmount = Math.abs(netBalance).toFixed(2);

  const directionText = netBalance > 0
    ? `Lydia 需要付给你们 $${absAmount}`
    : netBalance < 0
      ? `你们需要付给 Lydia $${absAmount}`
      : "本月与 Lydia 已结清";

  const urgencyLabel = URGENCY_LABELS[emailType];
  const urgencyColor = URGENCY_COLORS[emailType];

  const subject = emailType === "last-day"
    ? `🚨 请今天结算 Lydia 金额 $${absAmount}`
    : `⏰ ${urgencyLabel}需要结算 Lydia 金额 $${absAmount}`;

  const felixRemaining = FELIX.monthlyContribution - stats.felixTotalResponsibility;
  const sophieRemaining = SOPHIE.monthlyContribution - stats.sophieTotalResponsibility;

  let budgetWarningHtml = "";
  if (felixRemaining < 0 || sophieRemaining < 0) {
    const warnings: string[] = [];
    if (felixRemaining < 0) {
      warnings.push(`<strong>Felix</strong> 超支 $${Math.abs(felixRemaining).toFixed(2)}`);
    }
    if (sophieRemaining < 0) {
      warnings.push(`<strong>Sophie</strong> 超支 $${Math.abs(sophieRemaining).toFixed(2)}`);
    }
    budgetWarningHtml = `
      <div style="background-color:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:16px;">
        <p style="margin:0;font-size:14px;color:#92400E;">⚠️ 当前余额不足</p>
        ${warnings.map(w => `<p style="margin:4px 0 0 0;font-size:14px;color:#92400E;">${w}</p>`).join("")}
      </div>`;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FDF6E3;font-family:'Quicksand',Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:${urgencyColor};padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#fff;">🐱 MeuwooMoney 结算提醒</h1>
      <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${monthPrefix}</p>
    </div>

    <div style="padding:24px;">
      <div style="background-color:${urgencyColor}12;border:1px solid ${urgencyColor}40;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;font-size:16px;font-weight:600;color:${urgencyColor};">${urgencyLabel}结算</p>
        <p style="margin:8px 0 0 0;font-size:20px;font-weight:700;color:#264653;">${directionText}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#666;">Lydia 欠 (SharedAll 的 1/3)</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#2A9D8F;">$${stats.lydiaOwes.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#666;">我们欠 Lydia (Lydia 代付的 2/3)</td>
          <td style="padding:10px 0;text-align:right;font-weight:600;color:#E76F51;">$${stats.coupleOwesLydia.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#264653;font-weight:600;">净结算</td>
          <td style="padding:10px 0;text-align:right;font-weight:700;color:${netBalance >= 0 ? "#2A9D8F" : "#E76F51"};">
            ${netBalance >= 0 ? "Lydia 付我们" : "我们付 Lydia"} $${absAmount}
          </td>
        </tr>
      </table>

      <div style="margin-top:20px;padding:12px 16px;background:#F8F4EE;border-radius:8px;">
        <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#264653;">本月花费总览</p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;color:#666;">总支出（情侣份额）</td>
            <td style="padding:3px 0;text-align:right;color:#264653;">$${stats.totalSpent.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#666;">Felix 总责任</td>
            <td style="padding:3px 0;text-align:right;color:#2A9D8F;">$${stats.felixTotalResponsibility.toFixed(2)} / $${FELIX.monthlyContribution}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#666;">Sophie 总责任</td>
            <td style="padding:3px 0;text-align:right;color:#E76F51;">$${stats.sophieTotalResponsibility.toFixed(2)} / $${SOPHIE.monthlyContribution}</td>
          </tr>
        </table>
      </div>

      ${budgetWarningHtml}
    </div>

    <div style="padding:16px 24px;text-align:center;background:#F8F4EE;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#999;">Sent by MeuwooMoney 🐱 — meow~</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, html };
}
