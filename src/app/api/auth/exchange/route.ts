import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-side OAuth verifier exchange endpoint.
 *
 * In iOS standalone (Home Screen) mode, cookies set via fetch() response
 * headers may not persist in the WKWebView. This endpoint does the verifier
 * exchange server-side and sets cookies via an HTTP redirect response,
 * which always works — even in standalone PWA mode.
 *
 * Flow:
 * 1. AuthCallbackRedirect navigates here with the verifier
 * 2. We call /api/auth/get-session (our own auth handler) with the verifier + cookies
 * 3. The auth handler contacts Neon Auth remote server to validate the verifier
 * 4. We copy Set-Cookie headers from that response onto a redirect to /
 * 5. Browser follows the redirect, applies cookies, and loads the dashboard
 */
export async function GET(request: NextRequest) {
  const verifier = request.nextUrl.searchParams.get(
    "neon_auth_session_verifier"
  );
  if (!verifier) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  try {
    // Call our own auth API handler to exchange the verifier.
    // The catch-all route at /api/auth/[...path] proxies to the Neon Auth
    // remote server, which validates the verifier against the challenge cookie.
    const getSessionUrl = new URL("/api/auth/get-session", request.url);
    getSessionUrl.searchParams.set("neon_auth_session_verifier", verifier);

    const res = await fetch(getSessionUrl.toString(), {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const setCookies = res.headers.getSetCookie();
    if (!res.ok || setCookies.length === 0) {
      console.error("[auth/exchange] Exchange failed, status:", res.status, "cookies:", setCookies.length);
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }

    // Build redirect to home page
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Forward Set-Cookie headers from the auth response — this is the key part.
    // Cookies set via a redirect response are always persisted by the browser,
    // unlike cookies from a fetch() response in iOS standalone WKWebView.
    for (const cookie of setCookies) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (e) {
    console.error("[auth/exchange] Verifier exchange failed:", e);
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }
}
