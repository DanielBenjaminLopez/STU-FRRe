import { useAuth } from "../../shared/context/AuthContext";
import { useTotem } from "../../shared/context/TotemContext";
import Logo from "../../assets/logo_negro.webp";
import Select from "../../shared/components/ui/Select";

export default function AdminHeader() {
  const { user, isAuthenticated } = useAuth();
  const { totems, selectedId, setSelectedId } = useTotem();

  const vinculados = totems.filter((t) => t.vinculado);
  const totemOptions =
    vinculados.length > 0
      ? vinculados.map((t) => ({
          value: String(t.id),
          label: t.nombre || `Tótem #${t.id}`,
        }))
      : [{ value: "", label: "Sin tótems" }];

  return (
    <header className="relative z-50 flex items-center justify-between px-8 h-18 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center">
        <img src={Logo} alt="Logo UTN" className="h-10" draggable={false} />
      </div>

      {isAuthenticated && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <Select
              role="combobox"
              align="center"
              colorVariant="gray"
              value={selectedId}
              onChange={setSelectedId}
              options={totemOptions}
              placeholder={
                vinculados.length > 0 ? "Seleccionar tótem" : "Sin tótems"
              }
              triggerClassName="px-4 py-2 font-medium"
              aria-label="Seleccionar tótem"
            />
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              Bienvenido,{" "}
              <span className="font-semibold text-gray-900">
                {user?.username}
              </span>
            </span>
          </div>
        </>
      )}
    </header>
  );
}
