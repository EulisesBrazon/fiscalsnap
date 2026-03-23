"use client";

import { useEffect, useState } from "react";

type RetentionActionsProps = {
  pdfPath: string;
  voucherNumber: string;
};

export function RetentionActions({ pdfPath, voucherNumber }: RetentionActionsProps) {
  const [message, setMessage] = useState("");

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

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <a href={pdfPath} target="_blank" rel="noreferrer" className="h-9 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
          Ver PDF
        </a>
        <button type="button" onClick={downloadPdf} className="h-9 rounded-md border px-3 text-sm font-medium">
          Descargar
        </button>
      </div>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
