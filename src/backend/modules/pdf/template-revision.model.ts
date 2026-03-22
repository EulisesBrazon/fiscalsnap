import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions, tenantRefField } from "@/backend/shared/base.model";

const templateRevisionSchema = new Schema(
  {
    tenantId: tenantRefField,
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "PdfTemplate",
      required: true,
      index: true,
    },
    version: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    definition: { type: Schema.Types.Mixed, required: true },
    variables: [
      {
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        source: { type: String, required: true, trim: true },
      },
    ],
    changeType: {
      type: String,
      required: true,
      enum: ["created", "updated", "duplicated", "set-default", "rolled-back", "deleted"],
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
  },
  baseSchemaOptions,
);

templateRevisionSchema.index({ tenantId: 1, templateId: 1, version: -1 });
templateRevisionSchema.index({ tenantId: 1, templateId: 1, createdAt: -1 });

export type TemplateRevisionDocument = InferSchemaType<typeof templateRevisionSchema>;

export const TemplateRevisionModel = models.TemplateRevision ?? model("TemplateRevision", templateRevisionSchema);