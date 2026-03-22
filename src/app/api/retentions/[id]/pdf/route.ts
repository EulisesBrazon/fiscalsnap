import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { getRetentionPdfController } from "@/backend/modules/pdf/pdf.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR])) {
    return NextResponse.json({ message: "No tienes permisos para ver PDF" }, { status: 403 });
  }

  const { id } = await context.params;
  return getRetentionPdfController(tenantId, id);
}
