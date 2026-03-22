import { NextResponse } from "next/server";
import { z } from "zod";

import { isAppError } from "@/backend/shared/errors";
import { emailSchema, rifSchema } from "@/backend/shared/validation";

import { providerService } from "./provider.service";

const createProviderSchema = z.object({
  rif: rifSchema,
  name: z.string().min(2).max(140),
  address: z.string().max(220).optional(),
  phone: z.string().max(40).optional(),
  email: emailSchema.optional(),
});

const updateProviderSchema = z.object({
  name: z.string().min(2).max(140).optional(),
  address: z.string().max(220).optional(),
  phone: z.string().max(40).optional(),
  email: emailSchema.optional(),
});

export async function createProviderController(tenantId: string, payload: unknown) {
  try {
    const input = createProviderSchema.parse(payload);
    const provider = await providerService.create({ ...input, tenantId });
    return NextResponse.json({ data: provider }, { status: 201 });
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

export async function listProvidersController(tenantId: string) {
  const providers = await providerService.list(tenantId);
  return NextResponse.json({ data: providers });
}

export async function updateProviderController(tenantId: string, providerId: string, payload: unknown) {
  try {
    const input = updateProviderSchema.parse(payload);
    const provider = await providerService.update(tenantId, providerId, input);
    return NextResponse.json({ data: provider });
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
