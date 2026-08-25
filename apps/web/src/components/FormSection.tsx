import type { ReactNode } from "react";

export interface FormSectionProps {
  stepNumber: number;
  title: string;
  description: string;
  children: ReactNode;
}

export function FormSection({
  stepNumber,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-white shadow-elevation-1">
      <div className="flex items-center gap-3 border-b border-border bg-bg-subtle px-7 py-4.5">
        <span
          aria-hidden="true"
          className="flex size-[26px] flex-none items-center justify-center rounded-pill bg-primary text-[13px] font-bold text-white"
        >
          {stepNumber}
        </span>
        <div>
          <h2 className="text-[18px] leading-[26px] font-semibold">{title}</h2>
          <p className="text-[13px] leading-[18px] text-text-muted">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}
