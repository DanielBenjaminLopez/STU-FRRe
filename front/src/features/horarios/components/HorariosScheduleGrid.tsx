import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Clase } from "../api/horarios";
import { NIVELES } from "../api/horariosAdmin";
import { ScheduleGridSkeleton } from "../../../shared/components/ui/Skeleton";
import {
  overlayContainerVariants,
  overlayPanelVariants,
} from "../../widgets/overlayMotion";
import "../schedule.css";

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

    return [...new Set<string>(eventTimes)].sort(
      (a, b) => minutes(a) - minutes(b),
    );
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

  const deduplicatedItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => (b.aula ? 1 : 0) - (a.aula ? 1 : 0))
        .filter(
          (item, index, arr) =>
            arr.findIndex(
              (other) =>
                other.dia_semana === item.dia_semana &&
                other.hora_inicio === item.hora_inicio &&
                other.materia_nombre === item.materia_nombre,
            ) === index,
        ),
    [items],
  );

  const visibleDays = useMemo(
    () =>
      DAYS.filter(
        (day) =>
          day.value !== "sabado" ||
          deduplicatedItems.some((item) => item.dia_semana === "sabado"),
      ),
    [deduplicatedItems],
  );

  const layoutByDay = useMemo(() => {
    type PositionedItem = {
      item: Clase;
      lane: number;
      clusterCols: number;
    };

    const dayLayouts: {
      tracks: number;
      startCol: number;
      positioned: PositionedItem[];
    }[] = [];

    let currentStartCol = 2;

    for (const day of visibleDays) {
      const dayItems = deduplicatedItems
        .filter((item) => item.dia_semana === day.value)
        .filter((item) => minutes(item.hora_fin) > minutes(item.hora_inicio))
        .sort(
          (a, b) =>
            minutes(a.hora_inicio) - minutes(b.hora_inicio) ||
            minutes(b.hora_fin) - minutes(a.hora_fin),
        );

      // Agrupar clases que se solapan temporalmente en clusters
      const clusters: Clase[][] = [];
      let currentCluster: Clase[] = [];
      let clusterMaxEnd = -1;

      for (const item of dayItems) {
        const start = minutes(item.hora_inicio);
        const end = minutes(item.hora_fin);
        if (currentCluster.length === 0 || start < clusterMaxEnd) {
          currentCluster.push(item);
          clusterMaxEnd = Math.max(clusterMaxEnd, end);
        } else {
          clusters.push(currentCluster);
          currentCluster = [item];
          clusterMaxEnd = end;
        }
      }
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }

      const positioned: PositionedItem[] = [];
      let maxTracksForDay = 1;

      for (const cluster of clusters) {
        const laneEnds: number[] = [];
        const clusterAssignments: { item: Clase; lane: number }[] = [];

        for (const item of cluster) {
          const start = minutes(item.hora_inicio);
          const end = minutes(item.hora_fin);
          let assignedLane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
          if (assignedLane === -1) {
            assignedLane = laneEnds.length;
            laneEnds.push(end);
          } else {
            laneEnds[assignedLane] = end;
          }
          clusterAssignments.push({ item, lane: assignedLane });
        }

        const clusterCols = Math.max(1, laneEnds.length);
        maxTracksForDay = Math.max(maxTracksForDay, clusterCols);

        for (const assignment of clusterAssignments) {
          positioned.push({
            item: assignment.item,
            lane: assignment.lane,
            clusterCols,
          });
        }
      }

      dayLayouts.push({
        tracks: maxTracksForDay,
        startCol: currentStartCol,
        positioned,
      });

      currentStartCol += maxTracksForDay;
    }

    return {
      dayLayouts,
      totalTracks: currentStartCol - 2,
    };
  }, [deduplicatedItems, visibleDays]);

  if (times.length < 2) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        No hay horarios para mostrar
      </div>
    );
  }

  // La geometría va en `em` contra el `font-size` de #schedule, que es
  // var(--text-base): 1rem (16px) en el admin y 2rem (32px) dentro de
  // .totem-scale-stage en el tótem 4K. Cada fila mide en `em` de forma
  // proporcional a su duración (aprox. 1em cada 16 min), y usa `auto` como
  // máximo para expandirse solo cuando el nombre de una materia lo requiera.
  const rowTracks = times
    .slice(0, -1)
    .map((time, idx) => {
      const startMin = minutes(time);
      const endMin = minutes(times[idx + 1]);
      const delta = Math.max(5, endMin - startMin);
      const hasActiveClass = deduplicatedItems.some(
        (item) =>
          minutes(item.hora_inicio) < endMin &&
          minutes(item.hora_fin) > startMin,
      );
      const effectiveMinutes = hasActiveClass ? delta : Math.min(delta, 20);
      const heightEm = Math.max(
        delta <= 15 ? 1.5 : 2.75,
        Number((effectiveMinutes / 16).toFixed(2)),
      );
      return `minmax(${heightEm}em, auto)`;
    })
    .join(" ");

  const gridRows = `3em ${rowTracks} 2.25em`;
  const gridColumns = `4.5em repeat(${layoutByDay.totalTracks}, minmax(0, 1fr))`;

  return (
    <div className="w-full p-4 sm:p-8">
      <div
        id="schedule"
        className="mx-auto grid w-full overflow-hidden rounded-2xl border border-gray-200 bg-white/30"
        style={{ gridTemplateColumns: gridColumns, gridTemplateRows: gridRows }}
      >
        <div className="schedule-corner" />
        {visibleDays.map((day, dayIndex) => {
          const { startCol, tracks } = layoutByDay.dayLayouts[dayIndex];
          return (
            <div
              key={day.value}
              className="schedule-day-header"
              style={{ gridColumn: `${startCol} / span ${tracks}`, gridRow: 1 }}
            >
              {day.label}
            </div>
          );
        })}

        {times.map((time, index) => (
          <div
            key={time}
            className="schedule-time-label"
            style={{ gridColumn: 1, gridRow: index + 2 }}
          >
            {time}
          </div>
        ))}

        {times.slice(0, -1).flatMap((time, rowIndex) =>
          visibleDays.map((day, dayIndex) => {
            const { startCol, tracks } = layoutByDay.dayLayouts[dayIndex];
            return (
              <div
                key={`${time}-${day.value}`}
                className="schedule-cell"
                style={{
                  gridColumn: `${startCol} / span ${tracks}`,
                  gridRow: rowIndex + 2,
                }}
              />
            );
          }),
        )}

        {layoutByDay.dayLayouts.flatMap(({ startCol, tracks, positioned }) =>
          positioned.map(({ item, lane, clusterCols }) => {
            const start = times.indexOf(formatTime(item.hora_inicio));
            const end = times.indexOf(formatTime(item.hora_fin));
            if (start < 0 || end <= start) return null;

            const span =
              clusterCols === 1
                ? tracks
                : Math.max(1, Math.floor(tracks / clusterCols));
            const colStart =
              clusterCols === 1 ? startCol : startCol + lane * span;

            return (
              <motion.div
                key={`${item.dia_semana}-${item.hora_inicio}-${item.materia_nombre}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="schedule-class-wrapper"
                style={{
                  gridColumn: `${colStart} / span ${span}`,
                  gridRow: `${start + 2} / ${end + 2}`,
                }}
              >
                <div
                  className={`schedule-class-card ${colorBySubject.get(item.materia_nombre)}`}
                  title={`${item.materia_nombre}\n[${item.comision}] · ${item.carrera_codigo}\nAula: ${item.aula}`}
                >
                  <span className="shrink-0 hyphens-auto break-words text-lg font-semibold leading-snug">
                    {item.materia_nombre}
                  </span>
                  <span className="shrink-0 text-sm font-medium leading-snug opacity-75">
                    {formatTime(item.hora_inicio)} - {formatTime(item.hora_fin)}
                  </span>
                  {item.aula && (
                    <span className="schedule-class-aula mt-0.5 inline-block max-w-full shrink-0 break-words rounded-lg bg-white/60 px-2 py-0.5 text-sm font-semibold leading-snug">
                      {item.aula}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function getNivelesForCarrera(items: Clase[], carrera: string): string[] {
  return [
    ...new Set(
      items
        .filter((item) => item.carrera_codigo === carrera)
        .map((item) => item.nivel),
    ),
  ].sort(
    (a, b) =>
      NIVELES.findIndex((level) => level.value === a) -
      NIVELES.findIndex((level) => level.value === b),
  );
}

function getComisionesForNivel(
  items: Clase[],
  carrera: string,
  nivel: string,
): string[] {
  return [
    ...new Set(
      items
        .filter(
          (item) => item.carrera_codigo === carrera && item.nivel === nivel,
        )
        .map((item) => item.comision),
    ),
  ].sort();
}

function SegmentedControlRow({
  label,
  layoutId,
  headerGradient,
  value,
  options,
  onChange,
}: {
  label: string;
  layoutId: string;
  headerGradient: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-right text-sm font-medium text-gray-500">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-1 rounded-xl border border-gray-200 bg-white/60 p-1">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`relative flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-center text-sm transition-colors focus:outline-none ${
                active
                  ? "font-semibold text-blue-950"
                  : "font-medium text-gray-600 hover:bg-white/60 hover:text-gray-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 32,
                  }}
                  className={`absolute inset-0 rounded-lg border border-blue-300/60 bg-linear-to-br shadow-xs ${headerGradient}`}
                  aria-hidden
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
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
    () => getNivelesForCarrera(items, selectedCarrera),
    [items, selectedCarrera],
  );

  const comisiones = useMemo(
    () => getComisionesForNivel(items, selectedCarrera, selectedNivel),
    [items, selectedCarrera, selectedNivel],
  );

  const effectiveComision =
    selectedComision || (comisiones.length === 1 ? comisiones[0] : "");

  const selectedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.carrera_codigo === selectedCarrera &&
          item.nivel === selectedNivel &&
          item.comision === effectiveComision,
      ),
    [items, selectedCarrera, selectedNivel, effectiveComision],
  );

  const completeSelection =
    selectedCarrera !== "" && selectedNivel !== "" && effectiveComision !== "";

  const handleQuickCarreraChange = (carrera: string) => {
    const nextNiveles = getNivelesForCarrera(items, carrera);
    const nextNivel = nextNiveles.includes(selectedNivel)
      ? selectedNivel
      : (nextNiveles[0] ?? "");
    const nextComisiones = getComisionesForNivel(items, carrera, nextNivel);
    const nextComision = nextComisiones.includes(effectiveComision)
      ? effectiveComision
      : (nextComisiones[0] ?? "");

    setSelectedCarrera(carrera);
    setSelectedNivel(nextNivel);
    setSelectedComision(nextComision);
  };

  const handleQuickNivelChange = (nivel: string) => {
    const nextComisiones = getComisionesForNivel(items, selectedCarrera, nivel);
    const nextComision = nextComisiones.includes(effectiveComision)
      ? effectiveComision
      : (nextComisiones[0] ?? "");

    setSelectedNivel(nivel);
    setSelectedComision(nextComision);
  };

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
            <div className="flex h-full w-full flex-col gap-4 overflow-auto p-4 sm:p-8">
              <section className="my-auto flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/30">
                <h2 className="shrink-0 border-b border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-600 sm:text-base">
                  Horarios de cursado
                </h2>
                <div>
                  <Schedule items={selectedItems} />
                </div>
              </section>

              {/* Menú inferior estilo Apple Segmented Control */}
              <section className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/30">
                <span className="shrink-0 border-b border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-gray-600">
                  Cambiar comisión
                </span>
                <div className="flex flex-col gap-2.5 p-4">
                  <SegmentedControlRow
                    label="Carrera"
                    layoutId="schedule-seg-carrera"
                    headerGradient={headerGradient}
                    value={selectedCarrera}
                    options={carreras.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={handleQuickCarreraChange}
                  />
                  <SegmentedControlRow
                    label="Nivel"
                    layoutId="schedule-seg-nivel"
                    headerGradient={headerGradient}
                    value={selectedNivel}
                    options={niveles.map((value) => ({
                      value,
                      label: levelLabel(value),
                    }))}
                    onChange={handleQuickNivelChange}
                  />
                  <SegmentedControlRow
                    label="Comisión"
                    layoutId="schedule-seg-comision"
                    headerGradient={headerGradient}
                    value={effectiveComision}
                    options={comisiones.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={setSelectedComision}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
