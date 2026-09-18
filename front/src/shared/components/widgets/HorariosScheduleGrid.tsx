import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Clase } from "../../api/horarios";
import { NIVELES } from "../../api/horariosAdmin";
import { ScheduleGridSkeleton } from "../ui/Skeleton";
import Select from "../ui/Select";
import {
  overlayContainerVariants,
  overlayPanelVariants,
} from "./overlayMotion";
import "./schedule.css";

interface HorariosScheduleGridProps {
  title: string;
  items: Clase[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  headerGradient?: string;
}

const DAYS = [
  { value: "lunes", label: "Lun" },
  { value: "martes", label: "Mar" },
  { value: "miercoles", label: "Mié" },
  { value: "jueves", label: "Jue" },
  { value: "viernes", label: "Vie" },
  { value: "sabado", label: "Sáb" },
];

const SEMESTERS = [
  { value: "primero", label: "Primer cuatrimestre" },
  { value: "segundo", label: "Segundo cuatrimestre" },
] as const;

const MIN_SCHEDULE_MINUTES = 8 * 60;

const CARD_COLORS = [
  "bg-cyan-100 border-cyan-200 text-cyan-800",
  "bg-pink-100 border-pink-200 text-pink-800",
  "bg-yellow-100 border-yellow-200 text-yellow-800",
  "bg-green-100 border-green-200 text-green-800",
  "bg-brown-100 border-brown-200 text-brown-800",
  "bg-purple-100 border-purple-200 text-purple-800",
];

const OPTION_COLORS = [
  "bg-blue-100 border-blue-200 hover:bg-blue-200/80",
  "bg-cyan-100 border-cyan-200 hover:bg-cyan-200/80",
  "bg-green-100 border-green-200 hover:bg-green-200/80",
  "bg-yellow-100 border-yellow-200 hover:bg-yellow-200/80",
  "bg-pink-100 border-pink-200 hover:bg-pink-200/80",
  "bg-purple-100 border-purple-200 hover:bg-purple-200/80",
];

function minutes(time: string): number {
  const [hours, mins] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + mins;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function levelLabel(value: string): string {
  return NIVELES.find((level) => level.value === value)?.label ?? value;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-full w-full"
      aria-hidden
    >
      <polyline points="3,8 6.5,11.5 13,4.5" />
    </svg>
  );
}

const ACCENT = {
  ring: "ring-blue-400/60",
  badge: "bg-blue-500 text-white",
};

function SelectionStep({
  title,
  selectedValue,
  options,
  onSelect,
  singleColumn = false,
}: {
  title: string;
  selectedValue: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  singleColumn?: boolean;
}) {
  const hasSelection = selectedValue !== "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex w-full flex-col gap-4"
    >
      {/* Step header */}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ring-2 ${
            hasSelection
              ? `${ACCENT.badge} ring-transparent`
              : `bg-white ${ACCENT.ring} text-blue-400`
          } transition-all duration-300`}
        >
          {hasSelection && (
            <span className="flex h-4 w-4 items-center justify-center">
              <CheckIcon />
            </span>
          )}
        </div>
        <p className="text-base font-semibold text-gray-800 leading-snug">
          {title}
        </p>
      </div>

      {/* Options grid */}
      <div
        className={`grid w-full gap-3 ${
          singleColumn
            ? "max-w-3xl grid-cols-1"
            : "max-w-5xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {options.map((option, index) => {
          const selected = option.value === selectedValue;
          const dimmed = hasSelection && !selected;
          const optionColor = OPTION_COLORS[index % OPTION_COLORS.length];

          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              whileHover={!selected ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.97 }}
              animate={{
                opacity: dimmed ? 0.45 : 1,
                filter: dimmed ? "grayscale(0.7)" : "grayscale(0)",
              }}
              transition={{ duration: 0.2 }}
              className={`relative min-h-16 rounded-2xl border p-4 text-center text-sm font-semibold shadow-sm transition-shadow ${
                selected
                  ? `${optionColor} ring-2 ${ACCENT.ring} shadow-md`
                  : `${optionColor} hover:shadow-md`
              }`}
            >
              {option.label}

              {/* Checkmark badge */}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full p-1 shadow-md ${ACCENT.badge}`}
                    aria-hidden
                  >
                    <CheckIcon />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}

function Schedule({ items }: { items: Clase[] }) {
  const times = useMemo(() => {
    const eventTimes = items.flatMap((item) => [
      formatTime(item.hora_inicio),
      formatTime(item.hora_fin),
    ]);
    if (eventTimes.length === 0) return [];

    const earliest = Math.min(...eventTimes.map(minutes));
    const latest = Math.max(...eventTimes.map(minutes));
    const scheduleEnd = Math.max(latest, earliest + MIN_SCHEDULE_MINUTES);
    const boundaries = new Set<string>(eventTimes);

    // Keep the real event boundaries and add hourly marks through the
    // minimum eight-hour window so the empty time is still visible.
    for (
      let time = Math.ceil(earliest / 60) * 60;
      time < scheduleEnd;
      time += 60
    ) {
      boundaries.add(formatMinutes(time));
    }
    boundaries.add(formatMinutes(scheduleEnd));

    return [...boundaries].sort((a, b) => minutes(a) - minutes(b));
  }, [items]);

  const colorBySubject = useMemo(() => {
    const colors = new Map<string, string>();
    let nextColor = 0;
    for (const item of items) {
      if (!colors.has(item.materia_nombre)) {
        colors.set(
          item.materia_nombre,
          CARD_COLORS[nextColor % CARD_COLORS.length],
        );
        nextColor += 1;
      }
    }
    return colors;
  }, [items]);

  if (times.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        No hay horarios para mostrar
      </div>
    );
  }

  const rows = times.length - 1;
  const gridRows = `48px repeat(${rows}, minmax(48px, 1fr)) 24px`;
  const gridColumns = `72px repeat(${DAYS.length}, minmax(0, 1fr))`;

  return (
    <div className="h-full w-full overflow-auto p-4 sm:p-8">
      <div
        id="schedule"
        className="mx-auto grid h-full min-w-[760px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/30"
        style={{ gridTemplateColumns: gridColumns, gridTemplateRows: gridRows }}
      >
        <div className="schedule-corner" />
        {DAYS.map((day) => (
          <div key={day.value} className="schedule-day-header">
            {day.label}
          </div>
        ))}

        {times.map((time, index) => (
          <div
            key={time}
            className="schedule-time-label"
            style={{ gridColumn: 1, gridRow: index + 2 }}
          >
            {time}
          </div>
        ))}

        {times
          .slice(0, -1)
          .flatMap((time, rowIndex) =>
            DAYS.map((day, dayIndex) => (
              <div
                key={`${time}-${day.value}`}
                className="schedule-cell"
                style={{ gridColumn: dayIndex + 2, gridRow: rowIndex + 2 }}
              />
            )),
          )}

        {items
          .filter(
            (item, index, arr) =>
              arr.findIndex(
                (other) =>
                  other.dia_semana === item.dia_semana &&
                  other.hora_inicio === item.hora_inicio &&
                  other.materia_nombre === item.materia_nombre,
              ) === index,
          )
          .map((item) => {
            const start = times.indexOf(formatTime(item.hora_inicio));
            const end = times.indexOf(formatTime(item.hora_fin));
            const day = DAYS.findIndex(
              (candidate) => candidate.value === item.dia_semana,
            );
            if (start < 0 || end <= start || day < 0) return null;

            return (
              <motion.div
                key={`${item.dia_semana}-${item.hora_inicio}-${item.materia_nombre}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="schedule-class-wrapper"
                style={{
                  gridColumn: day + 2,
                  gridRow: `${start + 2} / ${end + 2}`,
                }}
              >
                <div
                  className={`schedule-class-card ${colorBySubject.get(item.materia_nombre)}`}
                  title={`${item.materia_nombre}\n[${item.comision}] · ${item.carrera_codigo}\nAula: ${item.aula}`}
                >
                  <span className="truncate text-sm font-semibold leading-tight">
                    {item.materia_nombre}
                  </span>
                  <span className="text-[10px] leading-tight opacity-75">
                    {formatTime(item.hora_inicio)} - {formatTime(item.hora_fin)}
                  </span>
                  <span className="truncate text-[10px] leading-tight opacity-75">
                    [{item.comision}]
                  </span>
                  {item.aula && (
                    <span className="truncate text-[10px] leading-tight opacity-60">
                      {item.aula}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}

export default function HorariosScheduleGrid({
  title,
  items,
  loading,
  error,
  onClose,
  headerGradient = "from-blue-300/50 to-blue-300/60",
}: HorariosScheduleGridProps) {
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [selectedNivel, setSelectedNivel] = useState("");
  const [selectedComision, setSelectedComision] = useState("");

  const carreras = useMemo(
    () => [...new Set(items.map((item) => item.carrera_codigo))].sort(),
    [items],
  );

  const carreraNames = useMemo(
    () =>
      new Map(items.map((item) => [item.carrera_codigo, item.carrera_nombre])),
    [items],
  );

  const niveles = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter((item) => item.carrera_codigo === selectedCarrera)
            .map((item) => item.nivel),
        ),
      ].sort(
        (a, b) =>
          NIVELES.findIndex((level) => level.value === a) -
          NIVELES.findIndex((level) => level.value === b),
      ),
    [items, selectedCarrera],
  );

