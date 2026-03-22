import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { createRetentionController, listRetentionsController } from "@/backend/modules/retention/retention.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET() {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para ver retenciones" }, { status: 403 });
  }

  return listRetentionsController(tenantId);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para emitir retenciones" }, { status: 403 });
  }

  const body = await request.json();
  return createRetentionController(tenantId, body);
}
