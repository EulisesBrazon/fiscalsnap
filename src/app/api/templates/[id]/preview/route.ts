import { NextResponse } from "next/server";

import { connectToDatabase } from "@/backend/config/database";
import { getTemplatePreviewPdfController } from "@/backend/modules/pdf/pdf.controller";
import { auth } from "@/lib/auth";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectToDatabase();

  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  return getTemplatePreviewPdfController(tenantId, id);
}
