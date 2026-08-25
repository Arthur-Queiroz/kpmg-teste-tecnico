import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const BASE_CLASS_NAME =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill px-6 py-3 text-[15px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const classNameByVariant: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-elevation-1 hover:bg-primary-dark",
  secondary: "border border-primary bg-transparent text-primary hover:bg-accent-subtle",
  danger: "bg-error text-white hover:bg-error-dark",
  ghost: "bg-transparent text-primary hover:bg-accent-subtle",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASS_NAME} ${classNameByVariant[variant]} ${className}`}
      {...buttonProps}
    />
  );
}
