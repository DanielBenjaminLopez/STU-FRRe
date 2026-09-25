import { useHorarios } from "../hooks/useHorarios";
import HorariosScheduleGrid from "./HorariosScheduleGrid";

export default function HorariosFull({ onClose }: { onClose: () => void }) {
  const { todas, loading, error } = useHorarios();

  return (
    <HorariosScheduleGrid
      title="Horario"
      items={todas}
      loading={loading}
      error={error}
      onClose={onClose}
      headerGradient="from-blue-300/50 to-blue-300/60"
    />
  );
}
