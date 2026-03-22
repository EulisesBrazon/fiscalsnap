import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { createTemplateController, listTemplatesController } from "@/backend/modules/pdf/template.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET() {
  await connectToDatabase();

  const { tenantId } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  return listTemplatesController(tenantId);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para crear templates" }, { status: 403 });
  }

  const body = await request.json();
  return createTemplateController(tenantId, session.user.id, body);
}
