import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authService } from "@/backend/modules/auth/auth.service";
import { UserRole } from "@/backend/shared/types";
import { emailSchema, rifSchema } from "@/backend/shared/validation";

const credentialsSchema = z.object({
  tenantRif: rifSchema,
  email: emailSchema,
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        tenantRif: { label: "RIF", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        try {
          const user = await authService.authenticate(parsed.data);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId as string;
        token.role = (user.role as UserRole | undefined) ?? UserRole.ADMIN;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.tenantId = token.tenantId as string;
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.ADMIN;
      }

      return session;
    },
  },
});
