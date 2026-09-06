import React from "react";

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
}

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Buscar...",
  containerClassName = "w-64",
  className = "",
  id,
  disabled,
  ...props
}: SearchInputProps) {
  function handleClear() {
    onChange("");
    onClear?.();
  }

  return (
    <div className={`relative ${containerClassName}`}>
      <svg
        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-white border border-gray-200 rounded-xl pl-9 ${
          value ? "pr-8" : "pr-3"
        } py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer transition-colors"
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
