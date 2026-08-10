import { useEffect, useState } from "react";
import Logo from "../../../assets/logo_negro.webp";
import {
  getCurrentTime,
  getCurrentDate,
  getGreeting,
} from "../../../shared/utils/dateTime";

export default function Encabezado() {
  const [time, setTime] = useState(getCurrentTime());
  const [date, setDate] = useState(getCurrentDate());
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getCurrentTime();
      const newDate = getCurrentDate();
      const newGreeting = getGreeting();

      setTime(newTime);
      setDate((prev) => (prev === newDate ? prev : newDate));
      setGreeting((prev) => (prev === newGreeting ? prev : newGreeting));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center w-full justify-between">
      <img src={Logo} alt="Logo" className="w-80" draggable={false} />
      <div className="flex flex-col justify-start items-end">
        <div className="text-lg font-normal bg-gray-100 px-4 py-2 rounded-4xl select-none">
          {time}
        </div>
        <div className="text-5xl font-semibold select-none">{greeting}</div>
        <div className="text-lg font-normal select-none">{date}</div>
      </div>
    </div>
  );
}
