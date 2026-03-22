import { env } from "@/backend/config/env";

import { parseFiscalInvoiceText } from "./parsers/fiscal-invoice.parser";
import { GoogleVisionStrategy } from "./strategies/google-vision.strategy";
import { OpenAiVisionStrategy } from "./strategies/openai-vision.strategy";
import { TesseractStrategy } from "./strategies/tesseract.strategy";
import type { OcrInput, OcrStrategy } from "./ocr.types";

class OcrService {
  private readonly strategies: OcrStrategy[];

  constructor() {
    const tesseract = new TesseractStrategy();

    if (env.OCR_PROVIDER === "openai") {
      this.strategies = [new OpenAiVisionStrategy(), tesseract];
      return;
    }

    if (env.OCR_PROVIDER === "google-vision") {
      this.strategies = [new GoogleVisionStrategy(), tesseract];
      return;
    }

    this.strategies = [tesseract];
  }

  async processInvoice(input: OcrInput) {
    const imageBuffer = Buffer.from(input.imageBase64, "base64");

    let lastError: unknown;
    let rawText = "";

    for (const strategy of this.strategies) {
      try {
        rawText = await strategy.extractText(imageBuffer);
        if (rawText.trim().length > 0) break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!rawText.trim()) {
      throw new Error(
        `No se pudo extraer texto del OCR. ${lastError instanceof Error ? lastError.message : ""}`.trim(),
      );
    }

    return parseFiscalInvoiceText(rawText);
  }
}

export const ocrService = new OcrService();
