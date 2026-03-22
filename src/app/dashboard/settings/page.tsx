import Link from "next/link";

import { UserRole } from "@/backend/shared/types";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  const role = session?.user?.role;

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-lg font-semibold">Configuración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra datos de empresa, firma y sello.</p>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="space-y-2">
          <Link href="/dashboard/settings/company" className="block text-sm font-medium underline underline-offset-4">
            Datos de empresa, firma y sello
          </Link>
          {role === UserRole.ADMIN ? (
            <Link href="/dashboard/settings/templates" className="block text-sm font-medium underline underline-offset-4">
              Templates PDF editables
            </Link>
          ) : null}
          {role === UserRole.ADMIN ? (
            <Link href="/dashboard/settings/users" className="block text-sm font-medium underline underline-offset-4">
              Usuarios y roles
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
