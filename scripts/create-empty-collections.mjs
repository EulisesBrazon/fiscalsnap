import fs from "node:fs";
import path from "node:path";

import mongoose from "mongoose";

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

async function ensureCollection(db, name) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length > 0) {
    console.log(`= ${name} (ya existe)`);
    return;
  }

  await db.createCollection(name);
  console.log(`+ ${name} (creada)`);
}

async function ensureIndexes(db, collectionName, indexes) {
  if (!indexes.length) {
    return;
  }

  await db.collection(collectionName).createIndexes(indexes);
  console.log(`  indexes -> ${collectionName} (${indexes.length})`);
}

async function main() {
  const cwd = process.cwd();
  const envFile = readEnvFile(path.join(cwd, ".env"));

  const mongoUri = process.env.MONGODB_URI || envFile.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || envFile.MONGODB_DB || "FiscalSnap";

  if (!mongoUri) {
    throw new Error("MONGODB_URI no esta definido en variables de entorno ni en .env");
  }

  await mongoose.connect(mongoUri, { dbName });
  const db = mongoose.connection.db;

  const definitions = [
    {
      name: "tenants",
      indexes: [{ key: { rif: 1 }, name: "rif_1", unique: true }],
    },
    {
      name: "users",
      indexes: [{ key: { tenantId: 1, email: 1 }, name: "tenantId_1_email_1", unique: true }],
    },
    {
      name: "providers",
      indexes: [
        { key: { tenantId: 1, rif: 1 }, name: "tenantId_1_rif_1", unique: true },
        { key: { tenantId: 1, createdAt: -1 }, name: "tenantId_1_createdAt_-1" },
      ],
    },
    {
      name: "retentions",
      indexes: [
        { key: { tenantId: 1, voucherNumber: 1 }, name: "tenantId_1_voucherNumber_1", unique: true },
        { key: { tenantId: 1, createdAt: -1 }, name: "tenantId_1_createdAt_-1" },
        { key: { tenantId: 1, invoiceNumber: 1 }, name: "tenantId_1_invoiceNumber_1" },
      ],
    },
    {
      name: "pdftemplates",
      indexes: [
        { key: { tenantId: 1, name: 1 }, name: "tenantId_1_name_1" },
        { key: { tenantId: 1, isDefault: 1 }, name: "tenantId_1_isDefault_1" },
      ],
    },
    {
      name: "templaterevisions",
      indexes: [
        { key: { tenantId: 1, templateId: 1, version: -1 }, name: "tenantId_1_templateId_1_version_-1" },
        { key: { tenantId: 1, templateId: 1, createdAt: -1 }, name: "tenantId_1_templateId_1_createdAt_-1" },
      ],
    },
  ];

  console.log(`Mongo OK -> DB: ${db.databaseName}`);
  console.log("Inicializando colecciones base...");

  for (const definition of definitions) {
    await ensureCollection(db, definition.name);
    await ensureIndexes(db, definition.name, definition.indexes);
  }

  const collections = await db.listCollections().toArray();
  const names = collections.map((item) => item.name).sort();
  console.log(`Colecciones actuales (${names.length}): ${names.join(", ")}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`ERROR: ${error.message}`);
  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect errors on failure path.
  }
  process.exit(1);
});
