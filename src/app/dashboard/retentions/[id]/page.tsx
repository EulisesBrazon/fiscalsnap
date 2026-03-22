import { notFound } from "next/navigation";

import { connectToDatabase } from "@/backend/config/database";
import { UserRole } from "@/backend/shared/types";
import { retentionService } from "@/backend/modules/retention/retention.service";
import { RetentionActions } from "@/components/retention/retention-actions";
import { RetentionVoidAction } from "@/components/retention/retention-void-action";
import { auth } from "@/lib/auth";

export default async function RetentionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userRole = session?.user?.role;

  if (!tenantId) {
    notFound();
  }

  const { id } = await params;

  try {
    const retention = await retentionService.getById(tenantId, id);

    return (
      <main className="space-y-4">
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">Comprobante {retention.voucherNumber}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Factura {retention.invoiceNumber} · Control {retention.controlNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estado: {retention.status === "voided" ? "Anulado" : "Emitido"}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <RetentionActions pdfPath={`/api/retentions/${id}/pdf`} voucherNumber={retention.voucherNumber} />
          </div>

          {retention.status === "voided" ? (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">Comprobante anulado</p>
              <p className="mt-1">Motivo: {retention.voidReason ?? "No especificado"}</p>
              <p className="mt-1">
                Anulado por: {((retention.voidedBy as { name?: string; email?: string } | undefined)?.name ?? "N/A")} ({((retention.voidedBy as { name?: string; email?: string } | undefined)?.email ?? "-")})
              </p>
              <p className="mt-1">Fecha de anulación: {retention.voidedAt ? new Date(retention.voidedAt).toISOString().slice(0, 10) : "-"}</p>
            </div>
          ) : null}

          {retention.status !== "voided" && [UserRole.ADMIN, UserRole.SUPERVISOR].includes(userRole as UserRole) ? (
            <div className="mt-3">
              <RetentionVoidAction retentionId={id} />
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Base imponible</p>
            <p className="font-medium">{retention.taxBase.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">IVA</p>
            <p className="font-medium">{retention.ivaAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">% Retención</p>
            <p className="font-medium">{retention.retentionPercentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monto retenido</p>
            <p className="font-medium">{retention.retentionAmount.toFixed(2)}</p>
          </div>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
