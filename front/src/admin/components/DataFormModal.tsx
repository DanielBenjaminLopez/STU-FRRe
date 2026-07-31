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
}

export default function DataFormModal({
  title,
  fields,
  initialData,
  onSubmit,
  onClose,
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
        } else if (field.type === "checkbox") {
          cleaned[field.name] = Boolean(val);
        } else if (
          field.type === "datetime-local" &&
          (val === "" || val == null)
        ) {
          cleaned[field.name] = null;
        } else {
          cleaned[field.name] = val ?? (field.type === "checkbox" ? false : "");
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
      <div className="bg-white rounded-4xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg p-1"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-8 pb-8 overflow-y-auto"
        >
          {fields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">
                {field.label}
                {field.required && (
                  <span className="text-red-400 ml-0.5">*</span>
                )}
              </span>

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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.name])}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-500">
                    {field.placeholder ?? "Sí"}
                  </span>
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
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
