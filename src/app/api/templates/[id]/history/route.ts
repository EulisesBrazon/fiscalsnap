import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { listTemplateHistoryController } from "@/backend/modules/pdf/template.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para consultar historial de templates" }, { status: 403 });
  }

  const { id } = await context.params;
  return listTemplateHistoryController(tenantId, id);
}
