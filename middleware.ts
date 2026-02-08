import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
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

  // Proactive session_data refresh: the session_data JWT cookie has a short
  // TTL (default 1 hour). When it expires, the browser deletes it. Without it,
  // isApprovedUser() can't determine the user's email and kicks them to demo.
  // Refresh it by calling our own get-session API (which proxies via the auth
  // handler with the x-neon-auth-middleware header, bypassing origin checks).
  const sessionData =
    request.cookies.get("__Secure-neon-auth.local.session_data") ??
    request.cookies.get("neon-auth.local.session_data");

  if (!sessionData?.value) {
    // Guard: only attempt refresh once — prevent redirect loops
    if (!request.cookies.get("_neon_refresh")) {
      console.log("[middleware] session_data missing, refreshing via get-session");
      try {
        const getSessionUrl = new URL("/api/auth/get-session", request.url);
        const res = await fetch(getSessionUrl.toString(), {
          headers: { cookie: request.headers.get("cookie") || "" },
        });

        if (res.ok && res.headers.getSetCookie().length > 0) {
          // Redirect to same URL — the browser will store the refreshed
          // session_data cookie and make a new request with it.
          const response = NextResponse.redirect(request.url);
          for (const cookie of res.headers.getSetCookie()) {
            response.headers.append("Set-Cookie", cookie);
          }
          // Short-lived guard cookie prevents infinite redirect loops
          response.cookies.set("_neon_refresh", "1", {
            maxAge: 10,
            path: "/",
            httpOnly: true,
          });
          return response;
        }
      } catch (e) {
        console.log("[middleware] Session data refresh failed:", e);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!auth|api/auth|api/cron|demo|_next|favicon\\.ico|icon\\.svg|apple-icon|manifest\\.webmanifest).+)",
  ],
};
