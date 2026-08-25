import { useEffect, useState } from "react";

import type { Address } from "@kpmg/shared";

import { fetchAddressByZipCode } from "../api/viaCepApi";
import { unmaskZipCode } from "../lib/masks";

const ZIP_CODE_LENGTH = 8;
const DEBOUNCE_IN_MILLISECONDS = 500;

export type CepLookupStatus =
  | "idle"
  | "loading"
  | "success"
  | "not_found"
  | "network_error";

export interface CepLookupResult {
  status: CepLookupStatus;
  data: Partial<Address> | null;
}

/** Resposta guardada junto do CEP que a originou. */
interface CepLookupEntry {
  zipCode: string;
  result: CepLookupResult;
}

const IDLE_RESULT: CepLookupResult = { status: "idle", data: null };
const LOADING_RESULT: CepLookupResult = { status: "loading", data: null };

/**
 * Consulta o CEP na ViaCEP e devolve o endereço encontrado. Só dispara com 8
 * dígitos, espera o usuário parar de digitar e aborta a requisição anterior a
 * cada mudança. A resposta é guardada junto do CEP que a gerou, então uma
 * resposta atrasada nunca aparece como resultado de outro CEP.
 *
 * `not_found` e `network_error` são estados normais: o formulário segue
 * preenchível à mão (ver docs/05-FRONTEND-SPEC.md).
 */
export function useCepLookup(zipCode: string): CepLookupResult {
  const [lastLookup, setLastLookup] = useState<CepLookupEntry | null>(null);

  const digits = unmaskZipCode(zipCode);
  const isComplete = digits.length === ZIP_CODE_LENGTH;

  useEffect(() => {
    if (!isComplete) return;

    const abortController = new AbortController();

    const debounceTimer = setTimeout(async () => {
      try {
        const address = await fetchAddressByZipCode(
          digits,
          abortController.signal,
        );
        setLastLookup({
          zipCode: digits,
          result: address
            ? { status: "success", data: address }
            : { status: "not_found", data: null },
        });
      } catch {
        if (!abortController.signal.aborted) {
          setLastLookup({
            zipCode: digits,
            result: { status: "network_error", data: null },
          });
        }
      }
    }, DEBOUNCE_IN_MILLISECONDS);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [digits, isComplete]);

  if (!isComplete) return IDLE_RESULT;
  if (lastLookup?.zipCode !== digits) return LOADING_RESULT;

  return lastLookup.result;
}
