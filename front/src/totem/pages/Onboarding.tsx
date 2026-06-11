import Logo from "../../assets/logo_negro.webp";

export default function Onboarding() {
  return (
    <div className="flex flex-col max-w-270 h-480 mx-auto border-x border-gray-200 p-16 gap-16">
      <div className="flex flex-col justify-center items-center w-full gap-16">
        <img src={Logo} alt="Logo" className="w-80" draggable={false} />
        <div className="flex flex-col items-center gap-4">
          <span className="text-3xl">Su código de emparejamiento es:</span>
          <span className="text-8xl font-bold">34735</span>
        </div>

        <div className="flex flex-col items-center gap-4 bg-gray-100 px-8 py-16 rounded-4xl max-w-175">
          <span className="text-2xl">
            Para vincular este tótem, siga los siguientes pasos:
            <ol className="list-decimal ml-8">
              <li>
                Ingrese al <strong>panel de administración</strong> del Sistema
                de Tótems Universitarios desde una PC o dispositivo móvil.
              </li>
              <li>
                Seleccione <strong>Vincular nuevo tótem</strong>.
              </li>
              <li>
                Escriba el <strong>código de emparejamiento</strong>{" "}
                proporcionado.
              </li>
            </ol>
          </span>
        </div>
      </div>
    </div>
  );
}
