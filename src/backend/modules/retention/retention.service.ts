import { Types } from "mongoose";

import { AppError } from "@/backend/shared/errors";
import type { RetentionPercentage } from "@/backend/shared/types";
import { tenantService } from "@/backend/modules/tenant/tenant.service";

import { ProviderModel } from "../provider/provider.model";
import { buildVoucherNumber } from "./retention.utils";
import { RetentionModel } from "./retention.model";

type CreateRetentionInput = {
  tenantId: string;
  providerId: string;
  invoiceNumber: string;
  controlNumber: string;
  invoiceDate: string;
  machineSerial?: string;
  taxBase: number;
  taxRate?: number;
  retentionPercentage: RetentionPercentage;
  ocrRawData?: unknown;
};

class RetentionService {
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async getNextVoucherNumber(tenantId: string) {
    const tenant = await tenantService.getById(tenantId);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (tenant.retentionCounter.year !== year || tenant.retentionCounter.month !== month) {
      tenant.retentionCounter.year = year;
      tenant.retentionCounter.month = month;
      tenant.retentionCounter.lastCorrelative = 0;
    }

    tenant.retentionCounter.lastCorrelative += 1;
    await tenant.save();

    return buildVoucherNumber(now, tenant.retentionCounter.lastCorrelative);
  }

  async create(input: CreateRetentionInput) {
    if (!Types.ObjectId.isValid(input.providerId)) {
      throw new AppError("Proveedor inválido", 400);
    }

    const provider = await ProviderModel.findOne({
      _id: input.providerId,
      tenantId: input.tenantId,
      isActive: true,
    });

    if (!provider) {
      throw new AppError("Proveedor no encontrado", 404);
    }

    const taxRate = input.taxRate ?? 16;
    const ivaAmount = this.round2((input.taxBase * taxRate) / 100);
    const retentionAmount = this.round2((ivaAmount * input.retentionPercentage) / 100);

    const voucherNumber = await this.getNextVoucherNumber(input.tenantId);

    const retention = await RetentionModel.create({
      tenantId: input.tenantId,
      providerId: provider._id,
      voucherNumber,
      invoiceNumber: input.invoiceNumber.trim(),
      controlNumber: input.controlNumber.trim(),
      invoiceDate: new Date(input.invoiceDate),
      machineSerial: input.machineSerial?.trim(),
      taxBase: this.round2(input.taxBase),
      taxRate,
      ivaAmount,
      retentionPercentage: input.retentionPercentage,
      retentionAmount,
      status: "issued",
      ocrRawData: input.ocrRawData,
    });

    return retention;
  }

  async list(tenantId: string) {
    return RetentionModel.find({ tenantId }).populate("providerId").sort({ createdAt: -1 });
  }

  async search(
    tenantId: string,
    filters: {
      q?: string;
      providerRif?: string;
      status?: "issued" | "voided";
      from?: string;
      to?: string;
    },
  ) {
    const retentions = await this.list(tenantId);

    return retentions.filter((retention) => {
      const q = (filters.q ?? "").trim().toLowerCase();
      const providerRif = (filters.providerRif ?? "").trim().toUpperCase();

      const provider = retention.providerId as { rif?: string; name?: string } | undefined;

      if (q) {
        const haystack = [
          retention.voucherNumber,
          retention.invoiceNumber,
          retention.controlNumber,
          provider?.rif ?? "",
          provider?.name ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      if (providerRif && !(provider?.rif ?? "").toUpperCase().includes(providerRif)) {
        return false;
      }

      if (filters.status && retention.status !== filters.status) {
        return false;
      }

      const created = new Date(retention.createdAt);

      if (filters.from) {
        const fromDate = new Date(filters.from);
        if (created < fromDate) return false;
      }

      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        if (created > toDate) return false;
      }

      return true;
    });
  }

  async getById(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Comprobante inválido", 400);
    }

    const retention = await RetentionModel.findOne({ _id: id, tenantId })
      .populate("providerId")
      .populate("voidedBy", "name email");
    if (!retention) {
      throw new AppError("Comprobante no encontrado", 404);
    }

    return retention;
  }

  async void(tenantId: string, id: string, reason: string, actorUserId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Comprobante inválido", 400);
    }

    if (!Types.ObjectId.isValid(actorUserId)) {
      throw new AppError("Usuario inválido", 400);
    }

    const retention = await RetentionModel.findOne({ _id: id, tenantId });
    if (!retention) {
      throw new AppError("Comprobante no encontrado", 404);
    }

    if (retention.status === "voided") {
      throw new AppError("El comprobante ya está anulado", 409);
    }

    retention.status = "voided";
    retention.voidReason = reason.trim();
    retention.voidedAt = new Date();
    retention.voidedBy = new Types.ObjectId(actorUserId);
    await retention.save();

    return this.getById(tenantId, id);
  }
}

export const retentionService = new RetentionService();
