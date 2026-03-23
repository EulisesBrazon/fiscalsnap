import { NextResponse } from "next/server";
import { z } from "zod";

import { isSelfRegistrationEnabled } from "@/backend/config/env";
import { AppError, isAppError } from "@/backend/shared/errors";
import { emailSchema, rifSchema } from "@/backend/shared/validation";

import { authService } from "./auth.service";

const registerSchema = z.object({
  tenantName: z.string().min(3).max(120),
  tenantRif: rifSchema,
  fiscalAddress: z.string().min(6).max(250),
  name: z.string().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(100),
});

export async function registerAdminController(payload: unknown) {
  try {
    if (!isSelfRegistrationEnabled()) {
      throw new AppError("El registro de nuevas cuentas está deshabilitado por configuración.", 403);
    }

    const input = registerSchema.parse(payload);
    const result = await authService.registerAdmin(input);

    return NextResponse.json({ data: result }, { status: 201 });
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

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export function throwIfUnauthorized(tenantId?: string) {
  if (!tenantId) {
    throw new AppError("No autorizado", 401);
  }
}
