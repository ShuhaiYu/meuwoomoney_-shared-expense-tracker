"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import { PawIcon } from "./CatIcon";

export function AuthCallbackRedirect() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      // Session processed — reload without the verifier param so server can re-check
      window.location.href = "/";
    }
  }, [isPending, session]);

  return (
    <div className="min-h-screen bg-cat-cream flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="bg-cat-orange text-white p-4 rounded-2xl inline-block animate-pulse">
          <PawIcon className="w-10 h-10" />
        </div>
        <p className="text-cat-dark font-bold">Signing you in...</p>
      </div>
    </div>
  );
}
