import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/backend/config/database";
import { uploadPngDataUriToCloudinary } from "@/backend/modules/tenant/cloudinary";
import { tenantService } from "@/backend/modules/tenant/tenant.service";
import { isAppError } from "@/backend/shared/errors";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

const updateCompanySchema = z.object({
  name: z.string().min(3).max(120).optional(),
  fiscalAddress: z.string().min(6).max(250).optional(),
  signature: z
    .object({
      image: z.string().min(1),
      type: z.enum(["upload", "canvas"]),
    })
    .optional(),
  stamp: z
    .object({
      image: z.string().min(1),
    })
    .optional(),
});

export async function GET() {
  try {
    await connectToDatabase();

    const { tenantId } = await getTenantSession();

    if (!tenantId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const tenant = await tenantService.getById(tenantId);
    return NextResponse.json({ data: tenant });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    const { tenantId, role } = await getTenantSession();

    if (!tenantId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    if (!hasRequiredRole(role, [UserRole.ADMIN])) {
      return NextResponse.json({ message: "No tienes permisos para modificar la empresa" }, { status: 403 });
    }

    const body = await request.json();
    const input = updateCompanySchema.parse(body);

    if (input.signature?.image?.startsWith("data:image/png;base64,")) {
      const uploaded = await uploadPngDataUriToCloudinary({
        dataUri: input.signature.image,
        tenantId,
        assetKind: "signature",
      });

      input.signature.image = uploaded.secureUrl;
    }

    if (input.stamp?.image?.startsWith("data:image/png;base64,")) {
      const uploaded = await uploadPngDataUriToCloudinary({
        dataUri: input.stamp.image,
        tenantId,
        assetKind: "stamp",
      });

      input.stamp.image = uploaded.secureUrl;
    }

    const tenant = await tenantService.updateById(tenantId, input);
    return NextResponse.json({ data: tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Datos inválidos",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
