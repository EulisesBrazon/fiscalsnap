"use client";

import { useEffect, useState } from "react";

import { ImageUpload } from "@/components/signature/image-upload";
import { SignatureCanvas } from "@/components/signature/signature-canvas";
import { getApiErrorMessage } from "@/lib/api-errors";

type CompanyResponse = {
  _id: string;
  name: string;
  rif: string;
  fiscalAddress: string;
  signature?: {
    image?: string;
    type?: "upload" | "canvas";
  };
  stamp?: {
    image?: string;
  };
};

type CompanySettingsClientProps = {
  canEdit: boolean;
};

export function CompanySettingsClient({ canEdit }: CompanySettingsClientProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [signatureType, setSignatureType] = useState<"upload" | "canvas">("upload");
  const [stampImage, setStampImage] = useState("");

  useEffect(() => {
    async function loadData() {
      const response = await fetch("/api/company");
      const payload = (await response.json()) as { data?: CompanyResponse; message?: string; errors?: Record<string, string[]> };

      if (!response.ok || !payload.data) {
        setMessage(getApiErrorMessage(payload, "No se pudo cargar la empresa"));
        setLoading(false);
        return;
      }

      setName(payload.data.name);
      setRif(payload.data.rif);
      setFiscalAddress(payload.data.fiscalAddress);
      setSignatureImage(payload.data.signature?.image ?? "");
      setSignatureType(payload.data.signature?.type ?? "upload");
      setStampImage(payload.data.stamp?.image ?? "");
      setLoading(false);
    }

    void loadData();
  }, []);

  async function saveCompany() {
    if (!canEdit) {
      setMessage("No tienes permisos para modificar la empresa.");
      return;
    }

    setSaving(true);
    setMessage("Guardando...");

    const response = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        fiscalAddress,
        signature: signatureImage
          ? {
              image: signatureImage,
              type: signatureType,
            }
          : undefined,
        stamp: stampImage
          ? {
              image: stampImage,
            }
          : undefined,
      }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };

    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo guardar."));
      setSaving(false);
      return;
    }

    setMessage("Configuración guardada.");
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando empresa...</p>;
  }

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-lg font-semibold">Datos de empresa</h1>
        <p className="mt-1 text-sm text-muted-foreground">Define la firma y sello para estampar automáticamente en los PDFs.</p>
      </section>

      {!canEdit ? (
        <section className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          Tienes acceso de solo lectura. Solo un administrador puede actualizar estos datos.
        </section>
      ) : null}

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input disabled={!canEdit} value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">RIF</label>
            <input value={rif} readOnly className="h-10 w-full rounded-md border bg-muted px-3 text-sm" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium">Dirección fiscal</label>
            <input disabled={!canEdit} value={fiscalAddress} onChange={(event) => setFiscalAddress(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Modo de firma</p>
          <div className="flex gap-2">
            <button disabled={!canEdit} type="button" onClick={() => setSignatureType("upload")} className={`h-9 rounded-md border px-3 text-sm ${signatureType === "upload" ? "bg-accent" : ""} disabled:opacity-60`}>
              Subir imagen
            </button>
            <button disabled={!canEdit} type="button" onClick={() => setSignatureType("canvas")} className={`h-9 rounded-md border px-3 text-sm ${signatureType === "canvas" ? "bg-accent" : ""} disabled:opacity-60`}>
              Dibujar
            </button>
          </div>
        </div>

        {signatureType === "upload" ? (
          <ImageUpload disabled={!canEdit} label="Firma" initialImage={signatureImage} onChange={(value) => setSignatureImage(value)} />
        ) : (
          <SignatureCanvas disabled={!canEdit} initialImage={signatureImage} onChange={(value) => setSignatureImage(value)} />
        )}

        <ImageUpload disabled={!canEdit} label="Sello" initialImage={stampImage} onChange={(value) => setStampImage(value)} />

        <button disabled={saving || !canEdit} onClick={saveCompany} type="button" className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </main>
  );
}
