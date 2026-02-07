import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_challange",
  "neon-auth.session_token",
  "neon-auth.local.session_data",
  "neon-auth.session_challange",
];

export default function middleware(request: NextRequest) {
  console.log("[middleware]", request.nextUrl.pathname,
    "cookies:", request.cookies.getAll().map(c => c.name));

  // OAuth callback: clear old session cookies so the new verifier is processed cleanly
  if (request.nextUrl.searchParams.has("neon_auth_session_verifier")) {
    console.log("[middleware] OAuth callback with verifier, clearing old session cookies");
    const response = NextResponse.next();
    for (const name of SESSION_COOKIES) {
      response.cookies.delete(name);
    }
    return response;
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
