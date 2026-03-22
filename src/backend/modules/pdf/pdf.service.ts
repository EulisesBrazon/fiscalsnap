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
    return value
      .map((entry) => replaceVariables(entry, variables))
      .filter((entry) => {
        if (entry && typeof entry === "object" && "image" in entry) {
          const node = entry as Record<string, unknown>;
          if (!node.image && node._removable) return false;
        }
        return true;
      });
  }

  if (value && typeof value === "object") {
    const result = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, replaceVariables(v, variables)]),
    );
    delete result._removable;
    return result;
  }

  return value;
}

class PdfService {
  private toCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private toPercent(value: number): string {
    return value.toFixed(2);
  }

  private toDateDisplay(value: Date): string {
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private toFiscalPeriod(value: Date): string {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    return `${value.getFullYear()}-${month}`;
  }

  private async toPdfImageSource(value?: string): Promise<string> {
    if (!value) return "";
    if (value.startsWith("data:image/")) return value;
    if (!/^https?:\/\//i.test(value)) return value;

    try {
      const response = await fetch(value);
      if (!response.ok) return "";

      const contentType = response.headers.get("content-type") ?? "image/png";
      const bytes = new Uint8Array(await response.arrayBuffer());
      const base64 = Buffer.from(bytes).toString("base64");
      return `data:${contentType};base64,${base64}`;
    } catch {
      return "";
    }
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

    const issueDate = new Date();
    const totalPurchases = retention.taxBase + retention.ivaAmount;
    const signatureImage = await this.toPdfImageSource(tenant.signature?.image ?? "");
    const stampImage = await this.toPdfImageSource(tenant.stamp?.image ?? "");

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
      invoiceDateDisplay: this.toDateDisplay(retention.invoiceDate),
      taxBase: this.toCurrency(retention.taxBase),
      taxRate: this.toPercent(retention.taxRate),
      ivaAmount: this.toCurrency(retention.ivaAmount),
      retentionPercentage: String(retention.retentionPercentage),
      retentionAmount: this.toCurrency(retention.retentionAmount),
      totalPurchases: this.toCurrency(totalPurchases),
      totalPurchasesNoCredit: "0.00",
      debitNoteNumber: "",
      creditNoteNumber: "",
      affectedInvoiceNumber: "",
      transactionType: "01-Reg",
      fiscalPeriod: this.toFiscalPeriod(retention.invoiceDate),
      signatureImage,
      stampImage,
      issueDate: issueDate.toISOString().slice(0, 10),
      issueDateDisplay: this.toDateDisplay(issueDate),
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
      invoiceDateDisplay: "21/03/2026",
      taxBase: "1500.00",
      taxRate: "16.00",
      ivaAmount: "240.00",
      retentionPercentage: "75",
      retentionAmount: "180.00",
      totalPurchases: "1740.00",
      totalPurchasesNoCredit: "0.00",
      debitNoteNumber: "",
      creditNoteNumber: "",
      affectedInvoiceNumber: "",
      transactionType: "01-Reg",
      fiscalPeriod: "2026-03",
      signatureImage: "",
      stampImage: "",
      issueDate: "2026-03-21",
      issueDateDisplay: "21/03/2026",
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
