import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { uploadPngToCloudinary } from "@/backend/modules/tenant/cloudinary";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const { tenantId, role } = await getTenantSession();

    if (!tenantId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (!hasRequiredRole(role, [UserRole.ADMIN])) {
      return NextResponse.json({ message: "No tienes permisos para subir imágenes" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const assetKindRaw = String(formData.get("assetKind") ?? "signature");
    const assetKind = assetKindRaw === "stamp" ? "stamp" : "signature";

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Debes enviar un archivo PNG" }, { status: 400 });
    }

    if (file.type !== "image/png") {
      return NextResponse.json({ message: "Solo se permiten imágenes PNG" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ message: "El archivo excede el tamaño máximo de 2MB" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    const uploaded = await uploadPngToCloudinary({
      bytes,
      tenantId,
      assetKind,
    });

    return NextResponse.json({
      data: {
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
