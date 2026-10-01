import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "dark-blue";
  size?: "md" | "sm";
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-2xl transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    md: "px-5 py-2 text-sm h-9",
    sm: "px-3 py-1.5 text-xs h-7",
  };

  const variantStyles = {
    primary: "bg-gray-900 hover:bg-gray-800 text-white border border-gray-900",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-200",
    danger: "bg-red-500 hover:bg-red-600 text-white border border-red-500",
    "dark-blue":
      "bg-blue-900 hover:bg-blue-800 text-white border border-blue-900",
  };

  return (
    <button
      type={type}
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
