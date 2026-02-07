import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  console.log("[middleware]", request.nextUrl.pathname,
    "cookies:", request.cookies.getAll().map(c => c.name));

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
