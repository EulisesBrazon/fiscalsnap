"use client";

import { useEffect, useState } from "react";

type RetentionActionsProps = {
  pdfPath: string;
  voucherNumber: string;
};

export function RetentionActions({ pdfPath, voucherNumber }: RetentionActionsProps) {
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const normalizedPdfPath = pdfPath.startsWith("/") ? pdfPath : `/${pdfPath}`;
  const absoluteUrl = origin ? `${origin}${normalizedPdfPath}` : normalizedPdfPath;

  async function downloadPdf() {
    try {
      const response = await fetch(pdfPath);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `comprobante-${voucherNumber}.pdf`;
      anchor.click();

      URL.revokeObjectURL(url);
      setMessage("PDF descargado.");
    } catch {
      setMessage("No se pudo descargar el PDF.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setMessage("Enlace copiado al portapapeles.");
    } catch {
      setMessage("No se pudo copiar el enlace.");
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      setMessage("Tu navegador no soporta compartir nativo.");
      return;
    }

    try {
      await navigator.share({
        title: `Comprobante ${voucherNumber}`,
        text: `Comprobante de retención ${voucherNumber}`,
        url: absoluteUrl,
      });
      setMessage("Comprobante compartido.");
    } catch {
      // Ignore user-cancelled share events
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Comprobante ${voucherNumber}: ${absoluteUrl}`)}`;

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-4">
        <a href={pdfPath} target="_blank" rel="noreferrer" className="h-9 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
          Ver PDF
        </a>
        <button type="button" onClick={downloadPdf} className="h-9 rounded-md border px-3 text-sm font-medium">
          Descargar
        </button>
        <button type="button" onClick={copyLink} className="h-9 rounded-md border px-3 text-sm font-medium">
          Copiar enlace
        </button>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="h-9 rounded-md border px-3 py-2 text-center text-sm font-medium">
          WhatsApp
        </a>
      </div>

      <button type="button" onClick={nativeShare} className="h-9 w-full rounded-md border px-3 text-sm font-medium sm:w-auto">
        Compartir (nativo)
      </button>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
