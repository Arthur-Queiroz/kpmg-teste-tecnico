import type { Address } from "@kpmg/shared";

const VIA_CEP_BASE_URL = "https://viacep.com.br/ws";

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  /** A ViaCEP responde `{ "erro": true }` (ou "true") para CEP inexistente. */
  erro?: boolean | string;
}

/**
 * Consulta a ViaCEP direto do browser (ver docs/09-DECISIONS.md). Retorna
 * `null` quando o CEP não existe; erros de rede são propagados para o chamador
 * decidir — aqui nunca bloqueiam o preenchimento manual.
 */
export async function fetchAddressByZipCode(
  zipCode: string,
  signal?: AbortSignal,
): Promise<Partial<Address> | null> {
  const response = await fetch(`${VIA_CEP_BASE_URL}/${zipCode}/json/`, { signal });

  if (!response.ok) {
    throw new Error(`ViaCEP respondeu ${response.status}`);
  }

  const body = (await response.json()) as ViaCepResponse;

  if (body.erro === true || body.erro === "true") {
    return null;
  }

  return {
    street: body.logradouro || undefined,
    neighborhood: body.bairro || undefined,
    city: body.localidade || undefined,
    state: (body.uf as Address["state"]) || undefined,
  };
}
