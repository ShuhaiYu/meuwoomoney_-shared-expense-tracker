import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAllTransactions } from "@/lib/queries";
import { computeStats } from "@/lib/stats";
import { generateMonthlyReportPdf } from "@/lib/generate-monthly-pdf";
import { buildMonthlyReportEmail } from "@/lib/monthly-report-email";
import { getMelbourneParts } from "@/lib/melbourne-time";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current date in Melbourne timezone
  const { year: melbYear, month: melbMonth, day: melbDay } = getMelbourneParts();

  // Only run on the 1st of the month
  if (melbDay !== 1) {
    return NextResponse.json({ status: "skipped", reason: "not the 1st", melbDay });
  }

  // Report covers the previous month
  const reportYear = melbMonth === 1 ? melbYear - 1 : melbYear;
  const reportMonth = melbMonth === 1 ? 12 : melbMonth - 1;
  const reportMonthStr = String(reportMonth).padStart(2, "0");
  const monthLabel = new Date(reportYear, reportMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  // Fetch and filter transactions
  const allTransactions = await getAllTransactions();
  const reportTransactions = allTransactions.filter(
    t => t.date.startsWith(`${reportYear}-${reportMonthStr}`)
  );

  if (reportTransactions.length === 0) {
    return NextResponse.json({ status: "skipped", reason: "no transactions", monthLabel });
  }

  const stats = computeStats(reportTransactions);

  // Calculate year-to-date savings
  // months elapsed = number of months completed so far this year (report month is the last completed month)
  const monthsElapsed = melbMonth === 1 ? 12 : reportMonth; // if Jan, the YTD is for previous full year; otherwise it's up to reportMonth
  const ytdPrefix = melbMonth === 1 ? `${reportYear}-` : `${melbYear}-`;
  const ytdTransactions = allTransactions.filter(t => t.date.startsWith(ytdPrefix));
  const ytdStats = computeStats(ytdTransactions);
  const yearToDateSavings = (7000 * monthsElapsed) - ytdStats.totalSpent;

  // Generate PDF
  const pdfBuffer = generateMonthlyReportPdf({
    stats,
    transactions: reportTransactions,
    monthLabel,
    yearToDateSavings,
  });

  // Build email
  const { subject, html } = buildMonthlyReportEmail({
    stats,
    monthLabel,
    yearToDateSavings,
    transactionCount: reportTransactions.length,
  });

  // Send email with PDF attachment
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: `MeuwooMoney <${["bingbing", "wanwan", "tiaotiao", "banban"][Math.floor(Math.random() * 4)]}@meuwoo.com>`,
    to: process.env.NOTIFICATION_EMAILS!.split(","),
    subject,
    html,
    attachments: [
      {
        filename: `MeuwooMoney_Report_${reportYear}-${reportMonthStr}.pdf`,
        content: pdfBuffer.toString("base64"),
      },
    ],
  });

  if (error) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "sent", monthLabel });
}
