"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api-errors";

type RetentionVoidActionProps = {
  retentionId: string;
};

export function RetentionVoidAction({ retentionId }: RetentionVoidActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function voidRetention() {
    if (reason.trim().length < 5) {
      setMessage("Describe un motivo de al menos 5 caracteres.");
      return;
    }

    setLoading(true);
    setMessage("Anulando comprobante...");

    const response = await fetch(`/api/retentions/${retentionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };

    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo anular el comprobante."));
      setLoading(false);
      return;
    }

    setMessage("Comprobante anulado.");
    setReason("");
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/40 text-destructive disabled:opacity-60"
        aria-label="Anular comprobante"
        title="Anular comprobante"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>

      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-4 shadow-xl">
            <h3 className="text-base font-semibold">Confirmar anulación</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta acción anulará el comprobante de forma permanente. ¿Estás seguro?
            </p>

            <div className="mt-3 space-y-1.5">
              <label className="text-sm font-medium">Motivo de anulación</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                placeholder="Ej: Error en datos del comprobante"
                className="w-full rounded-md border bg-background p-2 text-sm"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                }}
                className="h-9 rounded-md border px-3 text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={voidRetention}
                disabled={loading}
                className="h-9 rounded-md border border-destructive/40 bg-destructive/10 px-3 text-sm font-medium text-destructive disabled:opacity-60"
              >
                {loading ? "Procesando..." : "Sí, anular"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
