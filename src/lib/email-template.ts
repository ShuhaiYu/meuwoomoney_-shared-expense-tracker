import type { LydiaHalfStats } from "./stats";

const PERIOD_LABELS: Record<string, string> = {
  "first-half": "上半月 (1-15日)",
  "second-half": "下半月 (16日-月末)",
};

interface PeriodInfo {
  period: "first-half" | "second-half";
  stats: LydiaHalfStats;
}

interface BuildEmailParams {
  periods: PeriodInfo[];
  monthPrefix: string;
}

export function buildSettlementEmail({ periods, monthPrefix }: BuildEmailParams): { subject: string; html: string } {
  // Subject line
  const totalAmount = periods.reduce((sum, p) => sum + Math.abs(p.stats.lydiaRemainingBalance), 0);
  const periodNames = periods.map(p => PERIOD_LABELS[p.period]).join(" & ");
  const subject = `⚠️ Lydia ${periodNames}结算未确认 $${totalAmount.toFixed(2)}`;

  // Build period sections
  const periodSections = periods.map(({ period, stats }) => {
    const label = PERIOD_LABELS[period];
    const netBalance = stats.lydiaNetBalance;
    const directionText = netBalance > 0
      ? `Lydia 需要付给你们 $${Math.abs(netBalance).toFixed(2)}`
      : netBalance < 0
        ? `你们需要付给 Lydia $${Math.abs(netBalance).toFixed(2)}`
        : "已结清";

    let transferHtml = "";
    if (stats.lydiaTransfers > 0) {
      transferHtml = `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px 0;color:#666;">Lydia 已转账</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#3B82F6;">$${stats.lydiaTransfers.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#264653;font-weight:600;">剩余</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:${stats.lydiaRemainingBalance >= 0 ? "#2A9D8F" : "#E76F51"};">
            $${Math.abs(stats.lydiaRemainingBalance).toFixed(2)}
          </td>
        </tr>`;
    }

    return `
      <div style="background:#F8F4EE;border-radius:12px;padding:16px;margin-bottom:16px;">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#264653;">${label}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px 0;color:#666;">Lydia 欠 (SharedAll 的 1/3)</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#2A9D8F;">$${stats.lydiaOwes.toFixed(2)}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px 0;color:#666;">我们欠 Lydia (Lydia 代付的 2/3)</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#E76F51;">$${stats.coupleOwesLydia.toFixed(2)}</td>
          </tr>
          ${transferHtml}
          <tr>
            <td style="padding:8px 0;color:#264653;font-weight:600;">净结算</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;color:${netBalance >= 0 ? "#2A9D8F" : "#E76F51"};">
              ${directionText}
            </td>
          </tr>
        </table>
      </div>`;
  }).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FDF6E3;font-family:'Quicksand',Arial,sans-serif;">
  <div style="max-width:520px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:#EF4444;padding:20px 24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;color:#fff;">🐱 MeuwooMoney 结算提醒</h1>
      <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.9);">${monthPrefix}</p>
    </div>

    <div style="padding:24px;">
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;font-size:16px;font-weight:600;color:#DC2626;">以下半月结算尚未确认</p>
      </div>

      ${periodSections}
    </div>

    <div style="padding:16px 24px;text-align:center;background:#F8F4EE;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#999;">Sent by MeuwooMoney 🐱 — meow~</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, html };
}
