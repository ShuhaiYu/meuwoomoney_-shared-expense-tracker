import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

export default neonAuthMiddleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/cron|_next|favicon.ico).*)",
  ],
};
