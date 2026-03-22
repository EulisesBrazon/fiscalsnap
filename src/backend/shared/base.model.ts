import { Schema } from "mongoose";

export const tenantRefField = {
  type: Schema.Types.ObjectId,
  ref: "Tenant",
  required: true,
  index: true,
} as const;

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
} as const;
