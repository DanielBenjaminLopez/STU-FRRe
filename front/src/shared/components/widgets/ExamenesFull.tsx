import { useExamenes } from "../../hooks/useExamenes";
import ScheduleGrid from "./ScheduleGrid";

export default function ExamenesFull({ onClose }: { onClose: () => void }) {
  const { todas, loading, error } = useExamenes();

  return (
    <ScheduleGrid
      title="Horario completo de exámenes"
      items={todas}
      loading={loading}
      error={error}
      onClose={onClose}
      loadingText="Cargando exámenes..."
    />
  );
}
