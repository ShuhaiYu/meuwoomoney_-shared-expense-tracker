export const dynamic = "force-dynamic";

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
