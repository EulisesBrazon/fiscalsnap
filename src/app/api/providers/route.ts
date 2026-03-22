import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { createProviderController, listProvidersController } from "@/backend/modules/provider/provider.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET() {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para consultar proveedores" }, { status: 403 });
  }

  return listProvidersController(tenantId);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para crear proveedores" }, { status: 403 });
  }

  const body = await request.json();
  return createProviderController(tenantId, body);
}
