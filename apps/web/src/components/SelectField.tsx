import { useId, type Ref, type SelectHTMLAttributes } from "react";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function SelectField({
  label,
  error,
  className = "",
  children,
  ref,
  ...selectProps
}: SelectFieldProps) {
  const selectId = useId();
  const descriptionId = `${selectId}-description`;

  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={selectId} className="text-small font-medium text-text-muted">
        {label}
      </label>

      <select
        id={selectId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? descriptionId : undefined}
        className={`h-11 w-full cursor-pointer rounded-input border bg-white px-3 text-body text-text outline-none transition-colors focus:border-accent focus:ring-3 focus:ring-accent/15 ${
          error ? "border-error" : "border-border"
        }`}
        {...selectProps}
      >
        {children}
      </select>

      {error && (
        <span id={descriptionId} className="text-caption text-error">
          {error}
        </span>
      )}
    </div>
  );
}
