import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/backend/config/database";
import { uploadPngDataUriToCloudinary } from "@/backend/modules/tenant/cloudinary";
import { buildSignedTenantAssetUrl } from "@/backend/modules/tenant/cloudinary";
import { tenantService } from "@/backend/modules/tenant/tenant.service";
import { isAppError } from "@/backend/shared/errors";
import { UserRole } from "@/backend/shared/types";
import { getTenantSession, hasRequiredRole } from "@/lib/authz";

const updateCompanySchema = z.object({
  name: z.string().min(3).max(120).optional(),
  fiscalAddress: z.string().min(6).max(250).optional(),
  signature: z
    .union([
      z.object({
        image: z.string().min(1),
        type: z.enum(["upload", "canvas"]),
      }),
      z.null(),
    ])
    .optional(),
  stamp: z
    .union([
      z.object({
        image: z.string().min(1),
      }),
      z.null(),
    ])
    .optional(),
  uiTheme: z
    .object({
      mode: z.enum(["light", "dark"]),
      colors: z.object({
        primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        neutral: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
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
    const tenantData = tenant.toObject();

    if (tenantData.signature?.image) {
      tenantData.signature.image = buildSignedTenantAssetUrl(tenantData.signature.image);
    }

    if (tenantData.stamp?.image) {
      tenantData.stamp.image = buildSignedTenantAssetUrl(tenantData.stamp.image);
    }

    return NextResponse.json({ data: tenantData });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ message }, { status: 500 });
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
    const currentTenant = await tenantService.getById(tenantId);

    if (input.signature && input.signature.image.startsWith("data:image/png;base64,")) {
      const uploaded = await uploadPngDataUriToCloudinary({
        dataUri: input.signature.image,
        tenantId,
        assetKind: "signature",
      });

      input.signature.image = uploaded.publicId;
    } else if (input.signature && /^https?:\/\//i.test(input.signature.image)) {
      if (currentTenant.signature?.image) {
        input.signature.image = currentTenant.signature.image;
      } else {
        input.signature = undefined;
      }
    }

    if (input.stamp && input.stamp.image.startsWith("data:image/png;base64,")) {
      const uploaded = await uploadPngDataUriToCloudinary({
        dataUri: input.stamp.image,
        tenantId,
        assetKind: "stamp",
      });

      input.stamp.image = uploaded.publicId;
    } else if (input.stamp && /^https?:\/\//i.test(input.stamp.image)) {
      if (currentTenant.stamp?.image) {
        input.stamp.image = currentTenant.stamp.image;
      } else {
        input.stamp = undefined;
      }
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

    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
