import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  console.log("[middleware]", request.nextUrl.pathname,
    "cookies:", request.cookies.getAll().map(c => c.name));

  // OAuth callback: exchange the verifier server-side in middleware and redirect
  // to / without the verifier param. This prevents a race condition where both
  // NeonAuthUIProvider's useSession() hook and AuthCallbackRedirect try to
  // consume the verifier — if useSession() wins, the exchange endpoint fails
  // because the verifier was already consumed.
  const verifier = request.nextUrl.searchParams.get("neon_auth_session_verifier");
  if (verifier) {
    console.log("[middleware] OAuth callback with verifier, exchanging server-side");
    try {
      const getSessionUrl = new URL("/api/auth/get-session", request.url);
      getSessionUrl.searchParams.set("neon_auth_session_verifier", verifier);

      // Forward all cookies — the session_challange cookie is needed for
      // the PKCE-like verifier exchange on the Neon Auth remote server.
      const res = await fetch(getSessionUrl.toString(), {
        headers: { cookie: request.headers.get("cookie") || "" },
        cache: "no-store",
      });

      if (res.ok && res.headers.getSetCookie().length > 0) {
        // Redirect to / without the verifier — cookies are set via the
        // redirect response, which always works (even in iOS standalone).
        const redirectUrl = new URL("/", request.url);
        const response = NextResponse.redirect(redirectUrl);
        for (const cookie of res.headers.getSetCookie()) {
          response.headers.append("Set-Cookie", cookie);
        }
        console.log("[middleware] Verifier exchanged, redirecting to /");
        return response;
      }

      console.log("[middleware] Verifier exchange response not ok or no cookies, status:", res.status);
    } catch (e) {
      console.log("[middleware] Verifier exchange failed:", e);
    }

    // Fallback: pass through so AuthCallbackRedirect can try the exchange
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
