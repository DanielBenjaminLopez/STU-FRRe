import type { Clase } from "../api/horarios";
import { useHorarios } from "../hooks/useHorarios";
import HorariosScheduleGrid from "./HorariosScheduleGrid";

interface HorariosFullProps {
  onClose: () => void;
  items?: Clase[];
  loading?: boolean;
  error?: string | null;
}

export default function HorariosFull({
  onClose,
  items,
  loading,
  error,
}: HorariosFullProps) {
  const fetched = useHorarios(items === undefined);

  return (
    <HorariosScheduleGrid
      title="Horario"
      items={items ?? fetched.todas}
      loading={loading ?? fetched.loading}
      error={error !== undefined ? error : fetched.error}
      onClose={onClose}
      headerGradient="from-blue-300/50 to-blue-300/60"
    />
  );
}
