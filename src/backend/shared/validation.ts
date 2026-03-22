import { z } from "zod";

export const RIF_REGEX = /^[JGVEP]-\d{8}-\d$/i;

export function normalizeRif(value: string): string {
  return value.trim().toUpperCase();
}

export const rifSchema = z
  .string()
  .transform((value) => normalizeRif(value))
  .refine((value) => RIF_REGEX.test(value), "RIF inválido. Formato esperado: J-12345678-9");

export const emailSchema = z.string().trim().toLowerCase().email();
