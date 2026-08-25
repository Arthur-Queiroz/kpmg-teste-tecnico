import type { CompanyRecord } from "@kpmg/shared";

import { formatDate, getInitials } from "../lib/format";
import { maskCnpj } from "../lib/masks";

/** Mesma grade usada pelo cabeçalho, pelas linhas e pelo skeleton. */
export const COMPANY_TABLE_COLUMNS =
  "minmax(250px, 1.7fr) minmax(150px, 1fr) minmax(145px, 1.1fr) minmax(150px, 1fr) minmax(110px, 0.8fr) 96px";

const ICON_BUTTON_CLASS_NAME =
  "flex size-9 cursor-pointer items-center justify-center rounded-input border border-border bg-white transition-colors";

export interface CompanyTableProps {
  companies: CompanyRecord[];
  onEditCompany: (company: CompanyRecord) => void;
  onDeleteCompany: (company: CompanyRecord) => void;
}

export function CompanyTable({
  companies,
  onEditCompany,
  onDeleteCompany,
}: CompanyTableProps) {
  return (
    <div className="overflow-x-auto">
      <div
        style={{ gridTemplateColumns: COMPANY_TABLE_COLUMNS }}
        className="grid gap-6 border-b border-border bg-bg-subtle px-5 py-3 text-caption font-semibold tracking-[0.08em] text-text-muted uppercase"
      >
        <span>Nome</span>
        <span>CNPJ</span>
        <span>Nome Fantasia</span>
        <span>Cidade</span>
        <span>Criado em</span>
        <span className="text-right">Ações</span>
      </div>

      {companies.map((company, index) => (
        <div
          key={company.id}
          style={{ gridTemplateColumns: COMPANY_TABLE_COLUMNS }}
          className={`relative grid items-center gap-6 border-b border-border-subtle px-5 py-4.5 transition-colors before:absolute before:top-2.5 before:bottom-2.5 before:left-0 before:w-1 before:rounded-r-pill before:bg-accent before:content-[''] hover:bg-accent-subtle ${
            index % 2 === 1 ? "bg-bg-zebra" : "bg-white"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 flex-none items-center justify-center rounded-input bg-accent-surface text-[13px] font-bold text-primary"
            >
              {getInitials(company.name)}
            </span>
            <span className="truncate text-[15px] font-semibold">{company.name}</span>
          </div>

          <span className="text-small text-text-muted tabular-nums">
            {maskCnpj(company.cnpj)}
          </span>

          <span className="truncate text-[15px]">{company.tradeName}</span>

          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[15px]">{company.address.city}</span>
            <span className="ml-auto flex-none rounded-pill border border-accent-border bg-accent-subtle px-2 py-0.5 text-[11px] font-bold tracking-[0.04em] text-primary">
              {company.address.state}
            </span>
          </div>

          <span className="text-small text-text-muted tabular-nums">
            {formatDate(company.createdAt)}
          </span>

          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => onEditCompany(company)}
              title={`Editar ${company.name}`}
              aria-label={`Editar ${company.name}`}
              className={`${ICON_BUTTON_CLASS_NAME} text-primary hover:border-primary hover:bg-accent-subtle`}
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDeleteCompany(company)}
              title={`Excluir ${company.name}`}
              aria-label={`Excluir ${company.name}`}
              className={`${ICON_BUTTON_CLASS_NAME} text-error hover:border-error hover:bg-error/5`}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}
