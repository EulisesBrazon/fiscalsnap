import { UserRole } from "@/backend/shared/types";
import { auth } from "@/lib/auth";

export async function getTenantSession() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return { session: null, tenantId: null, role: null };
  }

  return {
    session,
    tenantId,
    role: session.user.role,
  };
}

export function hasRequiredRole(role: UserRole | null, allowedRoles: UserRole[]) {
  if (!role) return false;
  return allowedRoles.includes(role);
}
