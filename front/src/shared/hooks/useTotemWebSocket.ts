import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../api/client";

const MAX_RETRIES = 5;

interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export function useTotemWebSocket(codigo: string | null) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [rejected, setRejected] = useState(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);

  useEffect(() => {
    if (!codigo) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRejected(false);

    let mounted = true;
    let wasConnected = false;

    function connect() {
      const socket = new WebSocket(wsUrl(`/ws/totem/${codigo}/`));

      socket.onopen = () => {
        wasConnected = true;
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

      socket.onclose = () => {
        if (mounted) {
          setIsConnected(false);
          if (wasConnected && reconnectCountRef.current < MAX_RETRIES) {
            reconnectCountRef.current += 1;
            reconnectTimerRef.current = setTimeout(connect, 3000);
          } else {
            setRejected(true);
          }
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
  }, [codigo]);

  return { lastMessage, isConnected, rejected };
}
