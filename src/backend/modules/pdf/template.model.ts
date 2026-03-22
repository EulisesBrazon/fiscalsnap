import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions, tenantRefField } from "@/backend/shared/base.model";

const templateSchema = new Schema(
  {
    tenantId: tenantRefField,
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    definition: { type: Schema.Types.Mixed, required: true },
    variables: [
      {
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        source: { type: String, required: true, trim: true },
      },
    ],
    version: { type: Number, default: 1 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  baseSchemaOptions,
);

templateSchema.index({ tenantId: 1, name: 1 });
templateSchema.index({ tenantId: 1, isDefault: 1 });

export type PdfTemplateDocument = InferSchemaType<typeof templateSchema>;

export const PdfTemplateModel = models.PdfTemplate ?? model("PdfTemplate", templateSchema);
