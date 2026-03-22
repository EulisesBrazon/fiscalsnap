import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions, tenantRefField } from "@/backend/shared/base.model";

const providerSchema = new Schema(
  {
    tenantId: tenantRefField,
    rif: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

providerSchema.index({ tenantId: 1, rif: 1 }, { unique: true });
providerSchema.index({ tenantId: 1, createdAt: -1 });

export type ProviderDocument = InferSchemaType<typeof providerSchema>;

export const ProviderModel = models.Provider ?? model("Provider", providerSchema);
