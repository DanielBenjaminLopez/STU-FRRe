import Encabezado from "../../shared/components/widgets/Encabezado";
import Horarios from "../../shared/components/widgets/Horarios";
import Examenes from "../../shared/components/widgets/Examenes";

export default function TotemPreview() {
  return (
    <div className="flex justify-center items-start h-full overflow-y-auto p-4">
      <div className="flex flex-col w-270 h-480 border-x border-gray-200 p-16 gap-16 overflow-hidden bg-white rounded-4xl shadow-lg shrink-0">
        <Encabezado />
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="grid grid-cols-4 gap-4 grid-rows-6 w-full h-full">
            <Horarios />
            <Examenes />
          </div>
        </div>
      </div>
    </div>
  );
}
