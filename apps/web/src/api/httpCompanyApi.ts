import type { Company, CompanyRecord } from "@kpmg/shared";

import type { CompanyApi, CompanyListQuery, CompanyListResult } from "./companyApi";
import { requestJson } from "./httpClient";

/** Implementação real, contra os endpoints de docs/03-API-SPEC.md. */
export const httpCompanyApi: CompanyApi = {
  listCompanies(query: CompanyListQuery, signal?: AbortSignal) {
    return requestJson<CompanyListResult>(
      `/companies?${buildListSearchParams(query)}`,
      { signal },
    );
  },

  getCompany(companyId: string, signal?: AbortSignal) {
    return requestJson<CompanyRecord>(`/companies/${companyId}`, { signal });
  },

  createCompany(input: Company) {
    return requestJson<CompanyRecord>("/companies", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateCompany(companyId: string, input: Company) {
    return requestJson<CompanyRecord>(`/companies/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  deleteCompany(companyId: string) {
    return requestJson<void>(`/companies/${companyId}`, { method: "DELETE" });
  },
};

function buildListSearchParams({
  page,
  pageSize,
  search,
  state,
}: CompanyListQuery): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search) searchParams.set("search", search);
  if (state) searchParams.set("state", state);

  return searchParams.toString();
}
