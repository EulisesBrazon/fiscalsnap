import type { PdfTemplateDefinition } from "./pdf.types";

export const defaultRetentionTemplate: PdfTemplateDefinition = {
  name: "Comprobante Retención IVA",
  description: "Template base editable para comprobantes de retención",
  definition: {
    pageSize: "LETTER",
    content: [
      { text: "COMPROBANTE DE RETENCION DE IVA", style: "header" },
      { text: "Agente: {{agentName}}" },
      { text: "RIF: {{agentRif}}" },
      { text: "Comprobante: {{voucherNumber}}" },
      { text: "Factura: {{invoiceNumber}}" },
      { text: "Control: {{controlNumber}}" },
      { text: "Monto retenido: {{retentionAmount}}" },
    ],
    styles: {
      header: { bold: true, fontSize: 14, alignment: "center" },
    },
  },
  variables: [
    { key: "agentName", label: "Nombre del Agente", source: "tenant.name" },
    { key: "agentRif", label: "RIF del Agente", source: "tenant.rif" },
    { key: "voucherNumber", label: "Nro. Comprobante", source: "retention.voucherNumber" },
    { key: "invoiceNumber", label: "Nro. Factura", source: "retention.invoiceNumber" },
    { key: "controlNumber", label: "Nro. Control", source: "retention.controlNumber" },
    { key: "retentionAmount", label: "Monto Retenido", source: "retention.retentionAmount" },
  ],
};
