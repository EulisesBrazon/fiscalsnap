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

export interface CreateTenantDto {
  name: string;
  rif: string;
  fiscalAddress: string;
}

export interface UpdateTenantDto {
  name?: string;
  fiscalAddress?: string;
  signature?: SignatureData;
  stamp?: StampData;
}
