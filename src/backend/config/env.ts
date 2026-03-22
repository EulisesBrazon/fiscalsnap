import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Keep this optional at module evaluation time so Next.js build can analyze routes
  // without requiring runtime-only secrets.
  MONGODB_URI: z.string().min(1).optional(),
  OCR_PROVIDER: z.enum(["tesseract", "openai", "google-vision"]).default("tesseract"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("fiscalsnap"),
});

export const env = envSchema.parse(process.env);

export function getRequiredMongoUri(): string {
  const mongoUri = env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required at runtime");
  }

  return mongoUri;
}

export type AppEnv = z.infer<typeof envSchema>;
