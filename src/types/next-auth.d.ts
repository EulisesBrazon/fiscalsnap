import { UserRole } from "@/backend/shared/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    tenantId: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    tenantId: string;
    role: UserRole;
  }
}
