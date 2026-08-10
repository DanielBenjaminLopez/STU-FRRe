import { useHorarios } from "../../hooks/useHorarios";
import ScheduleGrid from "./ScheduleGrid";

export default function HorariosFull({ onClose }: { onClose: () => void }) {
  const { todas, loading, error } = useHorarios();

  return (
    <ScheduleGrid
      title="Horario"
      items={todas}
      loading={loading}
      error={error}
      onClose={onClose}
      loadingText="Cargando horarios..."
    />
  );
}
