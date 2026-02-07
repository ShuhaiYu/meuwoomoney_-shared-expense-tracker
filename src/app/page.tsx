import { redirect } from "next/navigation";
import { getAllTransactions } from "@/lib/queries";
import { isApprovedUser, isLoggedIn } from "@/lib/auth-check";
import { Dashboard } from "@/components/Dashboard";
import { AuthCallbackRedirect } from "@/components/AuthCallbackRedirect";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // OAuth callback: let client-side auth process the session verifier first
  if (params.neon_auth_session_verifier) {
    return <AuthCallbackRedirect />;
  }

  const approved = await isApprovedUser();
  if (!approved) {
    const loggedIn = await isLoggedIn();
    redirect(loggedIn ? "/demo?restricted=true" : "/demo");
  }

  const transactions = await getAllTransactions();
  return <Dashboard initialTransactions={transactions} />;
}
