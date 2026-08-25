import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Texto auxiliar abaixo do campo — some quando há erro. */
  hint?: ReactNode;
  isOptional?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  hint,
  isOptional = false,
  className = "",
  ref,
  ...inputProps
}: TextFieldProps) {
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const hasDescription = Boolean(error || hint);

  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-small font-medium text-text-muted">
        {label}
        {isOptional && <span className="font-normal text-text-faint"> (opcional)</span>}
      </label>

      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={hasDescription ? descriptionId : undefined}
        className={`h-11 w-full rounded-input border bg-white px-3.5 text-body text-text outline-none transition-colors focus:border-accent focus:ring-3 focus:ring-accent/15 ${
          error ? "border-error" : "border-border"
        }`}
        {...inputProps}
      />

      {hasDescription && (
        <span id={descriptionId} className="text-caption text-text-muted">
          {error ? <span className="text-error">{error}</span> : hint}
        </span>
      )}
    </div>
  );
}
