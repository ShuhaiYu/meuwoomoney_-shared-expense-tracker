import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/((?!auth|api/auth|api/cron|_next|favicon\\.ico|icon\\.svg|apple-icon|manifest\\.webmanifest).*)",
  ],
};
