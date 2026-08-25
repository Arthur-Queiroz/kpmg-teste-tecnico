import { Link, useMatch } from "react-router-dom";

export function AppHeader() {
  const isNewCompanyRoute = useMatch("/companies/new");
  const isEditCompanyRoute = useMatch("/companies/:companyId/edit");

  const breadcrumbLeaf = isNewCompanyRoute
    ? "Novo cadastro"
    : isEditCompanyRoute
      ? "Editar"
      : null;

  return (
    <header className="flex h-16 items-center gap-6 bg-primary px-8 text-white">
      <Link to="/" className="flex items-center gap-3">
        <span aria-hidden="true" className="flex gap-[3px]">
          <span className="h-5 w-[5px] bg-accent" />
          <span className="h-5 w-[5px] bg-accent" />
          <span className="h-5 w-[5px] bg-accent" />
          <span className="h-5 w-[5px] bg-accent" />
        </span>
        <span className="text-small font-bold tracking-[0.12em]">
          CADASTRO DE EMPRESAS
        </span>
      </Link>

      <nav
        aria-label="Trilha de navegação"
        className="flex items-center gap-2 text-small text-white/60"
      >
        <span aria-hidden="true" className="text-white/30">
          |
        </span>
        <Link to="/" className="hover:text-white">
          Empresas
        </Link>
        {breadcrumbLeaf && (
          <>
            <span aria-hidden="true" className="text-white/30">
              /
            </span>
            <span className="font-semibold text-white">{breadcrumbLeaf}</span>
          </>
        )}
      </nav>
    </header>
  );
}
