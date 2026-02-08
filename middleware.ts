import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors } from "jose";

/**
 * Decode the user's email from a session_data JWT.
 * Tolerates expired JWTs (signature still valid, only `exp` failed).
 */
function decodeEmailFromSessionData(jwt: string, secret: string): Promise<string | null> {
  return jwtVerify(jwt, new TextEncoder().encode(secret), { algorithms: ["HS256"] })
    .then(({ payload }) => (payload as { user?: { email?: string } }).user?.email ?? null)
    .catch((e) => {
      if (e instanceof errors.JWTExpired) {
        const payload = (e as any).payload as { user?: { email?: string } } | undefined;
        return payload?.user?.email ?? null;
      }
      return null;
    });
}

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

  // --- Stable approval: long-lived cookie cache ---
  // Check if the user is approved via a cached cookie, avoiding dependence on
  // the fragile session_data JWT that expires after ~1 hour.
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(",").map(e => e.trim()) || [];
  const approvedCookie = request.cookies.get("meuwoo_approved");

  if (approvedCookie?.value) {
    if (allowedEmails.includes(approvedCookie.value)) {
      // Already approved — pass through, no JWT/upstream needed
      return NextResponse.next();
    }
    // Email no longer in ALLOWED_EMAILS — clear the stale cookie
    console.log("[middleware] meuwoo_approved email no longer allowed, clearing");
    const response = NextResponse.next();
    response.cookies.delete("meuwoo_approved");
    return response;
  }

  // Not yet cached — try to decode session_data JWT to get email and set approval cookie
  const sessionData =
    request.cookies.get("__Secure-neon-auth.local.session_data") ??
    request.cookies.get("neon-auth.local.session_data");

  if (sessionData?.value && allowedEmails.length > 0) {
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (secret) {
      const email = await decodeEmailFromSessionData(sessionData.value, secret);
      if (email && allowedEmails.includes(email)) {
        console.log("[middleware] Setting meuwoo_approved cookie for", email);
        const response = NextResponse.next();
        response.cookies.set("meuwoo_approved", email, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });
        return response;
      }
    }
  }

  // Proactive session_data refresh: the session_data JWT cookie has a short
  // TTL (default 1 hour). When it expires, the browser deletes it. Without it,
  // we can't set the approval cookie. Refresh it by calling our own get-session
  // API (which proxies via the auth handler with the x-neon-auth-middleware
  // header, bypassing origin checks).
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
