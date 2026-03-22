import { UserRole } from "@/backend/shared/types";
import { CompanySettingsClient } from "@/components/settings/company-settings-client";
import { auth } from "@/lib/auth";

export default async function CompanySettingsPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user?.tenantId) {
    return <p className="text-sm text-muted-foreground">No autorizado.</p>;
  }

  return <CompanySettingsClient canEdit={role === UserRole.ADMIN} />;
}
