import { NextRequest, NextResponse } from "next/server";

export default function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("__Secure-neon-auth.session_token") ??
    request.cookies.get("neon-auth.session_token");

  if (!sessionToken?.value) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/cron|_next|favicon\\.ico|icon\\.svg|apple-icon|manifest\\.webmanifest).*)",
  ],
};
