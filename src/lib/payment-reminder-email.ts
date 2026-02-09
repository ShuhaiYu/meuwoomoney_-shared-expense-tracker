import type { MonthlyPayment } from "./schema";
import { FELIX, SOPHIE } from "./constants";

type EmailType = "last-day" | "first-day";

interface BuildPaymentReminderParams {
  emailType: EmailType;
  paymentStatus: { felix: MonthlyPayment | null; sophie: MonthlyPayment | null };
  monthLabel: string;
}

const STATUS_COLORS: Record<EmailType, string> = {
  "last-day": "#EAB308",
  "first-day": "#EF4444",
};

function payerRow(name: string, avatar: string, amount: number, color: string, payment: MonthlyPayment | null): string {
  const confirmed = !!payment;
  const statusBg = confirmed ? "#ECFDF5" : "#FEF3C7";
  const statusColor = confirmed ? "#059669" : "#D97706";
  const statusText = confirmed ? "✅ 已确认" : "⏳ 待支付";
  const detail = confirmed && payment.confirmedBy
    ? `<span style="font-size:11px;color:#999;"> by ${payment.confirmedBy}</span>`
    : "";

  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;">${avatar}</span>
          <div>
            <span style="font-weight:600;color:#264653;">${name}</span>
            <span style="color:${color};font-weight:700;margin-left:8px;">$${amount.toLocaleString()}</span>
          </div>
        </div>
      </td>
      <td style="padding:12px 0;text-align:right;border-bottom:1px solid #f0f0f0;">
        <span style="display:inline-block;background:${statusBg};color:${statusColor};font-size:13px;font-weight:600;padding:4px 10px;border-radius:20px;">${statusText}</span>
        ${detail}
      </td>
    </tr>`;
}

export function buildPaymentReminderEmail({ emailType, paymentStatus, monthLabel }: BuildPaymentReminderParams): { subject: string; html: string } {
  const headerColor = STATUS_COLORS[emailType];
  const titleText = emailType === "last-day" ? "月度打款提醒" : "今天是打款日";
  const subtitleText = emailType === "last-day"
    ? "明天需要支付月度费用"
    : "今天是支付日，请确认打款";

  const subject = emailType === "last-day"
    ? `⏰ 明天是打款日 — ${monthLabel}月度费用提醒`
    : `🚨 今天是打款日 — ${monthLabel}月度费用提醒`;

  const baseUrl = process.env.BETTER_AUTH_URL || "https://www.meuwoo.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FDF6E3;font-family:'Quicksand',Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:${headerColor};padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#fff;">🐱 MeuwooMoney ${titleText}</h1>
      <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${monthLabel}</p>
    </div>

    <div style="padding:24px;">
      <div style="background-color:${headerColor}12;border:1px solid ${headerColor}40;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;font-size:16px;font-weight:600;color:${headerColor};">${subtitleText}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${payerRow(FELIX.name, FELIX.avatar, FELIX.monthlyContribution, FELIX.color, paymentStatus.felix)}
        ${payerRow(SOPHIE.name, SOPHIE.avatar, SOPHIE.monthlyContribution, SOPHIE.color, paymentStatus.sophie)}
      </table>

      <div style="text-align:center;margin-top:24px;">
        <a href="${baseUrl}" style="display:inline-block;background:#2A9D8F;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:12px;text-decoration:none;">前往确认打款</a>
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
