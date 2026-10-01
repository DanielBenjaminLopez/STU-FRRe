import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface VerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export default function VerButton({
  children = "Ver horario completo",
  className = "",
  type = "button",
  ...props
}: VerButtonProps) {
  return (
    <button
      type={type}
      className={`shadow-xs text-sm font-medium leading-5 bg-white/50 hover:bg-white/70 active:bg-white/80 border border-gray-200 px-8 py-1 rounded-2xl cursor-pointer transition-all text-black select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
