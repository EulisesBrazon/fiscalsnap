import Tesseract from "tesseract.js";

import type { OcrStrategy } from "@/backend/modules/ocr/ocr.types";

export class TesseractStrategy implements OcrStrategy {
  async extractText(imageBuffer: Buffer): Promise<string> {
    const { data } = await Tesseract.recognize(imageBuffer, "spa");
    return data.text;
  }
}
