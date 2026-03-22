/**
 * Upload stamp+signature image to Cloudinary and save URL to tenant.
 *
 * Usage:
 *   node scripts/upload-tenant-stamp.mjs <path-to-image.png> [tenantId]
 *
 * Example:
 *   node scripts/upload-tenant-stamp.mjs public/sello-firma.png 69c0174c26cc9a9a1685b10d
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import mongoose from "mongoose";

// ── Helpers ──────────────────────────────────

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function signParams(params, apiSecret) {
  const serialized = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

// ── Main ─────────────────────────────────────

async function main() {
  const imagePath = process.argv[2];
  const tenantId = process.argv[3] || "69c0174c26cc9a9a1685b10d";

  if (!imagePath) {
    console.error("Uso: node scripts/upload-tenant-stamp.mjs <ruta-imagen.png> [tenantId]");
    process.exit(1);
  }

  const absolutePath = path.resolve(imagePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Archivo no encontrado: ${absolutePath}`);
    process.exit(1);
  }

  const envFile = readEnvFile(path.join(process.cwd(), ".env"));
  const mongoUri = process.env.MONGODB_URI || envFile.MONGODB_URI;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || envFile.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || envFile.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || envFile.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || envFile.CLOUDINARY_UPLOAD_FOLDER || "fiscalsnap";

  if (!mongoUri) { console.error("MONGODB_URI no definido"); process.exit(1); }
  if (!cloudName || !apiKey || !apiSecret) { console.error("Credenciales de Cloudinary incompletas"); process.exit(1); }

  // 1. Upload to Cloudinary
  console.log(`Subiendo imagen: ${absolutePath}`);
  const fileBytes = fs.readFileSync(absolutePath);
  const base64Data = fileBytes.toString("base64");
  const ext = path.extname(absolutePath).replace(".", "") || "png";
  const dataUri = `data:image/${ext};base64,${base64Data}`;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `stamp-${tenantId}-${Date.now()}`;
  const uploadFolder = `${folder}/tenants/${tenantId}/stamp`;

  const paramsToSign = { folder: uploadFolder, public_id: publicId, timestamp };
  const signature = signParams(paramsToSign, apiSecret);

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("folder", uploadFolder);
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadResult.secure_url) {
    console.error("Error de Cloudinary:", uploadResult.error?.message ?? JSON.stringify(uploadResult));
    process.exit(1);
  }

  const stampUrl = uploadResult.secure_url;
  console.log(`✓ Imagen subida: ${stampUrl}`);
  console.log(`  Public ID: ${uploadResult.public_id}`);
  console.log(`  Tamaño: ${uploadResult.width}x${uploadResult.height} (${uploadResult.bytes} bytes)`);

  // 2. Save URL to tenant in MongoDB
  console.log(`\nActualizando tenant ${tenantId} en MongoDB...`);
  await mongoose.connect(mongoUri, { dbName: "FiscalSnap" });

  const result = await mongoose.connection.db.collection("tenants").updateOne(
    { _id: new mongoose.Types.ObjectId(tenantId) },
    {
      $set: {
        "stamp.image": stampUrl,
        "signature.image": stampUrl,
        "signature.type": "upload",
      },
    },
  );

  if (result.matchedCount === 0) {
    console.error(`Tenant ${tenantId} no encontrado en la base de datos.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✓ Tenant actualizado (matched: ${result.matchedCount}, modified: ${result.modifiedCount})`);
  console.log(`\nURL guardada en stamp.image y signature.image:\n  ${stampUrl}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`ERROR: ${error.message}`);
  try { await mongoose.disconnect(); } catch { /* ignore */ }
  process.exit(1);
});
