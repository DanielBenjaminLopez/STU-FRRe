import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchTotems, type Totem } from "../api/totems";
import { useAuth } from "./AuthContext";

interface TotemState {
  totems: Totem[];
  selectedId: string;
  selectedTotem: Totem | undefined;
  setSelectedId: (id: string) => void;
  refreshTotems: () => Promise<void>;
}

const TotemContext = createContext<TotemState | null>(null);

export function TotemProvider({ children }: { children: ReactNode }) {
  const [totems, setTotems] = useState<Totem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchTotems().then((data) => {
      const vinculados = data.filter((t) => t.vinculado);
      setTotems(vinculados);
      if (vinculados.length > 0) setSelectedId(String(vinculados[0].id));
    });
  }, [isAuthenticated]);

  const refreshTotems = useCallback(async () => {
    const data = await fetchTotems();
    const vinculados = data.filter((t) => t.vinculado);
    setTotems(vinculados);
    setSelectedId((prev) =>
      vinculados.some((t) => String(t.id) === prev)
        ? prev
        : vinculados.length > 0
          ? String(vinculados[0].id)
          : "",
    );
  }, []);

  const selectedTotem = totems.find((t) => String(t.id) === selectedId);

  return (
    <TotemContext.Provider
      value={{
        totems,
        selectedId,
        selectedTotem,
        setSelectedId,
        refreshTotems,
      }}
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
