import { redirect } from "next/navigation";
import { getAllTransactions, getMonthlyPaymentStatus, getAllDeposits } from "@/lib/queries";
import { isApprovedUser, isLoggedIn } from "@/lib/auth-check";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const approved = await isApprovedUser();
  if (!approved) {
    const loggedIn = await isLoggedIn();
    redirect(loggedIn ? "/demo?restricted=true" : "/demo");
  }

  const [transactions, paymentStatus, deposits] = await Promise.all([
    getAllTransactions(),
    getMonthlyPaymentStatus(),
    getAllDeposits(),
  ]);

  return <Dashboard initialTransactions={transactions} paymentStatus={paymentStatus} initialDeposits={deposits} />;
}
