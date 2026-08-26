import { Link } from "react-router-dom";

export function AppHeader() {
  return (
    <header className="flex h-16 items-center bg-primary px-8 text-white">
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
    </header>
  );
}
