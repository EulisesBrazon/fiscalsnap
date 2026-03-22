import { NextResponse } from "next/server";
import { z } from "zod";

import { ocrService } from "@/backend/modules/ocr/ocr.service";

const ocrSchema = z.object({
  imageBase64: z.string().min(1),
});

export async function processOcrController(payload: unknown) {
  try {
    const input = ocrSchema.parse(payload);
    const result = await ocrService.processInvoice(input);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Error al procesar OCR",
      },
      { status: 500 },
    );
  }
}
