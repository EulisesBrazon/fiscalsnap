import { connectToDatabase } from "@/backend/config/database";
import { providerService } from "@/backend/modules/provider/provider.service";
import { ScanRetentionForm } from "@/components/ocr/scan-retention-form";
import { auth } from "@/lib/auth";

export default async function ScanPage() {
  await connectToDatabase();

  const session = await auth();
  const tenantId = session?.user?.tenantId;

  const providers = tenantId ? await providerService.list(tenantId) : [];

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-lg font-semibold">Escanear factura y emitir retención</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flujo rápido: captura, validación y emisión en un solo paso.</p>
      </section>
      <ScanRetentionForm providers={providers.map((item) => ({ _id: String(item._id), rif: item.rif, name: item.name }))} />
    </main>
  );
}
