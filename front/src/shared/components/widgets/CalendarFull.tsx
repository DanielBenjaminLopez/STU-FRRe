import { useCalendario } from "../../hooks/useCalendario";
import CalendarGrid from "./CalendarGrid";

export default function CalendarFull({ onClose }: { onClose: () => void }) {
  const { eventos, loading, error } = useCalendario();

  return (
    <CalendarGrid
      title="Calendario académico"
      eventos={eventos}
      loading={loading}
      error={error}
      onClose={onClose}
      loadingText="Cargando eventos..."
    />
  );
}
