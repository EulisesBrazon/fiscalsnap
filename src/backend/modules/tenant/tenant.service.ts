import { Types } from "mongoose";

import { AppError } from "@/backend/shared/errors";
import { normalizeRif } from "@/backend/shared/validation";

import { TenantModel } from "./tenant.model";
import type { CreateTenantDto, UpdateTenantDto } from "./tenant.types";

class TenantService {
  async createTenant(input: CreateTenantDto) {
    const now = new Date();

    const tenant = await TenantModel.create({
      name: input.name.trim(),
      rif: normalizeRif(input.rif),
      fiscalAddress: input.fiscalAddress.trim(),
      uiTheme: {
        mode: "dark",
        colors: {
          primary: "#4F4BD8",
          secondary: "#1F1B1F",
          accent: "#7A80A3",
          neutral: "#E7E9F5",
        },
      },
      retentionCounter: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        lastCorrelative: 0,
      },
      isActive: true,
    });

    return tenant;
  }

  async getByRif(rif: string) {
    return TenantModel.findOne({ rif: normalizeRif(rif), isActive: true });
  }

  async getById(tenantId: string) {
    if (!Types.ObjectId.isValid(tenantId)) {
      throw new AppError("Tenant inválido", 400);
    }

    const tenant = await TenantModel.findOne({ _id: tenantId, isActive: true });

    if (!tenant) {
      throw new AppError("Empresa no encontrada", 404);
    }

    return tenant;
  }

  async updateById(tenantId: string, input: UpdateTenantDto) {
    const tenant = await this.getById(tenantId);

    if (input.name !== undefined) {
      tenant.name = input.name.trim();
    }

    if (input.fiscalAddress !== undefined) {
      tenant.fiscalAddress = input.fiscalAddress.trim();
    }

    if (input.signature !== undefined) {
      if (input.signature === null) {
        tenant.set("signature.image", undefined);
        tenant.set("signature.type", undefined);
      } else {
        tenant.signature = input.signature;
      }
    }

    if (input.stamp !== undefined) {
      if (input.stamp === null) {
        tenant.set("stamp.image", undefined);
      } else {
        tenant.stamp = input.stamp;
      }
    }

    if (input.uiTheme !== undefined) {
      tenant.uiTheme = input.uiTheme;
    }

    await tenant.save();

    return tenant;
  }
}

export const tenantService = new TenantService();
