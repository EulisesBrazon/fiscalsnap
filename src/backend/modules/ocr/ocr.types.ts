export interface OcrExtractionResult {
  rawText: string;
  providerRif?: string;
  providerName?: string;
  invoiceNumber?: string;
  controlNumber?: string;
  machineSerial?: string;
  invoiceDate?: string;
  taxBase?: number;
  ivaAmount?: number;
}

export interface OcrInput {
  imageBase64: string;
}

export interface OcrStrategy {
  extractText(imageBuffer: Buffer): Promise<string>;
}
