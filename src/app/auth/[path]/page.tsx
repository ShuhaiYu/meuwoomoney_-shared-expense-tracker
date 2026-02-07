import { AuthView } from "@neondatabase/auth/react";

export function generateStaticParams() {
  return [
    { path: "sign-in" },
    { path: "sign-up" },
    { path: "forgot-password" },
    { path: "reset-password" },
  ];
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <div className="min-h-screen bg-cat-cream flex items-center justify-center p-4">
      <AuthView pathname={`/auth/${path}`} />
    </div>
  );
}
