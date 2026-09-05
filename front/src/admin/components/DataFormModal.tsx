import { useEffect, useState } from "react";

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "datetime-local"
    | "time"
    | "date"
    | "checkbox";
  required?: boolean;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  readOnly?: boolean;
  defaultValue?: unknown;
  min?: number;
  max?: number;
}

interface DataFormModalProps {
  title: string;
  fields: FormField[];
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  onChange?: (
    name: string,
    value: unknown,
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  ) => void;
}

export default function DataFormModal({
  title,
  fields,
  initialData,
  onSubmit,
  onClose,
  onChange,
}: DataFormModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(
    () =>
      initialData ??
      Object.fromEntries(
        fields.map((f) => [
          f.name,
          f.defaultValue ?? (f.type === "checkbox" ? false : ""),
        ]),
      ),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function handleChange(name: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (onChange) {
      onChange(name, value, setFormData);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleaned: Record<string, unknown> = {};
      for (const field of fields) {
        const val = formData[field.name];
        if (field.type === "number" && val !== "" && val != null) {
          cleaned[field.name] = Number(val);
        } else if (
          field.type === "select" &&
          field.options &&
          field.options.length > 0 &&
          typeof field.options[0].value === "number" &&
          val !== "" &&
          val != null
        ) {
          cleaned[field.name] = Number(val);
        } else if (field.type === "checkbox") {
          cleaned[field.name] = Boolean(val);
        } else if (
          field.type === "datetime-local" &&
          (val === "" || val == null)
        ) {
          cleaned[field.name] = null;
        } else {
          cleaned[field.name] = val ?? "";
        }
      }
      await onSubmit(cleaned);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar los datos",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-4xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-8 pt-8 pb-3">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-8 pb-8 overflow-y-auto"
        >
          {fields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              {field.type !== "checkbox" && (
                <span className="font-medium text-gray-700">
                  {field.label}
                  {field.required && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                </span>
              )}

              {field.type === "select" ? (
                <select
                  value={String(formData[field.name] ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">
                    {field.placeholder ?? "Seleccionar..."}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={String(formData[field.name] ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly}
                  rows={4}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              ) : field.type === "checkbox" ? (
                <div className="flex items-center justify-between py-1 select-none">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 text-sm">
                      {field.placeholder || field.label || "Activo"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formData[field.name]
                        ? "Visible y habilitado"
                        : "Inactivo y deshabilitado"}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(formData[field.name])}
                    onClick={() =>
                      handleChange(field.name, !formData[field.name])
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${
                      formData[field.name]
                        ? "bg-gray-900"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formData[field.name]
                          ? "translate-x-5"
                          : "translate-x-0"
                      }`}
                    />
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={Boolean(formData[field.name])}
                      onChange={(e) =>
                        handleChange(field.name, e.target.checked)
                      }
                      aria-label={field.placeholder || field.label}
                    />
                  </button>
                </div>
              ) : (
                <input
                  type={field.type}
                  value={String(formData[field.name] ?? "")}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly}
                  min={field.min}
                  max={field.max}
                  className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              )}
            </label>
          ))}

          {error && <span className="text-red-500 text-sm">{error}</span>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 border border-gray-200 rounded-2xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 border border-gray-900 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
