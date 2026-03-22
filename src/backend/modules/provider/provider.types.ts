export interface CreateProviderDto {
  tenantId: string;
  rif: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateProviderDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}
