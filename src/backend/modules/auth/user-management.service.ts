import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { AppError } from "@/backend/shared/errors";
import { UserRole } from "@/backend/shared/types";
import { emailSchema } from "@/backend/shared/validation";

import { UserModel } from "./auth.model";

type CreateUserInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type UpdateUserRoleInput = {
  tenantId: string;
  userId: string;
  role: UserRole;
  actorUserId: string;
};

type DeactivateUserInput = {
  tenantId: string;
  userId: string;
  actorUserId: string;
};

class UserManagementService {
  async listUsers(tenantId: string) {
    return UserModel.find({ tenantId, isActive: true }).select("name email role createdAt").sort({ createdAt: -1 });
  }

  async createUser(input: CreateUserInput) {
    const email = emailSchema.parse(input.email);

    const existing = await UserModel.findOne({ tenantId: input.tenantId, email, isActive: true });
    if (existing) {
      throw new AppError("Ya existe un usuario con ese email", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return UserModel.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      isActive: true,
    });
  }

  async updateUserRole(input: UpdateUserRoleInput) {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new AppError("Usuario inválido", 400);
    }

    if (input.userId === input.actorUserId) {
      throw new AppError("No puedes cambiar tu propio rol", 400);
    }

    const user = await UserModel.findOne({
      _id: input.userId,
      tenantId: input.tenantId,
      isActive: true,
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    user.role = input.role;
    await user.save();

    return user;
  }

  async deactivateUser(input: DeactivateUserInput) {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new AppError("Usuario inválido", 400);
    }

    if (input.userId === input.actorUserId) {
      throw new AppError("No puedes desactivar tu propio usuario", 400);
    }

    const user = await UserModel.findOne({
      _id: input.userId,
      tenantId: input.tenantId,
      isActive: true,
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    user.isActive = false;
    await user.save();

    return user;
  }
}

export const userManagementService = new UserManagementService();
