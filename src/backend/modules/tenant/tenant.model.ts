import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions } from "@/backend/shared/base.model";

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    rif: { type: String, required: true, trim: true, uppercase: true },
    fiscalAddress: { type: String, required: true, trim: true },
    signature: {
      image: { type: String },
      type: { type: String, enum: ["upload", "canvas"] },
    },
    stamp: {
      image: { type: String },
    },
    retentionCounter: {
      year: { type: Number, required: true },
      month: { type: Number, required: true },
      lastCorrelative: { type: Number, required: true, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

tenantSchema.index({ rif: 1 }, { unique: true });

export type TenantDocument = InferSchemaType<typeof tenantSchema>;

export const TenantModel = models.Tenant ?? model("Tenant", tenantSchema);
