export type TenantThemeMode = "light" | "dark";

export type TenantThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
};

export type TenantUiTheme = {
  mode: TenantThemeMode;
  colors: TenantThemeColors;
};

export const DEFAULT_TENANT_UI_THEME: TenantUiTheme = {
  // Based on the provided logo: indigo edge, charcoal body, slate accent, soft neutral.
  mode: "dark",
  colors: {
    primary: "#4F4BD8",
    secondary: "#1F1B1F",
    accent: "#7A80A3",
    neutral: "#E7E9F5",
  },
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function safeHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return HEX_COLOR_REGEX.test(value) ? value.toUpperCase() : fallback;
}

export function normalizeTenantUiTheme(input?: Partial<TenantUiTheme> | null): TenantUiTheme {
  return {
    mode: input?.mode === "light" ? "light" : "dark",
    colors: {
      primary: safeHexColor(input?.colors?.primary, DEFAULT_TENANT_UI_THEME.colors.primary),
      secondary: safeHexColor(input?.colors?.secondary, DEFAULT_TENANT_UI_THEME.colors.secondary),
      accent: safeHexColor(input?.colors?.accent, DEFAULT_TENANT_UI_THEME.colors.accent),
      neutral: safeHexColor(input?.colors?.neutral, DEFAULT_TENANT_UI_THEME.colors.neutral),
    },
  };
}

export function tenantThemeToCssVariables(theme: TenantUiTheme): Record<string, string> {
  const isDark = theme.mode === "dark";

  return {
    "--background": isDark ? "#0E1018" : "#F6F8FF",
    "--foreground": isDark ? "#F5F7FF" : "#111320",
    "--card": isDark ? "#151926" : "#FFFFFF",
    "--card-foreground": isDark ? "#F5F7FF" : "#111320",
    "--popover": isDark ? "#151926" : "#FFFFFF",
    "--popover-foreground": isDark ? "#F5F7FF" : "#111320",
    "--muted": isDark ? "#1E2333" : "#EBEEF9",
    "--muted-foreground": isDark ? "#C2C8E6" : "#4C547A",
    "--border": isDark ? "#2A3045" : "#D8DEEF",
    "--input": isDark ? "#2A3045" : "#D8DEEF",
    "--primary": theme.colors.primary,
    "--primary-foreground": isDark ? "#F7F8FF" : "#FFFFFF",
    "--secondary": isDark ? "#232636" : theme.colors.neutral,
    "--secondary-foreground": isDark ? "#E9ECFF" : "#1A1C28",
    "--accent": isDark ? "#2A2E42" : theme.colors.accent,
    "--accent-foreground": isDark ? "#E9ECFF" : "#10111A",
    "--ring": theme.colors.primary,
    "--sidebar-primary": theme.colors.primary,
    "--sidebar-ring": theme.colors.primary,
    "--chart-1": theme.colors.primary,
    "--chart-2": theme.colors.accent,
    "--chart-3": theme.colors.secondary,
    "--chart-4": "#9FA5C4",
    "--chart-5": "#DDE1F7",
  };
}
