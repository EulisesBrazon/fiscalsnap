import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { getRetentionByIdController, voidRetentionController } from "@/backend/modules/retention/retention.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para ver comprobantes" }, { status: 403 });
  }

  const { id } = await context.params;
  return getRetentionByIdController(tenantId, id);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR])) {
    return NextResponse.json({ message: "No tienes permisos para anular comprobantes" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();

  return voidRetentionController(tenantId, id, session.user.id, body);
}
