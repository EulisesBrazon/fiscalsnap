export interface TenantCounter {
  year: number;
  month: number;
  lastCorrelative: number;
}

export interface SignatureData {
  image: string;
  type: "upload" | "canvas";
}

export interface StampData {
  image: string;
}

export interface TenantThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
}

export interface TenantUiTheme {
  mode: "light" | "dark";
  colors: TenantThemeColors;
}

export interface CreateTenantDto {
  name: string;
  rif: string;
  fiscalAddress: string;
}

export interface UpdateTenantDto {
  name?: string;
  fiscalAddress?: string;
  signature?: SignatureData | null;
  stamp?: StampData | null;
  uiTheme?: TenantUiTheme;
}
