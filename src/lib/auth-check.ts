import { cookies } from "next/headers";
import { jwtVerify, errors } from "jose";

export interface UserInfo {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface JwtUser {
  email?: string;
  name?: string;
  image?: string;
}

async function decodeSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<JwtUser | null> {
  const sessionData =
    cookieStore.get("__Secure-neon-auth.local.session_data") ??
    cookieStore.get("neon-auth.local.session_data");
  if (!sessionData?.value) return null;

  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      sessionData.value,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );
    return (payload as { user?: JwtUser }).user ?? null;
  } catch (e) {
    // JWT expired but signature was valid — still trust the user info
    if (e instanceof errors.JWTExpired) {
      console.log("[auth-check] session_data JWT expired, using payload anyway");
      const payload = (e as any).payload as { user?: JwtUser } | undefined;
      return payload?.user ?? null;
    }
    return null;
  }
}

/**
 * Try to get user email from the local session_data JWT cookie (fast path).
 */
async function getEmailFromCookie(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<string | null> {
  const user = await decodeSessionCookie(cookieStore);
  return user?.email ?? null;
}

/**
 * Fallback: call our own auth API handler to get session data.
 *
 * We call auth.handler().GET() directly rather than fetching the remote
 * Neon Auth server, because the handler adds the `x-neon-auth-middleware`
 * header that bypasses origin validation on custom domains. Calling the
 * remote server directly fails with 403 on custom domains like meuwoo.com.
 */
async function getUserInfoFromUpstream(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<JwtUser | null> {
  const neonCookies = cookieStore
    .getAll()
    .filter((c) => c.name.includes("neon-auth"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!neonCookies) return null;

  try {
    const { auth } = await import("@/lib/auth/server");
    const { headers: nextHeaders } = await import("next/headers");
    const headersList = await nextHeaders();
    const host = headersList.get("host") || "localhost";
    const proto = headersList.get("x-forwarded-proto") || "https";

    // Call the auth handler directly — it proxies to the Neon Auth remote
    // server with the x-neon-auth-middleware header that bypasses origin checks.
    const response = await auth.handler().GET(
      new Request(`${proto}://${host}/api/auth/get-session`, {
        method: "GET",
        headers: { cookie: neonCookies },
      }),
      { params: Promise.resolve({ path: ["get-session"] }) }
    );

    if (!response.ok) {
      console.log("[auth-check] Handler get-session failed:", response.status);
      return null;
    }
    const data = await response.json();
    console.log("[auth-check] Handler session response user:", data?.user?.email ?? "none");
    return data?.user ?? null;
  } catch (e) {
    console.log("[auth-check] Handler fallback failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const cookieStore = await cookies();

  // Fast path: decode local JWT cookie
  let user = await decodeSessionCookie(cookieStore);

  // Fallback: ask upstream Neon Auth server
  if (!user) {
    console.log("[auth-check] getUserInfo: No local JWT, trying upstream...");
    user = await getUserInfoFromUpstream(cookieStore);
  }

  if (!user) return null;
  return {
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}

export async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("__Secure-neon-auth.session_token") ??
    cookieStore.get("neon-auth.session_token");
  return !!token?.value;
}

export async function isApprovedUser(): Promise<boolean> {
  const cookieStore = await cookies();

  const allowed =
    process.env.ALLOWED_EMAILS?.split(",").map((e) => e.trim()) || [];
  if (allowed.length === 0) {
    console.log("[auth-check] ALLOWED_EMAILS is empty or not set");
    return false;
  }

  // Fast path: long-lived approval cookie (set by middleware)
  const approvedCookie = cookieStore.get("meuwoo_approved");
  if (approvedCookie?.value && allowed.includes(approvedCookie.value)) {
    return true;
  }

  // Fallback: read from local session_data JWT cookie
  let email = await getEmailFromCookie(cookieStore);

  // Fallback: ask upstream Neon Auth server directly
  if (!email) {
    console.log("[auth-check] No local session cookie, trying upstream...");
    const upstream = await getUserInfoFromUpstream(cookieStore);
    email = upstream?.email ?? null;
  }

  if (!email) {
    console.log("[auth-check] Could not determine user email");
    return false;
  }

  console.log("[auth-check] User email:", email);
  console.log("[auth-check] Allowed emails:", allowed);
  console.log("[auth-check] Match:", allowed.includes(email));
  return allowed.includes(email);
}
