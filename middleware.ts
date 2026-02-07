import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  console.log("[middleware]", request.nextUrl.pathname,
    "cookies:", request.cookies.getAll().map(c => c.name));

  // OAuth callback: pass through so the page can render AuthCallbackRedirect,
  // which navigates to /api/auth/exchange for server-side verifier exchange.
  // Important: do NOT delete cookies here — the session_challange cookie is
  // needed for the verifier exchange, and deleting it breaks the flow
  // (especially in iOS standalone/Home Screen mode).
  if (request.nextUrl.searchParams.has("neon_auth_session_verifier")) {
    console.log("[middleware] OAuth callback with verifier, passing through");
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("__Secure-neon-auth.session_token") ??
    request.cookies.get("neon-auth.session_token");

  if (!sessionToken?.value) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    console.log("[middleware] No session token, redirecting to sign-in");
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!auth|api/auth|api/cron|demo|_next|favicon\\.ico|icon\\.svg|apple-icon|manifest\\.webmanifest).+)",
  ],
};
