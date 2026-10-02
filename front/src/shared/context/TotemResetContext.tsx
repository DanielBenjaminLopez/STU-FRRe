import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type ResetListener = () => void;
type SubscribeTotemReset = (listener: ResetListener) => () => void;

const TotemResetContext = createContext<SubscribeTotemReset | null>(null);

export const TotemResetProvider = TotemResetContext.Provider;

export function useTotemResetController() {
  const listenersRef = useRef<Set<ResetListener>>(new Set());

  const subscribe: SubscribeTotemReset = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const triggerReset = useCallback(() => {
    listenersRef.current.forEach((listener) => listener());
  }, []);

  return { subscribe, triggerReset };
}

export function useOnTotemReset(onReset: ResetListener) {
  const subscribe = useContext(TotemResetContext);
  const callbackRef = useRef(onReset);

  useEffect(() => {
    callbackRef.current = onReset;
  });

  useEffect(() => {
    if (!subscribe) return;
    return subscribe(() => callbackRef.current());
  }, [subscribe]);
}
