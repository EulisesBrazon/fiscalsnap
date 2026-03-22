import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/backend/config/database";
import { AppError } from "@/backend/shared/errors";
import { UserRole } from "@/backend/shared/types";
import { emailSchema, normalizeRif } from "@/backend/shared/validation";

import { tenantService } from "@/backend/modules/tenant/tenant.service";

import { UserModel } from "./auth.model";
import type { AuthUser, LoginDto, RegisterAdminDto } from "./auth.types";

class AuthService {
  async registerAdmin(input: RegisterAdminDto) {
    await connectToDatabase();

    const tenantRif = normalizeRif(input.tenantRif);
    const email = emailSchema.parse(input.email);

    const existingTenant = await tenantService.getByRif(tenantRif);
    if (existingTenant) {
      throw new AppError("Ya existe una empresa con ese RIF", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const tenant = await tenantService.createTenant({
      name: input.tenantName,
      rif: tenantRif,
      fiscalAddress: input.fiscalAddress,
    });

    const user = await UserModel.create({
      tenantId: tenant._id,
      name: input.name.trim(),
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });

    return {
      userId: String(user._id),
      tenantId: String(tenant._id),
      email: user.email,
    };
  }

  async authenticate(input: LoginDto): Promise<AuthUser> {
    await connectToDatabase();

    const tenantRif = normalizeRif(input.tenantRif);
    const email = emailSchema.parse(input.email);

    const tenant = await tenantService.getByRif(tenantRif);
    if (!tenant) {
      throw new AppError("Empresa no encontrada", 404);
    }

    const user = await UserModel.findOne({
      tenantId: tenant._id,
      email,
      isActive: true,
    });

    if (!user) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Credenciales inválidas", 401);
    }

    return {
      id: String(user._id),
      tenantId: String(tenant._id),
      role: user.role,
      name: user.name,
      email: user.email,
    };
  }
}

export const authService = new AuthService();
