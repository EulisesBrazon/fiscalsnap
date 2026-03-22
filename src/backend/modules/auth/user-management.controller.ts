import { NextResponse } from "next/server";
import { z } from "zod";

import { isAppError } from "@/backend/shared/errors";
import { UserRole } from "@/backend/shared/types";
import { emailSchema } from "@/backend/shared/validation";

import { userManagementService } from "./user-management.service";

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(100),
  role: z.nativeEnum(UserRole),
});

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export async function listUsersController(tenantId: string) {
  const users = await userManagementService.listUsers(tenantId);
  return NextResponse.json({ data: users });
}

export async function createUserController(tenantId: string, payload: unknown) {
  try {
    const input = createUserSchema.parse(payload);
    const user = await userManagementService.createUser({ ...input, tenantId });
    return NextResponse.json({ data: user }, { status: 201 });
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

export async function updateUserRoleController(tenantId: string, actorUserId: string, payload: unknown) {
  try {
    const input = updateRoleSchema.parse(payload);
    const user = await userManagementService.updateUserRole({ ...input, tenantId, actorUserId });
    return NextResponse.json({ data: user });
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

export async function deactivateUserController(tenantId: string, actorUserId: string, payload: unknown) {
  try {
    const input = z.object({ userId: z.string().min(1) }).parse(payload);
    const user = await userManagementService.deactivateUser({ ...input, tenantId, actorUserId });
    return NextResponse.json({ data: user });
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
