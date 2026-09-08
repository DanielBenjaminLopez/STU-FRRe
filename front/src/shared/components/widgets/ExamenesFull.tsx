import { useExamenes } from "../../hooks/useExamenes";
import ScheduleGrid from "./ScheduleGrid";

export default function ExamenesFull({ onClose }: { onClose: () => void }) {
  const { todas, loading, error } = useExamenes();

  return (
    <ScheduleGrid
      title="Exámenes"
      items={todas}
      loading={loading}
      error={error}
      onClose={onClose}
      loadingText="Cargando exámenes..."
      headerGradient="from-green-300/50 to-green-300/60"
    />
  );
}
