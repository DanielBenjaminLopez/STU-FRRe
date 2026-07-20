import FullCalendar from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/breezy";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import listPlugin from "@fullcalendar/react/list";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/breezy/theme.css";
import "@fullcalendar/react/themes/breezy/palettes/amber.css";

import { useHorarios } from "../../hooks/useHorarios";
import type { Clase } from "../../api/horarios";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0,
};

const CARRERA_COLORS: Record<string, string> = {
  ISI: "#06b6d4",
  IEM: "#a16207",
  IQ: "#16a34a",
  LAR: "#ca8a04",
};

function claseToDate(clase: Clase): { start: string; end: string } {
  const now = new Date();
  const currentDay = now.getDay();
  const targetDay = DAY_NAME_TO_INDEX[clase.dia_semana] ?? 0;

  const diff = targetDay - currentDay;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `${yyyy}-${mm}-${dd}`;

  return {
    start: `${prefix}T${clase.hora_inicio}:00`,
    end: `${prefix}T${clase.hora_fin}:00`,
  };
}

function clasesToEvents(clases: Clase[]) {
  return clases.map((clase) => {
    const { start, end } = claseToDate(clase);
    return {
      id: String(clase.id),
      title: `${clase.carrera_codigo} - ${clase.materia_nombre} [${clase.comision}] - Aula ${clase.aula}`,
      start,
      end,
      color: CARRERA_COLORS[clase.carrera_codigo] ?? "#6b7280",
    };
  });
}

export default function HorariosFull({ onClose }: { onClose: () => void }) {
  const { todas, loading, error } = useHorarios();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center w-full h-full bg-black/50 p-8">
      <div className="flex flex-col bg-white w-full h-full overflow-hidden rounded-4xl">
        <div className="flex items-center justify-between p-16">
          <h1 className="text-3xl font-semibold">Horario completo</h1>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-normal underline"
          >
            Cerrar
          </button>
        </div>

        <div className="grow px-16 pb-16 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">Cargando horarios...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="border border-gray-200 rounded-4xl p-4 h-full">
              <FullCalendar
                colorScheme="light"
                plugins={[
                  themePlugin,
                  timeGridPlugin,
                  dayGridPlugin,
                  listPlugin,
                ]}
                initialView="timeGridDay"
                events={clasesToEvents(todas)}
                allDaySlot={false}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                hiddenDays={[0]}
                locale="es"
                height="100%"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "timeGridDay,listWeek",
                }}
                buttons={{
                  today: { text: "Hoy" },
                  timeGridWeek: { text: "Semana" },
                  timeGridDay: { text: "Día" },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
