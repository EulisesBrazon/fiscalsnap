import { createHash } from "node:crypto";

import { env } from "@/backend/config/env";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

function getCloudinaryConfig() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const folder = env.CLOUDINARY_UPLOAD_FOLDER;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary no está configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.");
  }

  return { cloudName, apiKey, apiSecret, folder };
}

function signUpload(params: Record<string, string>, apiSecret: string): string {
  const serialized = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

export async function uploadPngToCloudinary(input: {
  bytes: Uint8Array;
  tenantId: string;
  assetKind: "signature" | "stamp";
}): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `${input.assetKind}-${input.tenantId}-${Date.now()}`;
  const uploadFolder = `${folder}/tenants/${input.tenantId}/${input.assetKind}`;

  const paramsToSign = {
    folder: uploadFolder,
    public_id: publicId,
    timestamp,
  };

  const signature = signUpload(paramsToSign, apiSecret);

  const fileDataUri = `data:image/png;base64,${Buffer.from(input.bytes).toString("base64")}`;

  const formData = new FormData();
  formData.append("file", fileDataUri);
  formData.append("folder", uploadFolder);
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message ?? "No se pudo subir la imagen a Cloudinary");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    format: payload.format,
    bytes: payload.bytes,
    width: payload.width,
    height: payload.height,
  };
}

export async function uploadPngDataUriToCloudinary(input: {
  dataUri: string;
  tenantId: string;
  assetKind: "signature" | "stamp";
}): Promise<CloudinaryUploadResult> {
  const match = input.dataUri.match(/^data:image\/png;base64,(.+)$/i);
  if (!match) {
    throw new Error("Formato de imagen inválido. Se esperaba un PNG en base64.");
  }

  const bytes = new Uint8Array(Buffer.from(match[1], "base64"));
  return uploadPngToCloudinary({
    bytes,
    tenantId: input.tenantId,
    assetKind: input.assetKind,
  });
}
