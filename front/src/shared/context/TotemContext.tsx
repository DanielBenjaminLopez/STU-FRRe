import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchTotems, type Totem } from "../api/totems";

interface TotemState {
  totems: Totem[];
  selectedId: string;
  selectedTotem: Totem | undefined;
  setSelectedId: (id: string) => void;
}

const TotemContext = createContext<TotemState | null>(null);

export function TotemProvider({ children }: { children: ReactNode }) {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    fetchTotems().then((data) => {
      setTotems(data);
      if (data.length > 0) setSelectedId(String(data[0].id));
    });
  }, []);

  const selectedTotem = totems.find((t) => String(t.id) === selectedId);

  return (
    <TotemContext.Provider
      value={{ totems, selectedId, selectedTotem, setSelectedId }}
    >
      {children}
    </TotemContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTotem() {
  const ctx = useContext(TotemContext);
  if (!ctx) throw new Error("useTotem must be used within TotemProvider");
  return ctx;
}
