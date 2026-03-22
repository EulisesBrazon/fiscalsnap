import Link from "next/link";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">Bienvenido, {session?.user?.name ?? "Administrador"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Flujo recomendado: escanear factura, validar datos, emitir comprobante y abrir PDF.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/scan" className="rounded-xl border bg-card p-4 hover:bg-accent">
          <h3 className="font-medium">Escanear y emitir</h3>
          <p className="mt-1 text-sm text-muted-foreground">Captura una factura fiscal y emite comprobante.</p>
        </Link>
        <Link href="/dashboard/retentions" className="rounded-xl border bg-card p-4 hover:bg-accent">
          <h3 className="font-medium">Comprobantes</h3>
          <p className="mt-1 text-sm text-muted-foreground">Consulta y abre PDFs emitidos.</p>
        </Link>
        <Link href="/dashboard/settings/company" className="rounded-xl border bg-card p-4 hover:bg-accent">
          <h3 className="font-medium">Empresa y firma</h3>
          <p className="mt-1 text-sm text-muted-foreground">Configura firma y sello para el PDF.</p>
        </Link>
      </section>
    </main>
  );
}
