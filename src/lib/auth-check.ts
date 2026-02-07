import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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
  const sessionData = cookieStore.get("__Secure-neon-auth.local.session_data");
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
  } catch {
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
 * Fallback: forward neon-auth cookies to the upstream Neon Auth server
 * to fetch session data when local session cookies are missing.
 */
async function getEmailFromUpstream(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<string | null> {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) return null;

  // Collect all neon-auth cookies to forward
  const neonCookies = cookieStore
    .getAll()
    .filter((c) => c.name.includes("neon-auth"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!neonCookies) return null;

  try {
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: neonCookies },
    });
    if (!res.ok) return null;
    const data = await res.json();
    console.log("[auth-check] Upstream session response user:", data?.user?.email ?? "none");
    return data?.user?.email ?? null;
  } catch (e) {
    console.log("[auth-check] Upstream fetch failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const cookieStore = await cookies();
  const user = await decodeSessionCookie(cookieStore);
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

  // Fast path: read from local session_data JWT cookie
  let email = await getEmailFromCookie(cookieStore);

  // Fallback: ask upstream Neon Auth server directly
  if (!email) {
    console.log("[auth-check] No local session cookie, trying upstream...");
    email = await getEmailFromUpstream(cookieStore);
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
