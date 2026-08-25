import { BRAZILIAN_STATES } from "@kpmg/shared";

export interface CompanyFiltersProps {
  searchTerm: string;
  onSearchTermChange: (searchTerm: string) => void;
  selectedState: string;
  onSelectedStateChange: (state: string) => void;
  onClearFilters: () => void;
  rangeLabel: string;
}

export function CompanyFilters({
  searchTerm,
  onSearchTermChange,
  selectedState,
  onSelectedStateChange,
  onClearFilters,
  rangeLabel,
}: CompanyFiltersProps) {
  const hasFilters = Boolean(searchTerm || selectedState);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
      <div className="relative max-w-[380px] flex-[1_1_300px]">
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted"
        >
          ⌕
        </span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Buscar por nome, nome fantasia ou CNPJ..."
          aria-label="Buscar empresas"
          className="h-10 w-full rounded-input border border-border bg-white pr-3.5 pl-8 text-[15px] outline-none transition-colors focus:border-accent focus:ring-3 focus:ring-accent/15"
        />
      </div>

      <select
        value={selectedState}
        onChange={(event) => onSelectedStateChange(event.target.value)}
        aria-label="Filtrar por UF"
        className={`h-10 min-w-[168px] cursor-pointer rounded-input border bg-white px-3 text-[15px] outline-none transition-colors focus:border-accent focus:ring-3 focus:ring-accent/15 ${
          selectedState ? "border-primary" : "border-border"
        }`}
      >
        <option value="">Todas as UFs</option>
        {BRAZILIAN_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="h-10 cursor-pointer rounded-input border border-border px-4 text-small font-semibold text-primary transition-colors hover:border-primary hover:bg-accent-subtle"
        >
          Limpar filtros
        </button>
      )}

      <span className="ml-auto text-small text-text-muted">{rangeLabel}</span>
    </div>
  );
}
