import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

import { AppError } from "@/backend/shared/errors";
import { TenantModel } from "@/backend/modules/tenant/tenant.model";
import { RetentionModel } from "@/backend/modules/retention/retention.model";

import { templateService } from "./template.service";

const pdfMakeClient = pdfMake as unknown as {
  vfs: Record<string, string>;
  fonts?: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  addFonts?: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void;
  createPdf: (definition: TDocumentDefinitions) => {
    getBuffer: () => Promise<Uint8Array>;
  };
};

const fontSource = pdfFonts as unknown as {
  [key: string]: string | undefined;
  vfs?: Record<string, string>;
  pdfMake?: { vfs: Record<string, string> };
};

const resolvedVfs =
  fontSource.pdfMake?.vfs ??
  fontSource.vfs ??
  Object.fromEntries(
    Object.entries(fontSource).filter(
      ([, value]) => typeof value === "string",
    ) as Array<[string, string]>,
  );

const robotoFontMap = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

if (typeof pdfMakeClient.addVirtualFileSystem === "function") {
  pdfMakeClient.addVirtualFileSystem(resolvedVfs);
} else {
  pdfMakeClient.vfs = resolvedVfs;
}

if (typeof pdfMakeClient.addFonts === "function") {
  pdfMakeClient.addFonts(robotoFontMap);
} else {
  pdfMakeClient.fonts = robotoFontMap;
}

function replaceVariables(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceVariables(entry, variables));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, replaceVariables(v, variables)]),
    );
  }

  return value;
}

class PdfService {
  private toCurrency(value: number): string {
    return value.toFixed(2);
  }

  private async toBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    const buffer = await pdfMakeClient.createPdf(docDefinition).getBuffer();
    return Buffer.from(buffer);
  }

  async generateRetentionPdf(tenantId: string, retentionId: string) {
    const retention = await RetentionModel.findOne({ _id: retentionId, tenantId }).populate("providerId");
    if (!retention) {
      throw new AppError("Comprobante no encontrado", 404);
    }

    const tenant = await TenantModel.findOne({ _id: tenantId, isActive: true });
    if (!tenant) {
      throw new AppError("Empresa no encontrada", 404);
    }

    const template = await templateService.getDefaultTemplate(tenantId);

    const provider = retention.providerId as {
      name?: string;
      rif?: string;
    };

    const values: Record<string, string> = {
      agentName: tenant.name,
      agentRif: tenant.rif,
      agentAddress: tenant.fiscalAddress,
      providerName: provider?.name ?? "",
      providerRif: provider?.rif ?? "",
      voucherNumber: retention.voucherNumber,
      invoiceNumber: retention.invoiceNumber,
      controlNumber: retention.controlNumber,
      invoiceDate: retention.invoiceDate.toISOString().slice(0, 10),
      taxBase: this.toCurrency(retention.taxBase),
      taxRate: this.toCurrency(retention.taxRate),
      ivaAmount: this.toCurrency(retention.ivaAmount),
      retentionPercentage: String(retention.retentionPercentage),
      retentionAmount: this.toCurrency(retention.retentionAmount),
      signatureImage: tenant.signature?.image ?? "",
      stampImage: tenant.stamp?.image ?? "",
      issueDate: new Date().toISOString().slice(0, 10),
    };

    const definition = replaceVariables(template.definition, values) as TDocumentDefinitions;
    definition.defaultStyle = {
      ...(definition.defaultStyle ?? {}),
      font: "Roboto",
    };

    const pdfBuffer = await this.toBuffer(definition);

    return {
      buffer: pdfBuffer,
      fileName: `comprobante-${retention.voucherNumber}.pdf`,
      retention,
    };
  }

  async generateTemplatePreview(tenantId: string, templateId: string) {
    const template = await templateService.getById(tenantId, templateId);

    const mockValues: Record<string, string> = {
      agentName: "SERVIAUTOS BAEZ, C.A.",
      agentRif: "J-50578995-3",
      agentAddress: "Av. Principal, Caracas",
      providerName: "MULTI MANGUERAS, C.A.",
      providerRif: "J-12345678-9",
      voucherNumber: "202603000123",
      invoiceNumber: "F0003456",
      controlNumber: "MH-987654",
      invoiceDate: "2026-03-21",
      taxBase: "1500.00",
      taxRate: "16.00",
      ivaAmount: "240.00",
      retentionPercentage: "75",
      retentionAmount: "180.00",
      signatureImage: "",
      stampImage: "",
      issueDate: "2026-03-21",
    };

    const definition = replaceVariables(template.definition, mockValues) as TDocumentDefinitions;
    definition.defaultStyle = {
      ...(definition.defaultStyle ?? {}),
      font: "Roboto",
    };

    const buffer = await this.toBuffer(definition);

    return {
      buffer,
      fileName: `preview-${String(template._id)}.pdf`,
    };
  }
}

export const pdfService = new PdfService();
