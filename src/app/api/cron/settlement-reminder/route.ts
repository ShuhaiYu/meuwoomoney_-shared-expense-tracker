import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAllTransactions } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import { buildSettlementEmail } from "@/lib/email-template";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current date in Melbourne timezone
  const melbFormatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = melbFormatter.formatToParts(new Date());
  const year = Number(parts.find(p => p.type === "year")!.value);
  const month = Number(parts.find(p => p.type === "month")!.value);
  const day = Number(parts.find(p => p.type === "day")!.value);

  const lastDay = new Date(year, month, 0).getDate();
  const daysUntilEnd = lastDay - day;

  if (daysUntilEnd > 2) {
    return NextResponse.json({ status: "skipped", daysUntilEnd });
  }

  const emailType = daysUntilEnd === 2 ? "two-days" : daysUntilEnd === 1 ? "one-day" : "last-day";
  const monthPrefix = `${year}年${month}月`;

  // Filter transactions to current month (date format: "YYYY-MM-DD")
  const allTransactions = await getAllTransactions();
  const monthStr = String(month).padStart(2, "0");
  const currentMonthTransactions = allTransactions.filter(
    t => t.date.startsWith(`${year}-${monthStr}`)
  );

  const stats = computeStats(currentMonthTransactions);
  const { subject, html } = buildSettlementEmail({ emailType, stats, monthPrefix });

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

  return NextResponse.json({ status: "sent", emailType, monthPrefix });
}
