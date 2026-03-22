import { normalizeRif, RIF_REGEX } from "@/backend/shared/validation";

import type { OcrExtractionResult } from "@/backend/modules/ocr/ocr.types";

const INVOICE_REGEX = /(FACTURA|NRO\.? FACTURA)\s*[:#-]?\s*([A-Z0-9-]+)/i;
const CONTROL_REGEX = /(CONTROL|NRO\.? CONTROL)\s*[:#-]?\s*([A-Z0-9-]+)/i;
const MACHINE_REGEX = /(SERIAL(?:\s+MAQUINA)?|MAQUINA|M[AÁ]QUINA|S\/N|MH)\s*[:#-]?\s*([A-Z0-9-]{3,})/i;
const DATE_REGEX = /(\d{2}[/-]\d{2}[/-]\d{4})/;
const SHORT_DATE_REGEX = /(\d{2}[/-]\d{2}[/-]\d{2})/;
const BASE_REGEX = /(BASE\s+IMPONIBLE|BASE)\s*[:#-]?\s*([\d.,]+)/i;
const IVA_REGEX = /(IVA)\s*[:#-]?\s*([\d.,]+)/i;
const LOOSE_RIF_REGEX = /\b([JGVEP])[-\s]?(\d{8})(\d)\b/i;
const INVOICE_LABEL_LINE_REGEX = /(?:^|\b)(FACTURA|NRO\.?\s*FACTURA)\b/i;

function isRifLike(value: string): boolean {
  const compact = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return /^[JGVEP]\d{9}$/.test(compact);
}

function isLikelyBusinessName(value: string): boolean {
  const candidate = value.trim();
  if (candidate.length < 4) return false;
  if (/^(SENIAT|RIF|FACTURA|FECHA|TOTAL|BASE|IVA)\b/i.test(candidate)) return false;

  const letters = (candidate.match(/[A-ZÁÉÍÓÚÑ]/gi) ?? []).length;
  const digits = (candidate.match(/\d/g) ?? []).length;

  if (letters < 4) return false;
  if (digits > 2) return false;

  return true;
}

function extractRifValue(rawText: string): string | undefined {
  const strictMatch = rawText.match(RIF_REGEX)?.[0];
  if (strictMatch) {
    return normalizeRif(strictMatch);
  }

  const looseMatch = rawText.match(LOOSE_RIF_REGEX);
  if (!looseMatch) {
    return undefined;
  }

  const [, letter, body, checkDigit] = looseMatch;
  return `${letter.toUpperCase()}-${body}-${checkDigit}`;
}

function extractInvoiceNumber(rawText: string, lines: string[]): string | undefined {
  const strict = rawText.match(INVOICE_REGEX)?.[2];
  if (strict && strict.length >= 3 && !isRifLike(strict)) {
    const digits = strict.replace(/[^0-9]/g, "").length;
    if (digits >= 4) {
      return strict;
    }
  }

  const invoiceLines = lines.filter((line) => INVOICE_LABEL_LINE_REGEX.test(line));
  for (const line of invoiceLines) {
    const tokens = line.match(/\b[A-Z0-9-]{3,20}\b/gi) ?? [];

    const best = tokens.find((token) => {
      if (INVOICE_LABEL_LINE_REGEX.test(token)) return false;
      if (isRifLike(token)) return false;

      const compact = token.replace(/-/g, "");
      const digits = compact.match(/\d/g)?.length ?? 0;
      return digits >= 4;
    });

    if (best) {
      return best;
    }
  }

  // Last fallback: prefer long numeric token (common invoice correlatives) and avoid RIF-like values.
  const numericTokens = rawText.match(/\b\d{6,12}\b/g) ?? [];
  const numericFallback = numericTokens.find((token) => !isRifLike(token));
  if (numericFallback) {
    return numericFallback;
  }

  return undefined;
}

function toNumber(value?: string): number | undefined {
  if (!value) return undefined;

  const normalized = value
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeDate(dateValue?: string): string | undefined {
  if (!dateValue) return undefined;
  const parts = dateValue.split(/[/-]/);
  if (parts.length !== 3) return undefined;

  const [day, month, rawYear] = parts;
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function inferProviderName(lines: string[], rifLineIndex: number): string | undefined {
  if (rifLineIndex < 0) return undefined;

  // Prefer nearby lines after the RIF. In fiscal invoices the business name commonly appears below RIF.
  for (let idx = rifLineIndex + 1; idx < Math.min(lines.length, rifLineIndex + 5); idx += 1) {
    const candidate = lines[idx]?.trim();
    if (!candidate) continue;
    if (RIF_REGEX.test(candidate)) continue;
    if (isLikelyBusinessName(candidate)) {
      return candidate;
    }
  }

  // Fallback to previous lines if needed.
  for (let idx = rifLineIndex - 1; idx >= 0; idx -= 1) {
    const candidate = lines[idx]?.trim();
    if (!candidate) continue;
    if (RIF_REGEX.test(candidate)) continue;
    if (isLikelyBusinessName(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function parseFiscalInvoiceText(rawText: string): OcrExtractionResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rifValue = extractRifValue(rawText);
  const invoiceNumber = extractInvoiceNumber(rawText, lines);
  const controlMatch = rawText.match(CONTROL_REGEX);
  const machineMatch = rawText.match(MACHINE_REGEX);
  const dateMatch = rawText.match(DATE_REGEX);
  const shortDateMatch = rawText.match(SHORT_DATE_REGEX);
  const baseMatch = rawText.match(BASE_REGEX);
  const ivaMatch = rawText.match(IVA_REGEX);

  const rifNeedle = rifValue?.replace(/[^A-Z0-9]/gi, "");
  const rifLineIndex = rifNeedle
    ? lines.findIndex((line) => line.replace(/[^A-Z0-9]/gi, "").includes(rifNeedle))
    : -1;

  const parsedBase = toNumber(baseMatch?.[2]);
  const parsedIva = toNumber(ivaMatch?.[2]);
  const defaultTaxRate = 16;

  const derivedBase = parsedBase ?? (parsedIva ? Number((parsedIva / (defaultTaxRate / 100)).toFixed(2)) : undefined);
  const derivedIva = parsedIva ?? (parsedBase ? Number((parsedBase * (defaultTaxRate / 100)).toFixed(2)) : undefined);

  return {
    rawText,
    providerRif: rifValue,
    providerName: inferProviderName(lines, rifLineIndex),
    invoiceNumber,
    controlNumber: controlMatch?.[2],
    machineSerial: machineMatch?.[2],
    invoiceDate: normalizeDate(dateMatch?.[1] ?? shortDateMatch?.[1]),
    taxBase: derivedBase,
    ivaAmount: derivedIva,
  };
}
