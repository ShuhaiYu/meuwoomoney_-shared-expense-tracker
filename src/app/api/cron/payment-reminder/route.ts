import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getMonthlyPaymentStatus } from "@/lib/queries";
import { buildPaymentReminderEmail } from "@/lib/payment-reminder-email";
import { getMelbourneParts, melbourneYearMonth } from "@/lib/melbourne-time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month, day } = getMelbourneParts();
  const lastDay = new Date(year, month, 0).getDate();

  // Only send on last day of month or 1st of month
  if (day !== lastDay && day !== 1) {
    return NextResponse.json({ status: "skipped", day, reason: "not last-day or first-day" });
  }

  const emailType = day === lastDay ? "last-day" : "first-day";

  // For last-day: check current month status; for first-day: check current month (the new month)
  const ym = melbourneYearMonth();
  // On last day, we remind about NEXT month; on 1st, we remind about THIS month
  const paymentStatus = await getMonthlyPaymentStatus(
    emailType === "last-day"
      ? `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}`
      : ym
  );

  // Skip if both already confirmed
  if (paymentStatus.felix && paymentStatus.sophie) {
    return NextResponse.json({ status: "skipped", reason: "both confirmed" });
  }

  const monthLabel = emailType === "last-day"
    ? `${month === 12 ? year + 1 : year}年${month === 12 ? 1 : month + 1}月`
    : `${year}年${month}月`;

  const { subject, html } = buildPaymentReminderEmail({ emailType, paymentStatus, monthLabel });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `MeuwooMoney <${["bingbing", "wanwan", "tiaotiao", "banban"][Math.floor(Math.random() * 4)]}@meuwoo.com>`,
    to: process.env.NOTIFICATION_EMAILS!.split(","),
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "sent", emailType, monthLabel });
}
