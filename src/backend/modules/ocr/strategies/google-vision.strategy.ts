import type { OcrStrategy } from "@/backend/modules/ocr/ocr.types";

export class GoogleVisionStrategy implements OcrStrategy {
  async extractText(): Promise<string> {
    throw new Error("Google Vision strategy is not implemented yet");
  }
}
