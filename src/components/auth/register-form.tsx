"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { getApiErrorMessage } from "@/lib/api-errors";

type RegisterFormValues = {
  tenantName: string;
  tenantRif: string;
  fiscalAddress: string;
  name: string;
  email: string;
  password: string;
};

type RegisterField = keyof RegisterFormValues;
type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

const EMPTY_FORM: RegisterFormValues = {
  tenantName: "",
  tenantRif: "",
  fiscalAddress: "",
  name: "",
  email: "",
  password: "",
};

const REGISTER_FIELDS: RegisterField[] = ["tenantName", "tenantRif", "fiscalAddress", "name", "email", "password"];

function mapFieldErrors(errors?: Record<string, string[]>): RegisterFieldErrors {
  if (!errors) {
    return {};
  }

  const mapped: RegisterFieldErrors = {};
  for (const field of REGISTER_FIELDS) {
    const firstMessage = errors[field]?.[0];
    if (firstMessage) {
      mapped[field] = firstMessage;
    }
  }

  return mapped;
}

export function RegisterForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<RegisterFormValues>(EMPTY_FORM);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField(field: RegisterField, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      setConfirmPasswordError(null);
    }
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      return { ...prev, [field]: undefined };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmPasswordError(null);
    setFieldErrors({});

    if (formValues.password !== confirmPassword) {
      setConfirmPasswordError("Las contrasenas no coinciden.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });

    if (!response.ok) {
      const data = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
      setFieldErrors(mapFieldErrors(data.errors));
      setError(getApiErrorMessage(data, "No se pudo crear la cuenta."));
      setLoading(false);
      return;
    }

    router.push("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta de empresa</h1>
        <p className="mt-2 text-sm text-muted-foreground">Configura tu tenant y usuario administrador.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="tenantName">
            Nombre de empresa
          </label>
          <input
            id="tenantName"
            name="tenantName"
            value={formValues.tenantName}
            onChange={(event) => updateField("tenantName", event.target.value)}
            required
            aria-invalid={fieldErrors.tenantName ? true : undefined}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
          />
          {fieldErrors.tenantName ? <p className="text-sm text-destructive">{fieldErrors.tenantName}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="tenantRif">
            RIF
          </label>
          <input
            id="tenantRif"
            name="tenantRif"
            value={formValues.tenantRif}
            onChange={(event) => updateField("tenantRif", event.target.value)}
            placeholder="J-12345678-9"
            required
            aria-invalid={fieldErrors.tenantRif ? true : undefined}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
          />
          {fieldErrors.tenantRif ? <p className="text-sm text-destructive">{fieldErrors.tenantRif}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="fiscalAddress">
            Dirección fiscal
          </label>
          <input
            id="fiscalAddress"
            name="fiscalAddress"
            value={formValues.fiscalAddress}
            onChange={(event) => updateField("fiscalAddress", event.target.value)}
            required
            aria-invalid={fieldErrors.fiscalAddress ? true : undefined}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
          />
          {fieldErrors.fiscalAddress ? <p className="text-sm text-destructive">{fieldErrors.fiscalAddress}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Nombre del administrador
          </label>
          <input
            id="name"
            name="name"
            value={formValues.name}
            onChange={(event) => updateField("name", event.target.value)}
            required
            aria-invalid={fieldErrors.name ? true : undefined}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
          />
          {fieldErrors.name ? <p className="text-sm text-destructive">{fieldErrors.name}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={(event) => updateField("email", event.target.value)}
            required
            aria-invalid={fieldErrors.email ? true : undefined}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
          />
          {fieldErrors.email ? <p className="text-sm text-destructive">{fieldErrors.email}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Clave
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formValues.password}
              onChange={(event) => updateField("password", event.target.value)}
              minLength={8}
              required
              aria-invalid={fieldErrors.password ? true : undefined}
              className="h-10 w-full rounded-md border bg-background px-3 pr-11 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? <p className="text-sm text-destructive">{fieldErrors.password}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirmar clave
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setConfirmPasswordError(null);
              }}
              minLength={8}
              required
              aria-invalid={confirmPasswordError ? true : undefined}
              className="h-10 w-full rounded-md border bg-background px-3 pr-11 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Ocultar confirmacion de clave" : "Mostrar confirmacion de clave"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPasswordError ? <p className="text-sm text-destructive">{confirmPasswordError}</p> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button disabled={loading} type="submit" className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
