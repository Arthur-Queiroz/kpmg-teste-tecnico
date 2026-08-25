import { Button } from "./Button";

export interface ErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="px-8 py-14 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex size-12 items-center justify-center rounded-pill bg-error/10 text-[22px] font-bold text-error"
      >
        !
      </span>

      <h3 className="mb-2 text-h3 font-semibold">{title}</h3>
      <p className="mx-auto mb-6 max-w-[46ch] text-small text-text-muted">
        {description}
      </p>

      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  );
}
