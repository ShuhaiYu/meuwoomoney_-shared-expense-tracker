"use client";

import { useEffect } from "react";
import { PawIcon } from "./CatIcon";

/**
 * Handles the OAuth callback by exchanging the session verifier server-side.
 *
 * Instead of using the client-side useSession() hook (which relies on fetch()
 * to set cookies — unreliable in iOS standalone/Home Screen WKWebView),
 * we navigate to /api/auth/exchange which does the exchange server-side
 * and sets cookies via an HTTP redirect response.
 */
export function AuthCallbackRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifier = params.get("neon_auth_session_verifier");

    if (verifier) {
      // Navigate to server-side exchange endpoint.
      // This is a full page navigation, so Set-Cookie headers from the
      // redirect response are always applied — even in iOS standalone mode.
      window.location.href = `/api/auth/exchange?neon_auth_session_verifier=${encodeURIComponent(verifier)}`;
    } else {
      // No verifier — shouldn't happen, but redirect home as fallback
      window.location.href = "/";
    }
  }, []);

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
