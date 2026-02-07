export const dynamic = "force-dynamic";

const NEON_AUTH_COOKIES = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_challange",
  "neon-auth.session_token",
  "neon-auth.local.session_data",
  "neon-auth.session_challange",
];

function clearSessionResponse() {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of NEON_AUTH_COOKIES) {
    if (name.startsWith("__Secure-")) {
      headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
      );
    } else {
      headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
      );
    }
  }
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { auth } = await import("@/lib/auth/server");
  return auth.handler().GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  if (path.join("/") === "sign-out") {
    const { auth } = await import("@/lib/auth/server");
    const response = await auth.handler().POST(request, context);
    if (response.status === 403) {
      return clearSessionResponse();
    }
    return response;
  }
  const { auth } = await import("@/lib/auth/server");
  return auth.handler().POST(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { auth } = await import("@/lib/auth/server");
  return auth.handler().PUT(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { auth } = await import("@/lib/auth/server");
  return auth.handler().DELETE(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { auth } = await import("@/lib/auth/server");
  return auth.handler().PATCH(request, context);
}
