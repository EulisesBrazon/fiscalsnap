import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions, tenantRefField } from "@/backend/shared/base.model";

const retentionSchema = new Schema(
  {
    tenantId: tenantRefField,
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    voucherNumber: { type: String, required: true, trim: true },
    invoiceNumber: { type: String, required: true, trim: true },
    controlNumber: { type: String, required: true, trim: true },
    invoiceDate: { type: Date, required: true },
    machineSerial: { type: String, trim: true },
    taxBase: { type: Number, required: true },
    taxRate: { type: Number, required: true, default: 16 },
    ivaAmount: { type: Number, required: true },
    retentionPercentage: { type: Number, required: true, enum: [75, 100] },
    retentionAmount: { type: Number, required: true },
    status: { type: String, required: true, enum: ["draft", "issued", "voided"], default: "issued" },
    voidReason: { type: String, trim: true, maxlength: 300 },
    voidedAt: { type: Date },
    voidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    pdfFileName: { type: String, trim: true },
    ocrRawData: { type: Schema.Types.Mixed },
  },
  baseSchemaOptions,
);

retentionSchema.index({ tenantId: 1, voucherNumber: 1 }, { unique: true });
retentionSchema.index({ tenantId: 1, createdAt: -1 });
retentionSchema.index({ tenantId: 1, invoiceNumber: 1 });

export type RetentionDocument = InferSchemaType<typeof retentionSchema>;

export const RetentionModel = models.Retention ?? model("Retention", retentionSchema);
