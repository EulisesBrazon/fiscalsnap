"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { getApiErrorMessage } from "@/lib/api-errors";

type ImageUploadProps = {
  label: string;
  onChange: (value: string) => void;
  initialImage?: string;
  disabled?: boolean;
  assetKind?: "signature" | "stamp";
};

export function ImageUpload({ label, onChange, initialImage, disabled = false, assetKind = "signature" }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState(initialImage ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg"]);
    if (!allowedTypes.has(file.type)) {
      setMessage("Solo se permiten archivos PNG, JPG o JPEG.");
      return;
    }

    setUploading(true);
    setMessage("Subiendo imagen...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetKind", assetKind);

    const response = await fetch("/api/company/upload", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      data?: { url?: string; assetRef?: string };
      message?: string;
      errors?: Record<string, string[]>;
    };

    if (!response.ok || !payload.data?.url) {
      setMessage(getApiErrorMessage(payload, "No se pudo subir la imagen."));
      setUploading(false);
      return;
    }

    setPreview(payload.data.url);
    onChange(payload.data.assetRef ?? payload.data.url);
    setMessage("Imagen subida correctamente.");
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      <input
        ref={fileInputRef}
        disabled={disabled || uploading}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        onChange={handleFile}
        className="sr-only"
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        className="h-9 rounded-md border px-3 text-sm disabled:opacity-60"
      >
        {uploading ? "Subiendo..." : preview ? `Reemplazar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
      </button>

      <p className="text-xs text-muted-foreground">Formatos permitidos: PNG, JPG o JPEG (máximo 2MB).</p>

      {preview ? (
        <Image
          src={preview}
          alt={label}
          width={480}
          height={140}
          unoptimized
          className="max-h-28 w-auto rounded-md border bg-white p-2"
        />
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
