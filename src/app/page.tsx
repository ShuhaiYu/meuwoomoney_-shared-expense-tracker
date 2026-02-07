import { getAllTransactions } from "@/lib/queries";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const transactions = await getAllTransactions();
  return <Dashboard initialTransactions={transactions} />;
}
