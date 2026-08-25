import type { Company, CompanyRecord } from "@kpmg/shared";
import { unmaskCnpj } from "@kpmg/shared";

import type { CompanyApi, CompanyListQuery, CompanyListResult } from "./companyApi";
import { ApiError } from "./httpClient";

const SIMULATED_LATENCY_IN_MILLISECONDS = 320;

/**
 * Implementação em memória, ligada por VITE_API_MOCK=true, usada enquanto o
 * backend não existe. Reproduz o contrato de docs/03-API-SPEC.md, incluindo
 * 409 para CNPJ duplicado e 404 para id inexistente. Não é usada em produção.
 */
const companies: CompanyRecord[] = [
  buildSeed("Aurora Participações S.A.", "12345678000195", "Aurora Holding", {
    zipCode: "01310100", street: "Av. Paulista", number: "1842",
    neighborhood: "Bela Vista", city: "São Paulo", state: "SP",
  }, "2026-02-11"),
  buildSeed("Marumbi Logística Ltda.", "11444777000161", "Marumbi Log", {
    zipCode: "80010010", street: "R. Marechal Deodoro", number: "630",
    neighborhood: "Centro", city: "Curitiba", state: "PR",
  }, "2026-03-04"),
  buildSeed("Vega Serviços Contábeis", "19131243000197", "Vega Contábil", {
    zipCode: "30130003", street: "Av. Afonso Pena", number: "1270",
    neighborhood: "Centro", city: "Belo Horizonte", state: "MG",
  }, "2026-03-22"),
  buildSeed("Costa & Ribeiro Engenharia", "45448325000192", "CR Engenharia", {
    zipCode: "50030170", street: "R. do Bom Jesus", number: "155",
    neighborhood: "Recife Antigo", city: "Recife", state: "PE",
  }, "2026-04-09"),
  buildSeed("Nordeste Alimentos S.A.", "34028316000103", "NDA Foods", {
    zipCode: "60165121", street: "Av. Beira Mar", number: "3980",
    neighborhood: "Meireles", city: "Fortaleza", state: "CE",
  }, "2026-05-15"),
  buildSeed("Pampa Agro Comércio", "27865757000102", "Pampa Agro", {
    zipCode: "90619900", street: "Av. Ipiranga", number: "6681",
    neighborhood: "Partenon", city: "Porto Alegre", state: "RS",
  }, "2026-06-02"),
  buildSeed("Tapajós Tecnologia Ltda.", "08561701000101", "Tapajós Tech", {
    zipCode: "69050010", street: "Av. Djalma Batista", number: "482",
    neighborhood: "Chapada", city: "Manaus", state: "AM",
  }, "2026-07-18"),
  buildSeed("Baía Marítima Serviços", "05570714000159", "Baía Marítima", {
    zipCode: "41820020", street: "Av. Tancredo Neves", number: "1632",
    neighborhood: "Caminho das Árvores", city: "Salvador", state: "BA",
  }, "2026-08-05"),
];

export const mockCompanyApi: CompanyApi = {
  async listCompanies({
    page,
    pageSize,
    search,
    state,
  }: CompanyListQuery): Promise<CompanyListResult> {
    await simulateLatency();

    const matches = companies.filter(
      (company) => matchesState(company, state) && matchesSearch(company, search),
    );
    const firstIndex = (page - 1) * pageSize;

    return {
      data: matches.slice(firstIndex, firstIndex + pageSize),
      total: matches.length,
      page,
      pageSize,
    };
  },

  async getCompany(companyId: string): Promise<CompanyRecord> {
    await simulateLatency();
    return findCompanyOrThrow(companyId);
  },

  async createCompany(input: Company): Promise<CompanyRecord> {
    await simulateLatency();
    assertCnpjIsAvailable(input.cnpj);

    const now = new Date().toISOString();
    const created: CompanyRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    companies.unshift(created);
    return created;
  },

  async updateCompany(companyId: string, input: Company): Promise<CompanyRecord> {
    await simulateLatency();

    const current = findCompanyOrThrow(companyId);
    assertCnpjIsAvailable(input.cnpj, companyId);

    const updated: CompanyRecord = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    companies[companies.indexOf(current)] = updated;
    return updated;
  },

  async deleteCompany(companyId: string): Promise<void> {
    await simulateLatency();
    const company = findCompanyOrThrow(companyId);
    companies.splice(companies.indexOf(company), 1);
  },
};

function buildSeed(
  name: string,
  cnpj: string,
  tradeName: string,
  address: Company["address"],
  createdAtDate: string,
): CompanyRecord {
  const createdAt = `${createdAtDate}T12:00:00.000Z`;
  return {
    id: `seed-${cnpj}`,
    name,
    cnpj,
    tradeName,
    address: { complement: "", ...address },
    createdAt,
    updatedAt: createdAt,
  };
}

function matchesState(company: CompanyRecord, state?: string): boolean {
  return !state || company.address.state === state;
}

function matchesSearch(company: CompanyRecord, search?: string): boolean {
  if (!search) return true;

  const term = search.trim().toLowerCase();
  const digits = unmaskCnpj(term);

  return (
    company.name.toLowerCase().includes(term) ||
    company.tradeName.toLowerCase().includes(term) ||
    (digits.length > 0 && company.cnpj.includes(digits))
  );
}

function findCompanyOrThrow(companyId: string): CompanyRecord {
  const company = companies.find((candidate) => candidate.id === companyId);
  if (!company) {
    throw new ApiError(404, "Empresa não encontrada.");
  }
  return company;
}

function assertCnpjIsAvailable(cnpj: string, ignoredCompanyId?: string): void {
  const isTaken = companies.some(
    (company) => company.cnpj === cnpj && company.id !== ignoredCompanyId,
  );

  if (isTaken) {
    throw new ApiError(409, "Já existe uma empresa com este CNPJ.", {
      cnpj: "Já existe uma empresa com este CNPJ.",
    });
  }
}

function simulateLatency(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, SIMULATED_LATENCY_IN_MILLISECONDS),
  );
}
