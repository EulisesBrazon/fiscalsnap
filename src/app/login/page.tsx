import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { isSelfRegistrationEnabled } from "@/backend/config/env";
import { auth, signIn } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams =
    searchParams && "then" in searchParams ? await searchParams : searchParams;

  const authError = resolvedSearchParams?.error;
  const registrationEnabled = isSelfRegistrationEnabled();

  const session = await auth();
  if (session?.user?.tenantId) {
    redirect("/dashboard");
  }

  async function loginAction(formData: FormData) {
    "use server";

    const tenantRif = String(formData.get("tenantRif") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await signIn("credentials", {
        tenantRif,
        email,
        password,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError && error.type === "CredentialsSignin") {
        redirect("/login?error=credenciales");
      }

      throw error;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Ingresar a FiscalSnap</h1>
        <p className="mt-2 text-sm text-muted-foreground">Emite comprobantes de retención desde tu teléfono.</p>
      </div>

      <form action={loginAction} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        {authError === "credenciales" ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Credenciales inválidas. Verifica RIF, email y clave.
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="tenantRif">
            RIF de la empresa
          </label>
          <input id="tenantRif" name="tenantRif" placeholder="J-12345678-9" required className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" placeholder="admin@empresa.com" required className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Clave
          </label>
          <input id="password" name="password" type="password" required className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none ring-0 focus:border-ring" />
        </div>

        <button type="submit" className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
          Ingresar
        </button>
      </form>

      {registrationEnabled ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          ¿Primera vez?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Crea tu cuenta
          </Link>
        </p>
      ) : null}
    </main>
  );
}
