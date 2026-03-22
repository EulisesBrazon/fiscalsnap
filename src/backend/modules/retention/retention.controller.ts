import { NextResponse } from "next/server";
import { z } from "zod";

import { isAppError } from "@/backend/shared/errors";

import { retentionService } from "./retention.service";

const createRetentionSchema = z.object({
  providerId: z.string().min(1),
  invoiceNumber: z.string().min(1).max(80),
  controlNumber: z.string().min(1).max(80),
  invoiceDate: z.string().date(),
  machineSerial: z.string().max(80).optional(),
  taxBase: z.number().positive(),
  taxRate: z.number().positive().max(100).optional(),
  retentionPercentage: z.union([z.literal(75), z.literal(100)]),
  ocrRawData: z.unknown().optional(),
});

const voidRetentionSchema = z.object({
  reason: z.string().trim().min(5).max(300),
});

export async function createRetentionController(tenantId: string, payload: unknown) {
  try {
    const input = createRetentionSchema.parse(payload);
    const retention = await retentionService.create({ ...input, tenantId });
    return NextResponse.json({ data: retention }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten().fieldErrors }, { status: 400 });
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function listRetentionsController(tenantId: string) {
  const retentions = await retentionService.list(tenantId);
  return NextResponse.json({ data: retentions });
}

export async function getRetentionByIdController(tenantId: string, id: string) {
  try {
    const retention = await retentionService.getById(tenantId, id);
    return NextResponse.json({ data: retention });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function voidRetentionController(tenantId: string, id: string, actorUserId: string, payload: unknown) {
  try {
    const input = voidRetentionSchema.parse(payload);
    const retention = await retentionService.void(tenantId, id, input.reason, actorUserId);
    return NextResponse.json({ data: retention });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten().fieldErrors }, { status: 400 });
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
