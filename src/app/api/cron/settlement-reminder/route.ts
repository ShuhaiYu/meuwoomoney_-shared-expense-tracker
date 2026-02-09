import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAllTransactions, getAllDeposits, getLydiaSettlementStatus } from "@/lib/queries";
import { computeLydiaHalfStats } from "@/lib/stats";
import { buildSettlementEmail } from "@/lib/email-template";
import { getMelbourneParts } from "@/lib/melbourne-time";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month, day } = getMelbourneParts();
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, "0");
  const ym = `${year}-${monthStr}`;

  const settlementStatus = await getLydiaSettlementStatus(ym);

  // Determine which periods need reminders
  const pendingPeriods: ("first-half" | "second-half")[] = [];
  if (day >= 15 && !settlementStatus.firstHalf) {
    pendingPeriods.push("first-half");
  }
  if (day >= lastDay - 1 && !settlementStatus.secondHalf) {
    pendingPeriods.push("second-half");
  }

  if (pendingPeriods.length === 0) {
    return NextResponse.json({ status: "skipped", reason: "all confirmed or not yet due" });
  }

  // Fetch transactions and deposits for the current month
  const [allTransactions, allDeposits] = await Promise.all([
    getAllTransactions(),
    getAllDeposits(),
  ]);
  const currentMonthTx = allTransactions.filter(t => t.date.startsWith(ym));
  const currentMonthDeposits = allDeposits.filter(d => d.yearMonth === ym);

  // Compute half-month stats for pending periods
  const getDay = (dateStr: string) => parseInt(dateStr.split("-")[2], 10);

  const periodStats: { period: "first-half" | "second-half"; stats: ReturnType<typeof computeLydiaHalfStats> }[] = [];
  for (const period of pendingPeriods) {
    const isFirstHalf = period === "first-half";
    const txForPeriod = currentMonthTx.filter(t => isFirstHalf ? getDay(t.date) <= 15 : getDay(t.date) > 15);
    let lydiaTransfers = 0;
    currentMonthDeposits.forEach(d => {
      if (d.depositor !== "Lydia") return;
      const dDay = getDay(d.date);
      if (isFirstHalf ? dDay <= 15 : dDay > 15) {
        lydiaTransfers += parseFloat(d.amount);
      }
    });
    periodStats.push({ period, stats: computeLydiaHalfStats(txForPeriod, lydiaTransfers) });
  }

  const monthPrefix = `${year}年${month}月`;
  const { subject, html } = buildSettlementEmail({ periods: periodStats, monthPrefix });

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

  return NextResponse.json({ status: "sent", pendingPeriods, monthPrefix });
}
