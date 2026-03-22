import { Types } from "mongoose";

import { AppError } from "@/backend/shared/errors";
import { normalizeRif } from "@/backend/shared/validation";

import { ProviderModel } from "./provider.model";
import type { CreateProviderDto, UpdateProviderDto } from "./provider.types";

class ProviderService {
  async create(input: CreateProviderDto) {
    const existing = await this.getByRif(input.tenantId, input.rif);
    if (existing) {
      return existing;
    }

    const provider = await ProviderModel.create({
      tenantId: input.tenantId,
      rif: normalizeRif(input.rif),
      name: input.name.trim(),
      address: input.address?.trim(),
      phone: input.phone?.trim(),
      email: input.email?.trim().toLowerCase(),
      isActive: true,
    });

    return provider;
  }

  async list(tenantId: string) {
    return ProviderModel.find({ tenantId, isActive: true }).sort({ createdAt: -1 });
  }

  async getById(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Proveedor inválido", 400);
    }

    const provider = await ProviderModel.findOne({ _id: id, tenantId, isActive: true });
    if (!provider) {
      throw new AppError("Proveedor no encontrado", 404);
    }

    return provider;
  }

  async getByRif(tenantId: string, rif: string) {
    return ProviderModel.findOne({ tenantId, rif: normalizeRif(rif), isActive: true });
  }

  async update(tenantId: string, id: string, input: UpdateProviderDto) {
    const provider = await this.getById(tenantId, id);

    if (input.name !== undefined) provider.name = input.name.trim();
    if (input.address !== undefined) provider.address = input.address.trim();
    if (input.phone !== undefined) provider.phone = input.phone.trim();
    if (input.email !== undefined) provider.email = input.email.trim().toLowerCase();

    await provider.save();
    return provider;
  }
}

export const providerService = new ProviderService();
