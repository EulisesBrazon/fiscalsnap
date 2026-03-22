"use client";

import { useState } from "react";

import { UserRole } from "@/backend/shared/types";
import { getApiErrorMessage } from "@/lib/api-errors";

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

type UsersSettingsClientProps = {
  initialUsers: UserItem[];
};

export function UsersSettingsClient({ initialUsers }: UsersSettingsClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);

  async function loadUsers() {
    setLoading(true);
    const response = await fetch("/api/users");
    const payload = (await response.json()) as { data?: UserItem[]; message?: string; errors?: Record<string, string[]> };

    if (!response.ok || !payload.data) {
      setMessage(getApiErrorMessage(payload, "No se pudieron cargar los usuarios"));
      setLoading(false);
      return;
    }

    setUsers(payload.data.map((item) => ({ ...item, _id: String(item._id) })));
    setLoading(false);
  }

  async function createUser() {
    setSaving(true);
    setMessage("Creando usuario...");

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo crear usuario"));
      setSaving(false);
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole(UserRole.OPERATOR);
    await loadUsers();
    setMessage("Usuario creado.");
    setSaving(false);
  }

  async function changeRole(userId: string, nextRole: UserRole) {
    setSaving(true);
    setMessage("Actualizando rol...");

    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: nextRole }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo actualizar el rol"));
      setSaving(false);
      return;
    }

    await loadUsers();
    setMessage("Rol actualizado.");
    setSaving(false);
  }

  async function deactivateUser(userId: string) {
    setSaving(true);
    setMessage("Desactivando usuario...");

    const response = await fetch("/api/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo desactivar el usuario"));
      setSaving(false);
      return;
    }

    await loadUsers();
    setMessage("Usuario desactivado.");
    setSaving(false);
  }

  return (
    <main className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-lg font-semibold">Usuarios y Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">Administra administradores, supervisores y operadores.</p>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">Crear usuario</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" className="h-10 rounded-md border bg-background px-3 text-sm" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-10 rounded-md border bg-background px-3 text-sm" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Clave" className="h-10 rounded-md border bg-background px-3 text-sm" />
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value={UserRole.ADMIN}>admin</option>
            <option value={UserRole.SUPERVISOR}>supervisor</option>
            <option value={UserRole.OPERATOR}>operator</option>
          </select>
        </div>
        <button disabled={saving} onClick={createUser} type="button" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
          Crear usuario
        </button>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Usuarios activos</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user._id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">Creado: {new Date(user.createdAt).toISOString().slice(0, 10)}</p>
                <select
                  value={user.role}
                  onChange={(event) => void changeRole(user._id, event.target.value as UserRole)}
                  className="h-9 rounded-md border bg-background px-2 text-xs"
                >
                  <option value={UserRole.ADMIN}>admin</option>
                  <option value={UserRole.SUPERVISOR}>supervisor</option>
                  <option value={UserRole.OPERATOR}>operator</option>
                </select>
                <button type="button" onClick={() => void deactivateUser(user._id)} className="h-9 rounded-md border px-2 text-xs">
                  Desactivar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </main>
  );
}
