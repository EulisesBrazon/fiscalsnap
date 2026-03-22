import { redirect } from "next/navigation";
import Link from "next/link";

import { UserRole } from "@/backend/shared/types";
import { signOut, auth } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-40">
            <p className="text-sm text-muted-foreground">FiscalSnap</p>
            <h1 className="text-base font-semibold">Panel de Retenciones</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
              Inicio
            </Link>
            <Link href="/dashboard/scan" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
              Escanear
            </Link>
            <Link href="/dashboard/retentions" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
              Comprobantes
            </Link>
            <Link href="/dashboard/settings/company" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
              Empresa
            </Link>
            {role === UserRole.ADMIN ? (
              <Link href="/dashboard/settings/templates" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
                Templates
              </Link>
            ) : null}
            {role === UserRole.ADMIN ? (
              <Link href="/dashboard/settings/users" className="rounded-md border px-2.5 py-1.5 hover:bg-accent">
                Usuarios
              </Link>
            ) : null}
          </nav>
          <form action={logoutAction}>
            <button className="h-9 rounded-md border px-3 text-sm" type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl p-4">{children}</div>
    </div>
  );
}
