import type { Examen } from "../api/examenes";
import { useExamenes } from "../hooks/useExamenes";
import ScheduleGrid from "../../horarios/components/ScheduleGrid";

interface ExamenesFullProps {
  onClose: () => void;
  items?: Examen[];
  loading?: boolean;
  error?: string | null;
}

export default function ExamenesFull({
  onClose,
  items,
  loading,
  error,
}: ExamenesFullProps) {
  const fetched = useExamenes(items === undefined);

  return (
    <ScheduleGrid
      title="Exámenes"
      items={items ?? fetched.todas}
      loading={loading ?? fetched.loading}
      error={error !== undefined ? error : fetched.error}
      onClose={onClose}
      headerGradient="from-green-300/50 to-green-300/60"
      colorVariant="green"
    />
  );
}
