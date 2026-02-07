export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  return authApiHandler().GET(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  return authApiHandler().POST(request, context);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  return authApiHandler().PUT(request, context);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  return authApiHandler().DELETE(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { authApiHandler } = await import("@neondatabase/auth/next/server");
  return authApiHandler().PATCH(request, context);
}
