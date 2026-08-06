interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onCreate?: () => void;
  createLabel?: string;
}

export default function PageHeader({
  title,
  subtitle,
  onCreate,
  createLabel = "Crear",
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && (
          <span className="text-sm text-gray-500">{subtitle}</span>
        )}
      </div>

      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="px-6 py-2.5 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
        >
          {createLabel}
        </button>
      )}
    </div>
  );
}
