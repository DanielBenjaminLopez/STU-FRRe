import Encabezado from "../../shared/components/widgets/Encabezado";

export default function Home() {
  return (
    <div className="flex flex-col max-w-270 h-480 mx-auto border-x border-gray-200 p-16 gap-16">
      <Encabezado />

      <div className="flex flex-col grow">
        <div className="grid grid-cols-4 gap-4 grid-rows-6 w-full h-full">
          {Array.from({ length: 24 }).map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-4xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
