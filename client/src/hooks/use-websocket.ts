import { useState, useEffect, useRef, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  telescope: number;
  params?: any;
}

interface WebSocketResponse {
  type: string;
  success: boolean;
  message?: string;
  data?: any;
}

type MessageHandler = (response: WebSocketResponse) => void;

export function useWebSocket(telescopeId: number, onMessageReceived?: MessageHandler) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketResponse | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the page's own host (incl. port) so this works in local dev and on a
    // persistent host. On Vercel serverless there is no /ws endpoint, so the
    // connection simply fails and the app keeps working without live updates.
    const host = import.meta.env.VITE_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connection established");
      
      // Send initial connection message to register with telescope
      const connectMessage: WebSocketMessage = {
        type: "connect",
        telescope: telescopeId
      };
      
      socket.send(JSON.stringify(connectMessage));
    };
    
    socket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data) as WebSocketResponse;
        setLastMessage(response);
        
        if (onMessageReceived) {
          onMessageReceived(response);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    socket.onclose = () => {
      setConnected(false);
      console.log("WebSocket connection closed");
    };
    
    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [telescopeId, onMessageReceived]);
  
  // Function to send messages
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }, []);
  
  return { sendMessage, lastMessage, connected };
}
