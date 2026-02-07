import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { getUserInfo } from "@/lib/auth-check";
import { Dashboard } from "@/components/Dashboard";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isRestricted = params.restricted === "true";
  const userInfo = isRestricted ? await getUserInfo() : null;

  return (
    <Dashboard
      initialTransactions={MOCK_TRANSACTIONS}
      isGuest
      isRestricted={isRestricted}
      restrictedUser={userInfo ?? undefined}
    />
  );
}
