import type { OcrStrategy } from "@/backend/modules/ocr/ocr.types";

export class OpenAiVisionStrategy implements OcrStrategy {
  async extractText(): Promise<string> {
    throw new Error("OpenAI Vision strategy is not implemented yet");
  }
}
