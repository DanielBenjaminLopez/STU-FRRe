import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectColorVariant = "blue" | "green" | "gray";
export type SelectAlign = "left" | "center" | "right";

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  role?: string;
  align?: SelectAlign;
  colorVariant?: SelectColorVariant;
  "aria-label"?: string;
}

const variantStyles: Record<
  SelectColorVariant,
  {
    triggerOpen: string;
    triggerClosed: string;
    selectedOption: string;
    unselectedOption: string;
  }
> = {
  blue: {
    triggerOpen: "bg-white/70 text-black border-gray-200",
    triggerClosed: "bg-white/50 hover:bg-white/70 text-black border-gray-200",
    selectedOption: "bg-blue-50/90 text-blue-900 font-semibold",
    unselectedOption:
      "text-gray-700 hover:bg-gray-100/80 active:bg-gray-200/60 font-medium",
  },
  green: {
    triggerOpen: "bg-white/70 text-black border-gray-200",
    triggerClosed: "bg-white/50 hover:bg-white/70 text-black border-gray-200",
    selectedOption: "bg-green-100/80 text-green-900 font-semibold",
    unselectedOption:
      "text-gray-700 hover:bg-green-50/80 active:bg-green-100/60 font-medium",
  },
  gray: {
    triggerOpen: "bg-gray-200 text-gray-700 border-gray-200",
    triggerClosed:
      "bg-gray-100 hover:bg-gray-200/80 text-gray-700 border-gray-200",
    selectedOption: "bg-gray-100 text-gray-900 font-semibold",
    unselectedOption:
      "text-gray-600 hover:bg-gray-50 active:bg-gray-100/80 font-medium",
  },
};

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  disabled = false,
  role,
  align = "center",
  colorVariant = "blue",
  "aria-label": ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : (placeholder ?? "Seleccionar...");

  const activeVariant = variantStyles[colorVariant] ?? variantStyles.blue;
  const xOffset = align === "center" ? "-50%" : 0;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      <button
        type="button"
        role={role}
        disabled={disabled}
        aria-label={ariaLabel || displayLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center justify-between gap-2.5 px-3.5 py-1 rounded-2xl text-sm font-medium leading-5 border transition-all cursor-pointer shadow-xs active:bg-gray-100/70 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? activeVariant.triggerOpen : activeVariant.triggerClosed
        } ${triggerClassName}`}
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-gray-600" : "group-hover:text-gray-600"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4, x: xOffset }}
            animate={{ opacity: 1, scale: 1, y: 0, x: xOffset }}
            exit={{ opacity: 0, scale: 0.96, y: -4, x: xOffset }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-1.5 z-50 min-w-full sm:min-w-[170px] bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-2xl shadow-xl shadow-black/10 p-1.5 overflow-hidden origin-top ${
              align === "center"
                ? "left-1/2"
                : align === "right"
                  ? "right-0"
                  : "left-0"
            } ${dropdownClassName}`}
          >
            <div
              role="listbox"
              className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5"
            >
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer text-left ${
                      isSelected
                        ? activeVariant.selectedOption
                        : activeVariant.unselectedOption
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
