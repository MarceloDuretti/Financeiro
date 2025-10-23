import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketMessage = {
  type: string;
  resource?: string;
  action?: "created" | "updated" | "deleted";
  data?: any;
  timestamp?: string;
  message?: string;
  tenantId?: string;
};

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(onMessage?: (message: WebSocketMessage) => void) {
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const isIntentionallyClosed = useRef(false);

  const connect = useCallback(() => {
    // Don't reconnect if intentionally closed
    if (isIntentionallyClosed.current) {
      return;
    }

    // Clear existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setStatus("connecting");
    setError(null);

    try {
      // Construct WebSocket URL (same host, different protocol)
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log("[WebSocket Client] Connecting to:", wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket Client] Connected");
        setStatus("connected");
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[WebSocket Client] Message received:", message);

          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error("[WebSocket Client] Failed to parse message:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket Client] Error:", event);
        setStatus("error");
        setError("WebSocket connection error");
      };

      ws.onclose = (event) => {
        console.log("[WebSocket Client] Disconnected", event.code, event.reason);
        setStatus("disconnected");
        wsRef.current = null;

        // Attempt reconnection if not intentionally closed
        if (!isIntentionallyClosed.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          console.log(`[WebSocket Client] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError("Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("[WebSocket Client] Connection failed:", error);
      setStatus("error");
      setError(error instanceof Error ? error.message : "Failed to connect");
    }
  }, [onMessage]);

  const disconnect = useCallback(() => {
    isIntentionallyClosed.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("disconnected");
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("[WebSocket Client] Cannot send - not connected");
    return false;
  }, []);

  // Connect on mount
  useEffect(() => {
    isIntentionallyClosed.current = false;
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    error,
    send,
    reconnect: connect,
    disconnect,
  };
}
