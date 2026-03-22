import Link from "next/link";

import { connectToDatabase } from "@/backend/config/database";
import { retentionService } from "@/backend/modules/retention/retention.service";
import { auth } from "@/lib/auth";

type SearchParams = {
  q?: string;
  providerRif?: string;
  status?: "issued" | "voided";
  from?: string;
  to?: string;
};

export default async function RetentionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connectToDatabase();

  const session = await auth();
  const tenantId = session?.user?.tenantId;

  const filters = await searchParams;

  const retentions = tenantId
    ? await retentionService.search(tenantId, {
        q: filters.q,
        providerRif: filters.providerRif,
        status: filters.status,
        from: filters.from,
        to: filters.to,
      })
    : [];

  return (
    <main className="space-y-4">
      <section className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div>
          <h1 className="text-lg font-semibold">Comprobantes emitidos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta por comprobante y abre su PDF.</p>
        </div>
        <Link href="/dashboard/scan" className="h-9 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Nuevo
        </Link>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <form className="grid gap-3 sm:grid-cols-5" method="GET">
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Comprobante, factura o control"
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
          <input
            name="providerRif"
            defaultValue={filters.providerRif ?? ""}
            placeholder="RIF proveedor"
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
          <select name="status" defaultValue={filters.status ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">Todos los estados</option>
            <option value="issued">Emitidos</option>
            <option value="voided">Anulados</option>
          </select>
          <input name="from" type="date" defaultValue={filters.from ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm" />
          <input name="to" type="date" defaultValue={filters.to ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm" />

          <button type="submit" className="h-10 rounded-md border px-3 text-sm font-medium sm:col-span-3">
            Filtrar
          </button>
          <Link href="/dashboard/retentions" className="flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium sm:col-span-2">
            Limpiar filtros
          </Link>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Comprobante</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">RIF proveedor</th>
              <th className="px-3 py-2">Factura</th>
              <th className="px-3 py-2">Retención</th>
              <th className="px-3 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {retentions.map((item) => (
              <tr key={String(item._id)} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/dashboard/retentions/${String(item._id)}`} className="font-medium underline underline-offset-4">
                    {item.voucherNumber}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === "voided" ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"}`}>
                    {item.status === "voided" ? "Anulado" : "Emitido"}
                  </span>
                </td>
                <td className="px-3 py-2">{((item.providerId as { rif?: string } | undefined)?.rif ?? "-")}</td>
                <td className="px-3 py-2">{item.invoiceNumber}</td>
                <td className="px-3 py-2">{item.retentionAmount.toFixed(2)}</td>
                <td className="px-3 py-2">{item.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {retentions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Aún no has emitido comprobantes.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}
