import type { RetentionPercentage } from "@/backend/shared/types";

export interface CreateRetentionDto {
  tenantId: string;
  providerId: string;
  invoiceNumber: string;
  controlNumber: string;
  invoiceDate: string;
  taxBase: number;
  taxRate: number;
  retentionPercentage: RetentionPercentage;
}
