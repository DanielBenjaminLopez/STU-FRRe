export interface EventType {
  value: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  ring: string;
  mode: "day" | "range";
}

export const EVENT_TYPES: EventType[] = [
  {
    value: "inicio_cuatrimestre",
    label: "Inicio Cuatrimestre",
    color: "bg-emerald-400",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    ring: "ring-emerald-400",
    mode: "day",
  },
  {
    value: "fin_cuatrimestre",
    label: "Fin Cuatrimestre",
    color: "bg-emerald-400",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    ring: "ring-emerald-400",
    mode: "day",
  },
  {
    value: "mesa_examen",
    label: "Mesa de Examen",
    color: "bg-red-400",
    bg: "bg-red-50",
    border: "border-red-300",
    ring: "ring-red-400",
    mode: "range",
  },
  {
    value: "receso_invernal",
    label: "Receso Invernal",
    color: "bg-violet-400",
    bg: "bg-violet-50",
    border: "border-violet-300",
    ring: "ring-violet-400",
    mode: "range",
  },
  {
    value: "feriado",
    label: "Feriado",
    color: "bg-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-300",
    ring: "ring-amber-400",
    mode: "day",
  },
];
