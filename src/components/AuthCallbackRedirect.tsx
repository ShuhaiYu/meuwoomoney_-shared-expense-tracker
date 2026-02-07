"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import { PawIcon } from "./CatIcon";

export function AuthCallbackRedirect() {
  const { data: session, isPending } = authClient.useSession();
  const hasPended = useRef(false);

  // Track that we've gone through at least one pending cycle
  // This ensures the verifier is being processed before we redirect
  useEffect(() => {
    if (isPending) {
      hasPended.current = true;
    }
  }, [isPending]);

  useEffect(() => {
    // Only redirect after the pending cycle completes with a valid session
    // This prevents redirecting with a stale session before the verifier is processed
    if (hasPended.current && !isPending && session?.user) {
      window.location.href = "/";
    }

    // Fallback: if useSession() never goes pending (old cookies were already cleared
    // by middleware), it will start processing the verifier and then resolve.
    // Give it a moment, then redirect regardless.
    if (!isPending && !session?.user && !hasPended.current) {
      const timer = setTimeout(() => {
        // If after a brief wait there's still no session, redirect anyway
        // The verifier might have been processed via a different mechanism
        window.location.href = "/";
      }, 3000);
      return () => clearTimeout(timer);
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
