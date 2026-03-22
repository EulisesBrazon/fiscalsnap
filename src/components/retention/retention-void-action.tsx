"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/api-errors";

type RetentionVoidActionProps = {
  retentionId: string;
};

export function RetentionVoidAction({ retentionId }: RetentionVoidActionProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function voidRetention() {
    if (reason.trim().length < 5) {
      setMessage("Describe un motivo de al menos 5 caracteres.");
      return;
    }

    if (!window.confirm("Esta accion anulara el comprobante de forma permanente. Deseas continuar?")) {
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
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
      <p className="text-sm font-medium">Anular comprobante</p>
      <textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        placeholder="Motivo de anulacion"
        className="w-full rounded-md border bg-background p-2 text-sm"
      />
      <button
        type="button"
        onClick={voidRetention}
        disabled={loading}
        className="h-9 rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive disabled:opacity-60"
      >
        {loading ? "Procesando..." : "Anular"}
      </button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
