"use client";

import { useEffect, useState } from "react";

import { ImageUpload } from "@/components/signature/image-upload";
import { getApiErrorMessage } from "@/lib/api-errors";

type CompanyResponse = {
  _id: string;
  name: string;
  rif: string;
  fiscalAddress: string;
  uiTheme?: {
    mode?: "light" | "dark";
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      neutral?: string;
    };
  };
  signature?: {
    image?: string;
    type?: "upload" | "canvas";
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
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [themePrimary, setThemePrimary] = useState("#4F4BD8");
  const [themeSecondary, setThemeSecondary] = useState("#1F1B1F");
  const [themeAccent, setThemeAccent] = useState("#7A80A3");
  const [themeNeutral, setThemeNeutral] = useState("#E7E9F5");
  const [signatureImage, setSignatureImage] = useState("");

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
      setThemeMode(payload.data.uiTheme?.mode === "light" ? "light" : "dark");
      setThemePrimary(payload.data.uiTheme?.colors?.primary ?? "#4F4BD8");
      setThemeSecondary(payload.data.uiTheme?.colors?.secondary ?? "#1F1B1F");
      setThemeAccent(payload.data.uiTheme?.colors?.accent ?? "#7A80A3");
      setThemeNeutral(payload.data.uiTheme?.colors?.neutral ?? "#E7E9F5");
      setSignatureImage(payload.data.signature?.image ?? "");
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
        uiTheme: {
          mode: themeMode,
          colors: {
            primary: themePrimary,
            secondary: themeSecondary,
            accent: themeAccent,
            neutral: themeNeutral,
          },
        },
        signature: signatureImage
          ? {
              image: signatureImage,
              type: "upload",
            }
          : null,
        stamp: null,
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

        <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div>
            <p className="text-sm font-medium">Tema de interfaz por empresa</p>
            <p className="text-xs text-muted-foreground">Estos colores se aplican a la interfaz web del tenant (el PDF no se altera).</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Modo preferido</label>
            <select
              disabled={!canEdit}
              value={themeMode}
              onChange={(event) => setThemeMode(event.target.value === "light" ? "light" : "dark")}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
            >
              <option value="dark">Oscuro</option>
              <option value="light">Claro</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color primario</label>
              <input disabled={!canEdit} type="color" value={themePrimary} onChange={(event) => setThemePrimary(event.target.value.toUpperCase())} className="h-10 w-full rounded-md border bg-background p-1 disabled:opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color secundario</label>
              <input disabled={!canEdit} type="color" value={themeSecondary} onChange={(event) => setThemeSecondary(event.target.value.toUpperCase())} className="h-10 w-full rounded-md border bg-background p-1 disabled:opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color acento</label>
              <input disabled={!canEdit} type="color" value={themeAccent} onChange={(event) => setThemeAccent(event.target.value.toUpperCase())} className="h-10 w-full rounded-md border bg-background p-1 disabled:opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Color neutro</label>
              <input disabled={!canEdit} type="color" value={themeNeutral} onChange={(event) => setThemeNeutral(event.target.value.toUpperCase())} className="h-10 w-full rounded-md border bg-background p-1 disabled:opacity-60" />
            </div>
          </div>
        </div>

        <ImageUpload disabled={!canEdit} label="Firma" assetKind="signature" initialImage={signatureImage} onChange={(value) => setSignatureImage(value)} />

        <button
          disabled={!canEdit || !signatureImage}
          type="button"
          onClick={() => setSignatureImage("")}
          className="h-9 rounded-md border px-3 text-sm disabled:opacity-60"
        >
          Limpiar firma
        </button>

        <button disabled={saving || !canEdit} onClick={saveCompany} type="button" className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </main>
  );
}
