"use client";

import { useState } from "react";
import Image from "next/image";

type ImageUploadProps = {
  label: string;
  onChange: (value: string) => void;
  initialImage?: string;
  disabled?: boolean;
};

export function ImageUpload({ label, onChange, initialImage, disabled = false }: ImageUploadProps) {
  const [preview, setPreview] = useState(initialImage ?? "");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input disabled={disabled} type="file" accept="image/png,image/jpeg" onChange={handleFile} className="block w-full text-sm disabled:opacity-60" />
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
    </div>
  );
}