  const comisiones = useMemo(
    () =>
      [
        ...new Set(
          items
            .filter(
              (item) =>
                item.carrera_codigo === selectedCarrera &&
                item.nivel === selectedNivel,
            )
            .map((item) => item.comision),
        ),
      ].sort(),
    [items, selectedCarrera, selectedNivel],
  );

  const selectedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.carrera_codigo === selectedCarrera &&
          item.nivel === selectedNivel &&
          item.comision ===
            (selectedComision ||
              (comisiones.length === 1 ? comisiones[0] : "")),
      ),
    [items, selectedCarrera, selectedNivel, selectedComision, comisiones],
  );

  const effectiveComision =
    selectedComision || (comisiones.length === 1 ? comisiones[0] : "");

  const completeSelection =
    selectedCarrera !== "" && selectedNivel !== "" && effectiveComision !== "";

  return (
    <motion.div
      variants={overlayContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex h-full w-full flex-col items-center justify-center rounded-4xl"
    >
      <motion.div
        variants={overlayPanelVariants}
        className="flex h-full w-full flex-col overflow-hidden rounded-4xl border border-gray-200 bg-white/80 backdrop-blur-2xl"
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-linear-to-br p-6 sm:p-8 ${headerGradient}`}
        >
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={selectedCarrera}
              onChange={(value) => {
                setSelectedCarrera(value);
                setSelectedNivel("");
                setSelectedComision("");
              }}
              options={carreras.map((value) => ({
                value,
                label: value,
              }))}
              placeholder="Carrera"
              aria-label="Seleccionar carrera"
            />
            <Select
              value={selectedNivel}
              onChange={(value) => {
                setSelectedNivel(value);
                setSelectedComision("");
              }}
              options={niveles.map((value) => ({
                value,
                label: levelLabel(value),
              }))}
              placeholder="Nivel"
              disabled={!selectedCarrera}
              aria-label="Seleccionar nivel"
            />
            <Select
              value={effectiveComision}
              onChange={setSelectedComision}
              options={comisiones.map((value) => ({ value, label: value }))}
              placeholder="Comisión"
              disabled={!selectedNivel}
              aria-label="Seleccionar comisión"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 bg-white/50 px-6 py-1 text-sm font-medium shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading && <ScheduleGridSkeleton />}
          {error && (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
          {!loading && !error && !completeSelection && (
            <div className="flex h-full flex-col items-start justify-start gap-8 overflow-auto p-6 sm:p-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-0">
                {/* Step 1: Carrera */}
                <div className="flex gap-4">
                  {/* Connector column */}
                  <div className="flex w-8 shrink-0 flex-col items-center">
                    <div className="mt-8 h-full w-0.5 bg-linear-to-b from-blue-200 to-blue-300 rounded-full" />
                  </div>
                  <div className="flex-1 pb-8">
                    <SelectionStep
                      title="Seleccioná una carrera"
                      selectedValue={selectedCarrera}
                      options={carreras.map((value) => ({
                        value,
                        label: carreraNames.get(value) || value,
                      }))}
                      onSelect={(value) => {
                        setSelectedCarrera(value);
                        setSelectedNivel("");
                        setSelectedComision("");
                      }}
                      singleColumn
                    />
                  </div>
                </div>

                {/* Step 2: Nivel */}
                <AnimatePresence>
                  {selectedCarrera && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-4">
                        <div className="flex w-8 shrink-0 flex-col items-center">
                          <div className="mt-8 h-full w-0.5 bg-blue-300 rounded-full" />
                        </div>
                        <div className="flex-1 pb-8">
                          <SelectionStep
                            title="Seleccioná un nivel"
                            selectedValue={selectedNivel}
                            options={niveles.map((value) => ({
                              value,
                              label: levelLabel(value),
                            }))}
                            onSelect={(value) => {
                              setSelectedNivel(value);
                              setSelectedComision("");
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step 3: Comisión */}
                <AnimatePresence>
                  {selectedCarrera && selectedNivel && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-4">
                        <div className="flex w-8 shrink-0 flex-col items-center" />
                        <div className="flex-1">
                          <SelectionStep
                            title="Seleccioná una comisión"
                            selectedValue={effectiveComision}
                            options={comisiones.map((value) => ({
                              value,
                              label: value,
                            }))}
                            onSelect={setSelectedComision}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          {!loading && !error && completeSelection && (
            <div className="grid h-full grid-cols-1 grid-rows-2 gap-4 overflow-auto p-4 sm:p-8">
              {SEMESTERS.map((semester) => {
                const semesterItems = selectedItems.filter(
                  (item) =>
                    item.modalidad === "anual" ||
                    item.modalidad === "" ||
                    (item.modalidad === "cuatrimestral" &&
                      item.cuatrimestre === semester.value),
                );

                return (
                  <section
                    key={semester.value}
                    className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/30"
                  >
                    <h2 className="shrink-0 border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-600 sm:text-base">
                      {semester.label}
                    </h2>
                    <div className="min-h-0 flex-1">
                      <Schedule items={semesterItems} />
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
