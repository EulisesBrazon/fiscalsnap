import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";

import { connectToDatabase } from "@/backend/config/database";
import { tenantService } from "@/backend/modules/tenant/tenant.service";
import { TenantThemeSwitch } from "@/components/theme/tenant-theme-switch";
import { UserRole } from "@/backend/shared/types";
import { signOut, auth } from "@/lib/auth";
import { normalizeTenantUiTheme, tenantThemeToCssVariables } from "@/lib/tenant-theme";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  await connectToDatabase();
  const tenant = await tenantService.getById(session.user.tenantId);
  const uiTheme = normalizeTenantUiTheme(tenant.uiTheme);
  const tenantVars = tenantThemeToCssVariables(uiTheme);

  async function logoutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div id="tenant-theme-root" className={cn("min-h-screen bg-background text-foreground", uiTheme.mode === "dark" && "dark")} style={tenantVars as CSSProperties}>
      <header className="border-b bg-card">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
          <div className="min-w-40">
            <p className="text-sm text-muted-foreground">FiscalSnap</p>
            <h1 className="text-base font-semibold">Panel de Retenciones</h1>
          </div>

          <nav className="hidden items-center gap-2 text-sm md:flex">
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

          <div className="hidden items-center gap-2 md:flex">
            <TenantThemeSwitch rootId="tenant-theme-root" defaultMode={uiTheme.mode} colors={uiTheme.colors} />
            <form action={logoutAction}>
              <button className="h-9 rounded-md border px-3 text-sm" type="submit">
                Salir
              </button>
            </form>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <TenantThemeSwitch rootId="tenant-theme-root" defaultMode={uiTheme.mode} colors={uiTheme.colors} />
            <details className="group relative">
              <summary className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border text-sm marker:content-none">
                <span className="sr-only">Abrir menú</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </svg>
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border bg-card p-2 shadow-lg">
                <nav className="grid gap-1 text-sm">
                  <a href="/dashboard" className="rounded-md border px-3 py-2 hover:bg-accent">
                    Inicio
                  </a>
                  <a href="/dashboard/scan" className="rounded-md border px-3 py-2 hover:bg-accent">
                    Escanear
                  </a>
                  <a href="/dashboard/retentions" className="rounded-md border px-3 py-2 hover:bg-accent">
                    Comprobantes
                  </a>
                  <a href="/dashboard/settings/company" className="rounded-md border px-3 py-2 hover:bg-accent">
                    Empresa
                  </a>
                  {role === UserRole.ADMIN ? (
                    <a href="/dashboard/settings/templates" className="rounded-md border px-3 py-2 hover:bg-accent">
                      Templates
                    </a>
                  ) : null}
                  {role === UserRole.ADMIN ? (
                    <a href="/dashboard/settings/users" className="rounded-md border px-3 py-2 hover:bg-accent">
                      Usuarios
                    </a>
                  ) : null}
                </nav>
                <form action={logoutAction} className="mt-2">
                  <button className="h-9 w-full rounded-md border px-3 text-sm" type="submit">
                    Salir
                  </button>
                </form>
              </div>
            </details>
          </div>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl p-4">{children}</div>
    </div>
  );
}
