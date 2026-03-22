import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { getTemplateHistoryByIdController } from "@/backend/modules/pdf/template.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string; revisionId: string }> },
) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para consultar revisiones" }, { status: 403 });
  }

  const { id, revisionId } = await context.params;
  return getTemplateHistoryByIdController(tenantId, id, revisionId);
}
