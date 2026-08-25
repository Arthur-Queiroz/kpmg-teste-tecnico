import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="px-8 py-16 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-5 flex size-16 items-center justify-center rounded-pill bg-accent-subtle"
      >
        <span className="grid h-[26px] w-[22px] grid-rows-3 gap-0.5 rounded-[2px] border-2 border-primary p-[3px]">
          <span className="bg-primary" />
          <span className="bg-primary" />
          <span className="bg-primary" />
        </span>
      </span>

      <h3 className="mb-2 text-h3 font-semibold">{title}</h3>
      <p className="mx-auto mb-6 max-w-[42ch] text-small text-text-muted">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
