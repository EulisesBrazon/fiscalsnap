import { connectToDatabase } from "@/backend/config/database";
import { templateService } from "@/backend/modules/pdf/template.service";
import { UserRole } from "@/backend/shared/types";
import { TemplateEditorClient } from "@/components/pdf/template-editor-client";
import { auth } from "@/lib/auth";

export default async function TemplatesPage() {
  await connectToDatabase();

  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const role = session?.user?.role;

  if (!tenantId) {
    return <p className="text-sm text-muted-foreground">No autorizado.</p>;
  }

  if (role !== UserRole.ADMIN) {
    return <p className="text-sm text-muted-foreground">No tienes permisos para gestionar templates.</p>;
  }

  const existing = await templateService.list(tenantId);
  if (existing.length === 0) {
    await templateService.getDefaultTemplate(tenantId);
  }

  const templates = await templateService.list(tenantId);

  return (
    <TemplateEditorClient
      templates={templates.map((item) => ({
        _id: String(item._id),
        name: item.name,
        description: item.description,
        definition: item.definition as Record<string, unknown>,
        variables: item.variables.map((variable: { key: string; label: string; source: string }) => ({
          key: variable.key,
          label: variable.label,
          source: variable.source,
        })),
        version: item.version,
        isDefault: item.isDefault,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString(),
        createdBy: item.createdBy
          ? {
              name: (item.createdBy as { name?: string }).name ?? "-",
              email: (item.createdBy as { email?: string }).email ?? "-",
            }
          : undefined,
        updatedBy: item.updatedBy
          ? {
              name: (item.updatedBy as { name?: string }).name ?? "-",
              email: (item.updatedBy as { email?: string }).email ?? "-",
            }
          : undefined,
      }))}
    />
  );
}
