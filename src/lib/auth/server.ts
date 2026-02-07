import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";

let _auth: NeonAuth | null = null;

function getAuth(): NeonAuth {
  if (!_auth) {
    _auth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }
  return _auth;
}

export const auth = new Proxy({} as NeonAuth, {
  get(_, prop) {
    const instance = getAuth();
    const value = (instance as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
