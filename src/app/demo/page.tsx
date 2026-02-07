import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { Dashboard } from "@/components/Dashboard";

export default function DemoPage() {
  return <Dashboard initialTransactions={MOCK_TRANSACTIONS} isGuest />;
}
