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

export const exclusiveLandscapeRetentionTemplate: PdfTemplateDefinition = {
  name: "Comprobante Retención IVA",
  description: "Template horizontal fiscal — Comprobante de Retención IVA (SENIAT)",
  definition: {
    info: { subject: "fiscalsnap-seed-v46" },
    pageSize: "LETTER",
    pageOrientation: "landscape",
    pageMargins: [28, 30, 28, 20],
    content: [
      { text: "Comprobante de Retención IVA", style: "title", margin: [0, 0, 0, 4] },
      {
        columns: [
          {
            width: "*",
            text: 'Ley IVA Art. 11 "Serán responsables del pago del impuesto en calidad de agentes de retención, los compradores o adquirentes de determinados bienes muebles y los receptores de ciertos servicios, a quienes la Administración Tributaria designe como tal"',
            style: "law",
          },
          {
            width: 210,
            table: {
              widths: ["*", "*"],
              body: [
                [
                  { text: "Nro. Comprobante:", style: "label", border: [true, true, true, true] },
                  { text: "Fecha:", style: "label", border: [true, true, true, true] },
                ],
                [
                  { text: "{{voucherNumber}}", style: "value", border: [true, true, true, false] },
                  { text: "{{issueDateDisplay}}", style: "value", alignment: "right", border: [true, true, true, false] },
                ],
              ],
            },
          },
        ],
        columnGap: 8,
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: ["*", "*", 80],
          body: [
            [
              {
                stack: [
                  { text: "Nombre o Razón Social del Agente de Retención:", style: "label" },
                  { text: "{{agentName}}", style: "value" },
                ],
              },
              {
                stack: [
                  { text: "Registro de Información Fiscal del Agente de Retención:", style: "label" },
                  { text: "{{agentRif}}", style: "value" },
                ],
              },
              {
                stack: [
                  { text: "Periodo Fiscal:", style: "label" },
                  { text: "{{fiscalPeriod}}", style: "value" },
                ],
              },
            ],
            [
              {
                colSpan: 3,
                stack: [
                  { text: "Dirección Fiscal del Agente de Retención:", style: "label" },
                  { text: "\t\t{{agentAddress}}", style: "value", margin: [0, 1, 0, 4] },
                ],
              },
              {},
              {},
            ],
          ],
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: ["*", 310],
          body: [
            [
              {
                stack: [
                  { text: "Nombre o Razón Social del Agente Retenido:", style: "label" },
                  { text: "{{providerName}}", style: "value" },
                ],
                border: [true, false, true, true],
              },
              {
                stack: [
                  { text: "Registro de Información Fiscal del Sujeto Retenido (RIF):", style: "label" },
                  { text: "{{providerRif}}", style: "value" },
                ],
                border: [true, false, true, true],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          headerRows: 1,
          widths: [54, 50, 54, 38, 30, 35, 51, 51, 55, 49, 27, 35, 47, 47],
          body: [
            [
              { text: "Fecha del\nDocumento", style: "tableHeader" },
              { text: "Nro.\nFactura", style: "tableHeader" },
              { text: "Nro. Control", style: "tableHeader" },
              { text: "Nro. Nota\nDébito", style: "tableHeader" },
              { text: "Nro.\nNota", style: "tableHeader" },
              { text: "Tipo de\nTrans.", style: "tableHeader" },
              { text: "Nro. Factura\nAfectada", style: "tableHeader" },
              { text: "Total Compras\ncon IVA", style: "tableHeader" },
              { text: "Total Compras\nsin derecho a\ncrédito IVA", style: "tableHeader" },
              { text: "Base\nImponible", style: "tableHeader" },
              { text: "%\nIVA", style: "tableHeader" },
              { text: "%\nRetención", style: "tableHeader" },
              { text: "Impuesto\nIVA", style: "tableHeader" },
              { text: "IVA\nRetenido", style: "tableHeader" },
            ],
            [
              { text: "{{invoiceDateDisplay}}", style: "tableValue", alignment: "center" },
              { text: "{{invoiceNumber}}", style: "tableValue", alignment: "center" },
              { text: "{{controlNumber}}", style: "tableValue", alignment: "center" },
              { text: "{{debitNoteNumber}}", style: "tableValue", alignment: "center" },
              { text: "{{creditNoteNumber}}", style: "tableValue", alignment: "center" },
              { text: "{{transactionType}}", style: "tableValue", alignment: "center" },
              { text: "{{affectedInvoiceNumber}}", style: "tableValue", alignment: "center" },
              { text: "{{totalPurchases}}", style: "tableValue", alignment: "center" },
              { text: "{{totalPurchasesNoCredit}}", style: "tableValue", alignment: "center" },
              { text: "{{taxBase}}", style: "tableValue", alignment: "center" },
              { text: "{{taxRate}}", style: "tableValue", alignment: "center" },
              { text: "{{retentionPercentage}}", style: "tableValue", alignment: "center" },
              { text: "{{ivaAmount}}", style: "tableValue", alignment: "center" },
              { text: "{{retentionAmount}}", style: "tableValue", alignment: "center" },
            ],
            [
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
              { text: "", border: [false, false, false, false], margin: [0, 3, 0, 3] },
            ],
          ],
        },
        layout: {
          // Keep only outer vertical lines in the main table.
          vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 0.5 : 0),
          hLineWidth: () => 0.5,
        },
        margin: [0, 0, 0, 0],
      },
      {
        table: {
          widths: [53, 49, 53, 37, 29, 34, 50, 50, 54, 48, 26, 34, 46, 46],
          body: [
            [
              { text: "", border: [false, false, false, false] },
              { text: "", border: [false, false, false, false] },
              { text: "", border: [false, false, false, false] },
              { text: "", border: [false, false, false, false] },
              { text: "", border: [false, false, false, false] },
              { text: "Total General:", style: "label", alignment: "left", noWrap: true, colSpan: 2, margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [true, true, false, true] },
              {},
              { text: "{{totalPurchases}}", style: "tableValue", alignment: "right", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "", style: "tableValue", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "{{taxBase}}", style: "tableValue", alignment: "right", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "", style: "tableValue", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "", style: "tableValue", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "{{ivaAmount}}", style: "tableValue", alignment: "right", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, false, true] },
              { text: "{{retentionAmount}}", style: "tableValue", alignment: "right", margin: [0, 2, 0, 2], fillColor: "#c8c8c8", border: [false, true, true, true] },
            ],
          ],
        },
        margin: [0, 2, 0, 0],
      },
      {
        table: {
          widths: ["33%", "34%", "33%"],
          body: [
            [
              { text: "", margin: [0, 90, 0, 0], border: [false, false, false, false] },
              { text: "", margin: [0, 90, 0, 0], border: [false, false, false, false] },
              {
                stack: [{ image: "{{stampImage}}", fit: [160, 110], alignment: "center", _removable: true }],
                margin: [0, 0, 0, 0],
                border: [false, false, false, false],
              },
            ],
            [
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }],
                border: [false, false, false, false],
              },
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }],
                border: [false, false, false, false],
              },
              {
                canvas: [{ type: "line", x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }],
                border: [false, false, false, false],
              },
            ],
            [
              { text: "Fecha de Entrega", style: "signatureLabel", border: [false, false, false, false] },
              { text: "Firma del Beneficiario", style: "signatureLabel", border: [false, false, false, false] },
              { text: "Agente de Retención (Sello y Firma)", style: "signatureLabel", border: [false, false, false, false] },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 8, 0, 0],
      },
      {
        text: 'ESTE COMPROBANTE SE EMITE SEGÚN LO ESTABLECIDO EN EL ARTICULO N°16 DE LA PROVIDENCIA ADMINISTRATIVA SNAT/2025/000054 DE FECHA 16/07/2025, PUBLICADA EN GACETA OFICIAL N° 43.171.',
        style: "footer",
        margin: [0, 16, 0, 0],
      },
    ],
    styles: {
      title: { bold: true, fontSize: 13, alignment: "center" },
      law: { fontSize: 7, bold: true },
      label: { fontSize: 7.5, bold: true },
      value: { fontSize: 8.5 },
      tableHeader: { fontSize: 6.5, bold: true, alignment: "center", fillColor: "#c8c8c8" },
      tableValue: { fontSize: 7.5 },
      signatureLabel: { fontSize: 7.5, alignment: "center", margin: [0, 4, 0, 0] },
      footer: { fontSize: 7, bold: true, alignment: "center" },
    },
  },
  variables: [
    { key: "agentName", label: "Nombre del Agente", source: "tenant.name" },
    { key: "agentRif", label: "RIF del Agente", source: "tenant.rif" },
    { key: "agentAddress", label: "Dirección Fiscal del Agente", source: "tenant.fiscalAddress" },
    { key: "providerName", label: "Nombre del Proveedor", source: "provider.name" },
    { key: "providerRif", label: "RIF del Proveedor", source: "provider.rif" },
    { key: "voucherNumber", label: "Nro. Comprobante", source: "retention.voucherNumber" },
    { key: "invoiceNumber", label: "Nro. Factura", source: "retention.invoiceNumber" },
    { key: "controlNumber", label: "Nro. Control", source: "retention.controlNumber" },
    { key: "issueDateDisplay", label: "Fecha de Emisión", source: "system.issueDateDisplay" },
    { key: "invoiceDateDisplay", label: "Fecha Factura", source: "retention.invoiceDate" },
    { key: "fiscalPeriod", label: "Periodo Fiscal", source: "retention.fiscalPeriod" },
    { key: "debitNoteNumber", label: "Nro. Nota Débito", source: "retention.debitNoteNumber" },
    { key: "creditNoteNumber", label: "Nro. Nota Crédito", source: "retention.creditNoteNumber" },
    { key: "affectedInvoiceNumber", label: "Nro. Factura Afectada", source: "retention.affectedInvoiceNumber" },
    { key: "transactionType", label: "Tipo de Transacción", source: "retention.transactionType" },
    { key: "totalPurchases", label: "Total Compras con IVA", source: "retention.totalPurchases" },
    {
      key: "totalPurchasesNoCredit",
      label: "Total Compras sin derecho a crédito IVA",
      source: "retention.totalPurchasesNoCredit",
    },
    { key: "taxBase", label: "Base Imponible", source: "retention.taxBase" },
    { key: "taxRate", label: "% IVA", source: "retention.taxRate" },
    { key: "retentionPercentage", label: "% Retención", source: "retention.retentionPercentage" },
    { key: "ivaAmount", label: "Impuesto IVA", source: "retention.ivaAmount" },
    { key: "retentionAmount", label: "Monto Retenido", source: "retention.retentionAmount" },
    { key: "stampImage", label: "Sello y Firma", source: "tenant.stamp.image" },
  ],
};
