import { redirect } from "next/navigation";

import { isSelfRegistrationEnabled } from "@/backend/config/env";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  if (!isSelfRegistrationEnabled()) {
    redirect("/login");
  }

  return <RegisterForm />;
}
