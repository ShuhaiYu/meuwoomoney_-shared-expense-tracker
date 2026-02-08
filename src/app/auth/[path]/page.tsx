import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import Link from "next/link";

export function generateStaticParams() {
  return [{ path: "sign-in" }];
}

export default async function AuthPage() {
  return (
    <div className="min-h-screen bg-cat-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-cat-dark">MeuwooMoney</h1>
          <p className="text-cat-brown text-sm">Shared expense tracker</p>
        </div>
        <GoogleSignInButton />
        <div className="text-center">
          <Link
            href="/demo"
            className="inline-block text-sm font-bold text-cat-orange hover:text-cat-brown transition"
          >
            Or try the demo without signing in
          </Link>
        </div>
      </div>
    </div>
  );
}
