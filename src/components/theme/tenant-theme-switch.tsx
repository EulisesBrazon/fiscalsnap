"use client";

import { useEffect, useState } from "react";

import { tenantThemeToCssVariables, type TenantThemeColors, type TenantThemeMode } from "@/lib/tenant-theme";

const THEME_OVERRIDE_KEY = "fiscalsnap-ui-mode-override";

type TenantThemeSwitchProps = {
  rootId: string;
  defaultMode: TenantThemeMode;
  colors: TenantThemeColors;
};

function applyMode(rootId: string, mode: TenantThemeMode, colors: TenantThemeColors) {
  const root = document.getElementById(rootId);
  if (!root) {
    return;
  }

  root.classList.toggle("dark", mode === "dark");

  const vars = tenantThemeToCssVariables({ mode, colors });
  Object.entries(vars).forEach(([name, value]) => {
    root.style.setProperty(name, value);
  });
}

export function TenantThemeSwitch({ rootId, defaultMode, colors }: TenantThemeSwitchProps) {
  const [mode, setMode] = useState<TenantThemeMode>(defaultMode);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_OVERRIDE_KEY);
    const initialMode: TenantThemeMode = saved === "light" || saved === "dark" ? saved : defaultMode;

    setMode(initialMode);
    applyMode(rootId, initialMode, colors);
  }, [colors, defaultMode, rootId]);

  function toggleMode() {
    const nextMode: TenantThemeMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    localStorage.setItem(THEME_OVERRIDE_KEY, nextMode);
    applyMode(rootId, nextMode, colors);
  }

  return (
    <button
      type="button"
      onClick={toggleMode}
      className="inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs"
      aria-label="Cambiar modo de color"
      title={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span className="text-muted-foreground">Modo</span>
      <span className="font-semibold">{mode === "dark" ? "Oscuro" : "Claro"}</span>
      <span className="relative inline-flex h-4 w-8 items-center rounded-full bg-muted">
        <span
          className={`absolute h-3 w-3 rounded-full bg-primary transition-all ${mode === "dark" ? "left-4" : "left-1"}`}
        />
      </span>
    </button>
  );
}
