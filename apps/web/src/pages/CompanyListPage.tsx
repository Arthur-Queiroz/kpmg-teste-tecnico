import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { CompanyRecord } from "@kpmg/shared";

import { companyApi, type CompanyListResult } from "../api/companyApi";
import { Button } from "../components/Button";
import { CompanyFilters } from "../components/CompanyFilters";
import { CompanyTable } from "../components/CompanyTable";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Pagination } from "../components/Pagination";
import { TableSkeleton } from "../components/TableSkeleton";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useToast } from "../hooks/useToast";

const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_IN_MILLISECONDS = 400;

type ListStatus = "loading" | "ready" | "error";

/**
 * Resposta guardada junto da consulta que a originou — enquanto a consulta
 * atual não tem resposta, a tela está carregando. `result: null` significa que
 * a consulta falhou.
 */
interface ListSnapshot {
  queryKey: string;
  result: CompanyListResult | null;
}

export function CompanyListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE;
  const appliedSearch = searchParams.get("search") ?? "";
  const selectedState = searchParams.get("state") ?? "";

  const [searchTerm, setSearchTerm] = useState(appliedSearch);
  const debouncedSearchTerm = useDebouncedValue(
    searchTerm,
    SEARCH_DEBOUNCE_IN_MILLISECONDS,
  );

  const [snapshot, setSnapshot] = useState<ListSnapshot | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const [companyPendingDeletion, setCompanyPendingDeletion] =
    useState<CompanyRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateFilters = useCallback(
    (changes: Record<string, string | number | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === "") {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // A busca digitada só entra na URL (e vira requisição) depois do debounce.
  useEffect(() => {
    if (debouncedSearchTerm !== appliedSearch) {
      updateFilters({ search: debouncedSearchTerm, page: null });
    }
  }, [debouncedSearchTerm, appliedSearch, updateFilters]);

  const queryKey = JSON.stringify({
    page,
    pageSize,
    appliedSearch,
    selectedState,
    reloadCount,
  });

  useEffect(() => {
    const abortController = new AbortController();
    let isCurrentRequest = true;

    companyApi
      .listCompanies(
        {
          page,
          pageSize,
          search: appliedSearch || undefined,
          state: selectedState || undefined,
        },
        abortController.signal,
      )
      .then((listResult) => {
        if (isCurrentRequest) setSnapshot({ queryKey, result: listResult });
      })
      .catch(() => {
        if (isCurrentRequest) setSnapshot({ queryKey, result: null });
      });

    return () => {
      isCurrentRequest = false;
      abortController.abort();
    };
  }, [queryKey, page, pageSize, appliedSearch, selectedState]);

  const currentSnapshot = snapshot?.queryKey === queryKey ? snapshot : null;
  const status: ListStatus = !currentSnapshot
    ? "loading"
    : currentSnapshot.result
      ? "ready"
      : "error";
  const result = currentSnapshot?.result ?? null;

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const companies = result?.data ?? [];
  const hasFilters = Boolean(appliedSearch || selectedState);

  // Excluir o último item de uma página deixaria o usuário numa página vazia.
  useEffect(() => {
    if (status === "ready" && page > totalPages) {
      updateFilters({ page: totalPages });
    }
  }, [status, page, totalPages, updateFilters]);

  const clearFilters = () => {
    setSearchTerm("");
    updateFilters({ search: null, state: null, page: null });
  };

  const confirmDeletion = async () => {
    if (!companyPendingDeletion) return;

    setIsDeleting(true);
    try {
      await companyApi.deleteCompany(companyPendingDeletion.id);
      showToast({
        kind: "info",
        title: "Empresa excluída",
        text: `${companyPendingDeletion.name} foi removida da listagem.`,
      });
      setCompanyPendingDeletion(null);
      setReloadCount((current) => current + 1);
    } catch {
      showToast({
        kind: "error",
        title: "Não foi possível excluir",
        text: "Tente novamente em instantes.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const firstItemIndex = (page - 1) * pageSize + 1;
  const lastItemIndex = Math.min(page * pageSize, total);
  const rangeLabel =
    status === "ready" && total > 0
      ? `Mostrando ${firstItemIndex} a ${lastItemIndex} de ${total} resultados`
      : "";

  return (
    <main className="mx-auto w-full max-w-[1320px] p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-h2 font-semibold tracking-[-0.01em]">Empresas</h1>
          <p className="mt-1.5 text-body text-text-muted">
            Administre as empresas cadastradas, com endereço completo e validação
            de CNPJ.
          </p>
        </div>

        <Button onClick={() => navigate("/companies/new")}>
          <span aria-hidden="true" className="text-[17px] leading-none">
            +
          </span>
          Nova Empresa
        </Button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-white shadow-elevation-1">
        <CompanyFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedState={selectedState}
          onSelectedStateChange={(state) =>
            updateFilters({ state, page: null })
          }
          onClearFilters={clearFilters}
          rangeLabel={rangeLabel}
        />

        {status === "loading" && <TableSkeleton />}

        {status === "error" && (
          <ErrorState
            title="Não foi possível carregar as empresas"
            description="Falha de rede ao consultar GET /companies. Verifique a conexão e tente novamente."
            onRetry={() => setReloadCount((current) => current + 1)}
          />
        )}

        {status === "ready" && companies.length === 0 && (
          <EmptyState
            title={
              hasFilters
                ? "Nenhum resultado para os filtros aplicados"
                : "Nenhuma empresa cadastrada"
            }
            description={
              hasFilters
                ? "Ajuste a busca ou a UF selecionada."
                : "Comece cadastrando sua primeira empresa."
            }
            actionLabel={hasFilters ? undefined : "Cadastrar Empresa"}
            onAction={hasFilters ? undefined : () => navigate("/companies/new")}
          />
        )}

        {status === "ready" && companies.length > 0 && (
          <>
            <CompanyTable
              companies={companies}
              onEditCompany={(company) =>
                navigate(`/companies/${company.id}/edit`)
              }
              onDeleteCompany={setCompanyPendingDeletion}
            />
            <Pagination
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={(nextPage) => updateFilters({ page: nextPage })}
              onPageSizeChange={(nextPageSize) =>
                updateFilters({ pageSize: nextPageSize, page: null })
              }
            />
          </>
        )}
      </div>

      {companyPendingDeletion && (
        <ConfirmDeleteDialog
          companyName={companyPendingDeletion.name}
          isDeleting={isDeleting}
          onCancel={() => setCompanyPendingDeletion(null)}
          onConfirm={confirmDeletion}
        />
      )}
    </main>
  );
}
