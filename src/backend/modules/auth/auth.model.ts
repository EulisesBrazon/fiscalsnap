import { model, models, Schema, type InferSchemaType } from "mongoose";

import { baseSchemaOptions, tenantRefField } from "@/backend/shared/base.model";
import { UserRole } from "@/backend/shared/types";

const authSchema = new Schema(
  {
    tenantId: tenantRefField,
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ADMIN,
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

authSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof authSchema>;

export const UserModel = models.User ?? model("User", authSchema);
