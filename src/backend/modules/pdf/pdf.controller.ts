import { isAppError } from "@/backend/shared/errors";

import { pdfService } from "./pdf.service";

export async function getRetentionPdfController(tenantId: string, retentionId: string) {
  try {
    const result = await pdfService.generateRetentionPdf(tenantId, retentionId);
    const body = new Uint8Array(result.buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${result.fileName}\"`,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return Response.json({ message: error.message }, { status: error.statusCode });
    }

    return Response.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function getTemplatePreviewPdfController(tenantId: string, templateId: string) {
  try {
    const result = await pdfService.generateTemplatePreview(tenantId, templateId);
    const body = new Uint8Array(result.buffer);

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${result.fileName}\"`,
      },
    });
  } catch (error) {
    if (isAppError(error)) {
      return Response.json({ message: error.message }, { status: error.statusCode });
    }

    return Response.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
