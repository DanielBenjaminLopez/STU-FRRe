import { useCallback, useEffect, useState } from "react";
import AnnualCalendarGrid from "../components/calendario/AnnualCalendarGrid";
import EventTypeSelector from "../components/calendario/EventTypeSelector";
import EventSummary from "../components/calendario/EventSummary";
import SaveConfirmationModal from "../components/calendario/SaveConfirmationModal";
import {
  fetchEventosCalendario,
  bulkSaveCalendario,
} from "../../shared/api/calendarioAdmin";

interface PendingEvent {
  titulo: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  todo_el_dia: boolean;
  color: string;
  descripcion: string;
}

const TIPO_LABELS: Record<string, string> = {
  inicio_cuatrimestre: "Inicio de Cuatrimestre",
  fin_cuatrimestre: "Fin de Cuatrimestre",
  mesa_examen: "Mesa de Examen",
  receso_invernal: "Receso Invernal",
  feriado: "Feriado",
};

function todayYear() {
  return new Date().getFullYear();
}

function fmtDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

export default function CalendarioAdminPage() {
  const [year, setYear] = useState(todayYear());
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEventosCalendario();
        if (!mounted) return;
        const yearEvents = data.filter((e) => {
          const y = parseInt(e.fecha_inicio.split("-")[0], 10);
          return y === year;
        });
        const loaded: PendingEvent[] = yearEvents.map((e) => ({
          titulo: e.titulo,
          tipo: e.tipo,
          fecha_inicio: e.fecha_inicio,
          fecha_fin: e.fecha_fin,
          todo_el_dia: e.todo_el_dia,
          color: e.color,
          descripcion: e.descripcion,
        }));
        setPending(loaded);
      } catch {
        if (mounted) setError("Error al cargar el calendario");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [year]);

  const toggleDay = useCallback(
    (date: string) => {
      if (!selectedTipo) return;
      const existing = pending.find(
        (e) =>
          e.tipo === selectedTipo && e.fecha_inicio === date && !e.fecha_fin,
      );
      if (existing) {
        setPending((prev) => prev.filter((e) => e !== existing));
      } else {
        setPending((prev) => [
          ...prev.filter(
            (e) => !(e.tipo === selectedTipo && e.fecha_inicio === date),
          ),
          {
            titulo: `${TIPO_LABELS[selectedTipo] || selectedTipo} - ${fmtDate(date)}`,
            tipo: selectedTipo,
            fecha_inicio: date,
            fecha_fin: null,
            todo_el_dia: true,
            color: "",
            descripcion: "",
          },
        ]);
      }
    },
    [selectedTipo, pending],
  );

  const handleRangeSelect = useCallback(
    (from: string, to: string) => {
      if (!selectedTipo) return;
      setPending((prev) => {
        const exists = prev.some(
          (e) =>
            e.tipo === selectedTipo &&
            e.fecha_inicio === from &&
            e.fecha_fin === to,
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            titulo: `${TIPO_LABELS[selectedTipo] || selectedTipo} - ${fmtDate(from)} a ${fmtDate(to)}`,
            tipo: selectedTipo,
            fecha_inicio: from,
            fecha_fin: to,
            todo_el_dia: true,
            color: "",
            descripcion: "",
          },
        ];
      });
    },
    [selectedTipo],
  );

  const deleteEvent = useCallback((index: number) => {
    setPending((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      await bulkSaveCalendario(pending, year);
      setSuccess(`Se guardaron ${pending.length} eventos del año ${year}.`);
      setShowConfirm(false);
    } catch {
      setError("Error al guardar los eventos.");
    } finally {
      setSaving(false);
    }
  }, [pending, year]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Calendario Académico
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Marcá los días y rangos en el calendario para definir el calendario
            académico del año.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="border border-gray-200 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => pending.length > 0 && setShowConfirm(true)}
            disabled={pending.length === 0 || saving}
            className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando..." : `Guardar (${pending.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-6">
        <div className="w-56 shrink-0 flex flex-col">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Eventos ({pending.length})
          </p>
          <EventSummary events={pending} onDeleteEvent={deleteEvent} />
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
          <EventTypeSelector
            selected={selectedTipo}
            onSelect={setSelectedTipo}
          />
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Cargando calendario...
            </div>
          ) : (
            <AnnualCalendarGrid
              year={year}
              events={pending}
              selectedTipo={selectedTipo}
              onToggleDay={toggleDay}
              onRangeSelect={handleRangeSelect}
            />
          )}
        </div>
      </div>

      <SaveConfirmationModal
        open={showConfirm}
        eventCount={pending.length}
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
