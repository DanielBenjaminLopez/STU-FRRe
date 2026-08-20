import { useEffect, useRef, useState } from "react";
import { wsUrl, wsUrlWithTotemToken, getTotemToken } from "../api/client";

const RECONNECT_DELAY = 3000;
const MAX_RECONNECTS = 5;

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useTotemWebSocket(codigo: string | null, linked = false) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rejected, setRejected] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);

  useEffect(() => {
    if (!codigo && !linked) return;
    const token = linked ? getTotemToken() : null;
    if (linked && !token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRejected(false);

    let mounted = true;
    function connect() {
      const socket = new WebSocket(
        linked
          ? wsUrlWithTotemToken("/ws/totem-config/", token as string)
          : wsUrl(`/ws/totem/${codigo}/`),
      );

      socket.onopen = () => {
        reconnectCountRef.current = 0;
        if (mounted) {
          setIsConnected(true);
          setRejected(false);
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (mounted) setLastMessage(data);
        } catch {
          /* ignore invalid JSON */
        }
      };

      socket.onclose = (event) => {
        if (mounted) {
          setIsConnected(false);

          if (
            event.code === 4403 ||
            event.code === 4001 ||
            reconnectCountRef.current >= MAX_RECONNECTS
          ) {
            setRejected(true);
            return;
          }

          reconnectCountRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      return socket;
    }

    const ws = connect();

    return () => {
      mounted = false;
      reconnectCountRef.current = 0;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      ws.close();
    };
  }, [codigo, linked]);

  return { lastMessage, isConnected, rejected };
}
