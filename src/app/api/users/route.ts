import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import {
  createUserController,
  deactivateUserController,
  listUsersController,
  updateUserRoleController,
} from "@/backend/modules/auth/user-management.controller";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

export async function GET() {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para ver usuarios" }, { status: 403 });
  }

  return listUsersController(tenantId);
}

export async function POST(request: Request) {
  await connectToDatabase();

  const { tenantId, role } = await getTenantSession();

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para crear usuarios" }, { status: 403 });
  }

  const body = await request.json();
  return createUserController(tenantId, body);
}

export async function PATCH(request: Request) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para actualizar usuarios" }, { status: 403 });
  }

  const body = await request.json();
  return updateUserRoleController(tenantId, session.user.id, body);
}

export async function DELETE(request: Request) {
  await connectToDatabase();

  const { tenantId, role, session } = await getTenantSession();

  if (!tenantId || !session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (!hasRequiredRole(role, [UserRole.ADMIN])) {
    return NextResponse.json({ message: "No tienes permisos para desactivar usuarios" }, { status: 403 });
  }

  const body = await request.json();
  return deactivateUserController(tenantId, session.user.id, body);
}
