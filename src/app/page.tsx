import { redirect } from "next/navigation";
import { getAllTransactions, getMonthlyPaymentStatus, getAllDeposits, getLydiaSettlementStatus } from "@/lib/queries";
import { isApprovedUser, isLoggedIn } from "@/lib/auth-check";
import { melbournePrevYearMonth } from "@/lib/melbourne-time";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const approved = await isApprovedUser();
  if (!approved) {
    const loggedIn = await isLoggedIn();
    redirect(loggedIn ? "/demo?restricted=true" : "/demo");
  }

  const prevYM = melbournePrevYearMonth();

  const [transactions, paymentStatus, deposits, lydiaSettlementStatus, prevMonthLydiaSettlement] = await Promise.all([
    getAllTransactions(),
    getMonthlyPaymentStatus(),
    getAllDeposits(),
    getLydiaSettlementStatus(),
    getLydiaSettlementStatus(prevYM),
  ]);

  return <Dashboard initialTransactions={transactions} paymentStatus={paymentStatus} initialDeposits={deposits} lydiaSettlementStatus={lydiaSettlementStatus} prevMonthLydiaSettlement={prevMonthLydiaSettlement} />;
}
