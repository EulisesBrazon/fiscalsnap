import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import {
  deleteTemplateController,
  duplicateTemplateController,
  getTemplateByIdController,
  rollbackTemplateController,
  setDefaultTemplateController,
  updateTemplateController,
} from "@/backend/modules/pdf/template.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  return getTemplateByIdController(tenantId, id);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para editar templates" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  return updateTemplateController(tenantId, session.user.id, id, body);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para administrar templates" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };

  if (body.action === "duplicate") {
    return duplicateTemplateController(tenantId, session.user.id, id);
  }

  if (body.action === "set-default") {
    return setDefaultTemplateController(tenantId, session.user.id, id);
  }

  if (body.action === "rollback") {
    return rollbackTemplateController(tenantId, session.user.id, id, body);
  }

  return NextResponse.json({ message: "Acción inválida" }, { status: 400 });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para eliminar templates" }, { status: 403 });
  }

  const { id } = await context.params;
  return deleteTemplateController(tenantId, session.user.id, id);
}
