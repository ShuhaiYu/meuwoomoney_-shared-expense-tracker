import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export interface UserInfo {
  name: string | null;
  email: string | null;
  image: string | null;
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
}

export async function isLoggedIn(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return !!session;
}

export async function isApprovedUser(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return false;

  const allowed = process.env.ALLOWED_EMAILS?.split(",").map(e => e.trim()) || [];
  if (allowed.length === 0) return false;

  return allowed.includes(session.user.email);
}
