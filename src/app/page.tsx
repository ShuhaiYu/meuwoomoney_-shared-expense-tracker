import { redirect } from "next/navigation";
import { getAllTransactions } from "@/lib/queries";
import { isApprovedUser, isLoggedIn } from "@/lib/auth-check";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const approved = await isApprovedUser();
  if (!approved) {
    const loggedIn = await isLoggedIn();
    redirect(loggedIn ? "/demo?restricted=true" : "/demo");
  }

  const transactions = await getAllTransactions();
  return <Dashboard initialTransactions={transactions} />;
}
