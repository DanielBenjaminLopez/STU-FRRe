import Button from "../../shared/components/ui/Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onCreate?: () => void;
  createLabel?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  onCreate,
  createLabel = "Crear",
  children,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-3">
        {children}
        {onCreate && (
          <Button variant="primary" onClick={onCreate}>
            {createLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
