import { AuthView } from "@neondatabase/auth/react";
import Link from "next/link";

export function generateStaticParams() {
  return [
    { path: "sign-in" },
    { path: "sign-up" },
    { path: "forgot-password" },
    { path: "reset-password" },
  ];
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const showDemo = path === "sign-in" || path === "sign-up";

  return (
    <div className="min-h-screen bg-cat-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <AuthView path={path} redirectTo="/" />
        {showDemo && (
          <div className="text-center">
            <Link
              href="/demo"
              className="inline-block text-sm font-bold text-cat-orange hover:text-cat-brown transition"
            >
              Or try the demo without signing in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
