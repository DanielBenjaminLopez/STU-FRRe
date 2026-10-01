import { useEffect, useState } from "react";
import Logo from "../../../assets/logo_negro.webp";
import { getCurrentTime, getCurrentDate } from "../../../shared/utils/dateTime";

const sizeStyles = {
  sm: "text-lg font-normal bg-gray-100 border border-gray-200 px-4 py-1 rounded-4xl",
  lg: "text-5xl font-semibold",
} as const;

export interface EncabezadoProps {
  size?: "sm" | "lg";
}

export default function Encabezado({ size = "sm" }: EncabezadoProps) {
  const [time, setTime] = useState(getCurrentTime());
  const [date, setDate] = useState(getCurrentDate());

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getCurrentTime();
      const newDate = getCurrentDate();

      setTime(newTime);
      setDate((prev) => (prev === newDate ? prev : newDate));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center w-full justify-between">
      <img src={Logo} alt="Logo" className="w-80 shrink-0" draggable={false} />
      <div className="flex flex-col items-end gap-1">
        <div className={`whitespace-nowrap select-none ${sizeStyles[size]}`}>
          {time}
        </div>
        <div className="text-2xl font-normal whitespace-nowrap select-none">
          {date}
        </div>
      </div>
    </div>
  );
}
