import type { Company, CompanyRecord } from "@kpmg/shared";

import { httpCompanyApi } from "./httpCompanyApi";
import { mockCompanyApi } from "./mockCompanyApi";

export interface CompanyListQuery {
  page: number;
  pageSize: number;
  search?: string;
  state?: string;
}

export interface CompanyListResult {
  data: CompanyRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CompanyApi {
  listCompanies(
    query: CompanyListQuery,
    signal?: AbortSignal,
  ): Promise<CompanyListResult>;
  getCompany(companyId: string, signal?: AbortSignal): Promise<CompanyRecord>;
  createCompany(input: Company): Promise<CompanyRecord>;
  updateCompany(companyId: string, input: Company): Promise<CompanyRecord>;
  deleteCompany(companyId: string): Promise<void>;
}

/**
 * Enquanto o backend não existe, `VITE_API_MOCK=true` troca a implementação
 * por uma em memória. As páginas dependem só de `CompanyApi`, então nada muda
 * nelas quando a API real entra no lugar.
 */
const isMockEnabled = import.meta.env.VITE_API_MOCK === "true";

export const companyApi: CompanyApi = isMockEnabled
  ? mockCompanyApi
  : httpCompanyApi;
