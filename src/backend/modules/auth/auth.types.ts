import { UserRole } from "@/backend/shared/types";

export interface RegisterAdminDto {
  tenantName: string;
  tenantRif: string;
  fiscalAddress: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  tenantRif: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
}
