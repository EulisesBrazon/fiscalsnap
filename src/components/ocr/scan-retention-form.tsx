"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useRef } from "react";

import { getApiErrorMessage } from "@/lib/api-errors";

type Provider = {
  _id: string;
  rif: string;
  name: string;
};

type OcrResponse = {
  providerRif?: string;
  providerName?: string;
  invoiceNumber?: string;
  controlNumber?: string;
  machineSerial?: string;
  invoiceDate?: string;
  taxBase?: number;
  ivaAmount?: number;
  rawText: string;
};

type RetentionResult = {
  _id: string;
};

export function ScanRetentionForm({ providers }: { providers: Provider[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [emitBusy, setEmitBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [ocr, setOcr] = useState<OcrResponse | null>(null);

  const [providerId, setProviderId] = useState("");
  const [providerRif, setProviderRif] = useState("");
  const [providerName, setProviderName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [controlNumber, setControlNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [machineSerial, setMachineSerial] = useState("");
  const [taxBase, setTaxBase] = useState<string>("0");
  const [retentionPercentage, setRetentionPercentage] = useState<"75" | "100">("75");

  const existingProviderFromRif = useMemo(
    () => providers.find((item) => item.rif.toUpperCase() === providerRif.trim().toUpperCase()),
    [providers, providerRif],
  );

  const busy = ocrBusy || emitBusy;
  const parsedTaxBase = Number(taxBase);
  const hasValidInvoiceDate = /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate.trim());
  const canEmit =
    !busy &&
    invoiceNumber.trim().length > 0 &&
    controlNumber.trim().length > 0 &&
    hasValidInvoiceDate &&
    Number.isFinite(parsedTaxBase) &&
    parsedTaxBase > 0;

  function emitDisabledReason(): string {
    if (ocrBusy) return "El OCR sigue procesando la imagen. Espera a que finalice.";
    if (emitBusy) return "Se esta emitiendo el comprobante...";
    if (!invoiceNumber.trim()) return "Falta el numero de factura.";
    if (!controlNumber.trim()) return "Falta el numero de control.";
    if (!invoiceDate.trim()) return "Falta la fecha de factura.";
    if (!hasValidInvoiceDate) return "La fecha debe estar en formato YYYY-MM-DD.";
    if (!Number.isFinite(parsedTaxBase) || parsedTaxBase <= 0) return "La base imponible debe ser mayor a 0.";
    return "";
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleOcr(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setOcrBusy(true);
    setMessage("");
    setSelectedImageName(file.name);

    try {
      const dataUrl = await fileToBase64(file);
      setPreviewImage(dataUrl);
      const base64 = dataUrl.split(",")[1] ?? "";

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const payload = (await response.json()) as { data?: OcrResponse; message?: string; errors?: Record<string, string[]> };
      if (!response.ok) {
        setMessage(getApiErrorMessage(payload, "No se pudo procesar OCR"));
        return;
      }

      if (!payload.data) {
        setMessage("No se recibieron datos del OCR.");
        return;
      }

      setOcr(payload.data);
      setProviderRif(payload.data.providerRif ?? "");
      setProviderName(payload.data.providerName ?? "");
      setInvoiceNumber(payload.data.invoiceNumber ?? "");
      setControlNumber(payload.data.controlNumber ?? "");
      setMachineSerial(payload.data.machineSerial ?? "");
      setInvoiceDate(payload.data.invoiceDate ?? new Date().toISOString().slice(0, 10));
      setTaxBase(String(payload.data.taxBase ?? 0));
      setMessage("OCR completado. Revisa y confirma los datos.");
    } catch {
      setMessage("Error al procesar la imagen.");
    } finally {
      setOcrBusy(false);
    }
  }

  async function ensureProvider(): Promise<string | null> {
    if (providerId) return providerId;

    if (existingProviderFromRif) {
      return existingProviderFromRif._id;
    }

    if (!providerRif || !providerName) {
      setMessage("Debes seleccionar o crear un proveedor.");
      return null;
    }

    const response = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rif: providerRif, name: providerName }),
    });

    const payload = (await response.json()) as { data?: Provider; message?: string; errors?: Record<string, string[]> };
    if (!response.ok || !payload.data) {
      setMessage(getApiErrorMessage(payload, "No se pudo registrar el proveedor."));
      return null;
    }

    return payload.data._id;
  }

  async function emitRetention() {
    if (!invoiceNumber.trim()) {
      setMessage("Debes indicar el numero de factura.");
      return;
    }

    if (!controlNumber.trim()) {
      setMessage("Debes indicar el numero de control.");
      return;
    }

    if (!invoiceDate.trim()) {
      setMessage("Debes indicar la fecha de la factura.");
      return;
    }

    if (!hasValidInvoiceDate) {
      setMessage("La fecha de la factura debe estar en formato YYYY-MM-DD.");
      return;
    }

    if (!Number.isFinite(parsedTaxBase) || parsedTaxBase <= 0) {
      setMessage("La base imponible debe ser mayor a 0.");
      return;
    }

    setEmitBusy(true);
    setMessage("Emitiendo comprobante...");

    try {
      const selectedProviderId = await ensureProvider();
      if (!selectedProviderId) return;

      const response = await fetch("/api/retentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProviderId,
          invoiceNumber,
          controlNumber,
          invoiceDate,
          machineSerial,
          taxBase: parsedTaxBase,
          retentionPercentage: Number(retentionPercentage),
          ocrRawData: ocr,
        }),
      });

      const payload = (await response.json()) as { data?: RetentionResult; message?: string; errors?: Record<string, string[]> };
      if (!response.ok || !payload.data) {
        setMessage(getApiErrorMessage(payload, "No se pudo emitir la retención."));
        return;
      }

      const detailUrl = `${window.location.origin}/dashboard/retentions/${payload.data._id}`;
      const whatsappText = encodeURIComponent(`Comprobante de retención emitido. Detalle: ${detailUrl}`);
      const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

      setMessage("Retención emitida con éxito. Puedes compartirla por WhatsApp o ver el detalle.");

      const openWhatsapp = window.confirm("¿Deseas compartir el comprobante por WhatsApp ahora?");
      if (openWhatsapp) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      router.push(`/dashboard/retentions/${payload.data._id}`);
    } catch {
      setMessage("Ocurrió un error al emitir.");
    } finally {
      setEmitBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold">1) Captura de factura</h2>
        <p className="mt-1 text-sm text-muted-foreground">Toma una foto o selecciona una imagen de factura fiscal.</p>

        <div className="mt-3 rounded-lg border border-dashed p-3">
          <input
            ref={fileInputRef}
            disabled={busy}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleOcr}
            className="hidden"
          />

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{previewImage ? "Imagen seleccionada" : "Selecciona una imagen"}</p>
              <p className="text-xs text-muted-foreground">
                {selectedImageName || "PNG/JPG. Idealmente factura completa y legible."}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="h-9 shrink-0 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
            >
              {previewImage ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
          </div>

          {previewImage ? (
            <div className="mt-3 relative inline-block">
              <Image
                src={previewImage}
                alt="Factura"
                width={900}
                height={600}
                unoptimized
                className="max-h-60 w-auto rounded-md border object-contain"
              />
              {ocrBusy ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                  <div className="flex items-center gap-2 rounded-md bg-background/95 px-3 py-2 text-sm">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/80 border-t-transparent" />
                    Procesando OCR...
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {!previewImage && ocrBusy ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/80 border-t-transparent" />
              Procesando OCR...
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold">2) Validación de datos</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Proveedor existente</label>
            <select value={providerId} onChange={(event) => setProviderId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Seleccionar manualmente</option>
              {providers.map((item) => (
                <option key={item._id} value={item._id}>{`${item.name} (${item.rif})`}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">RIF proveedor</label>
            <input value={providerRif} onChange={(event) => setProviderRif(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Nombre proveedor</label>
            <input value={providerName} onChange={(event) => setProviderName(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nro factura</label>
            <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nro control</label>
            <input value={controlNumber} onChange={(event) => setControlNumber(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha factura</label>
            <input value={invoiceDate} type="date" onChange={(event) => setInvoiceDate(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Serial máquina (MH/Z)</label>
            <input value={machineSerial} onChange={(event) => setMachineSerial(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Base imponible</label>
            <input value={taxBase} type="number" min={0} step="0.01" onChange={(event) => setTaxBase(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">% retención</label>
            <select value={retentionPercentage} onChange={(event) => setRetentionPercentage(event.target.value as "75" | "100")} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="75">75%</option>
              <option value="100">100%</option>
            </select>
          </div>
        </div>

        <button disabled={!canEmit} onClick={emitRetention} type="button" className="mt-4 h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {emitBusy ? "Emitiendo comprobante..." : ocrBusy ? "Procesando OCR..." : "Emitir comprobante"}
        </button>

        {!canEmit ? <p className="mt-2 text-xs text-muted-foreground">{emitDisabledReason()}</p> : null}

        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </div>
  );
}
