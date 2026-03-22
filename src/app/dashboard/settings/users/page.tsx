import { UserRole } from "@/backend/shared/types";
import { connectToDatabase } from "@/backend/config/database";
import { userManagementService } from "@/backend/modules/auth/user-management.service";
import { UsersSettingsClient } from "@/components/settings/users-settings-client";
import { auth } from "@/lib/auth";

export default async function UsersSettingsPage() {
  await connectToDatabase();

  const session = await auth();
  const role = session?.user?.role;
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return <p className="text-sm text-muted-foreground">No autorizado.</p>;
  }

  if (role !== UserRole.ADMIN) {
    return <p className="text-sm text-muted-foreground">No tienes permisos para gestionar usuarios.</p>;
  }

  const users = await userManagementService.listUsers(tenantId);

  return (
    <UsersSettingsClient
      initialUsers={users.map((item) => ({
        _id: String(item._id),
        name: item.name,
        email: item.email,
        role: item.role,
        createdAt: new Date(item.createdAt).toISOString(),
      }))}
    />
  );
}
