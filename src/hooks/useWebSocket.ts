import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
  userId?: string;
  role?: string;
  message?: string;
}

interface WebSocketHookOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'production' 
      ? window.location.host 
      : 'localhost:4000';
    const token = localStorage.getItem('token');
    
    return `${protocol}//${host}/ws/notifications?token=${token}`;
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      ws.current = new WebSocket(getWebSocketUrl());

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectCount.current = 0;
        onConnect?.();

        // Start heartbeat
        startHeartbeat();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);

          // Handle different message types
          switch (message.type) {
            case 'notification':
            case 'admin_notification':
              handleNotification(message);
              break;
            case 'pong':
              // Heartbeat response, connection is alive
              break;
            default:
              console.log('Received WebSocket message:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        stopHeartbeat();
        onDisconnect?.();

        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && reconnectCount.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection failed');
        setIsConnecting(false);
        onError?.(error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnecting(false);
      setConnectionError('Failed to create connection');
    }
  }, [getWebSocketUrl, onMessage, onConnect, onDisconnect, onError, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    stopHeartbeat();
    clearReconnectTimer();
    
    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
      ws.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message:', message);
    return false;
  }, []);

  const scheduleReconnect = useCallback(() => {
    clearReconnectTimer();
    reconnectCount.current++;
    
    console.log(`Scheduling reconnect attempt ${reconnectCount.current}/${maxReconnectAttempts} in ${reconnectInterval}ms`);
    
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        send({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }, [send]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const handleNotification = useCallback((message: WebSocketMessage) => {
    const { data } = message;
    
    if (data) {
      // Show toast notification for real-time updates
      const toastOptions = {
        duration: data.priority === 'urgent' ? 8000 : 5000,
        style: {
          background: getPriorityColor(data.priority),
          color: '#fff',
        },
      };

      switch (data.type) {
        case 'inventory_damage':
          toast.error(`🔧 ${data.title}`, toastOptions);
          break;
        case 'inventory_missing':
          toast.error(`📦 ${data.title}`, toastOptions);
          break;
        case 'inventory_guest_charged':
          toast.success(`💰 ${data.title}`, toastOptions);
          break;
        case 'checkout_inspection_failed':
          toast.error(`⚠️ ${data.title}`, toastOptions);
          break;
        default:
          toast(`🔔 ${data.title || data.message}`, toastOptions);
      }

      // Play notification sound for urgent notifications
      if (data.priority === 'urgent') {
        playNotificationSound();
      }
    }
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#4f46e5';
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  // WebSocket methods
  const subscribe = useCallback((channels: string[]) => {
    send({
      type: 'subscribe',
      channels
    });
  }, [send]);

  const markNotificationsRead = useCallback((notificationIds: string[]) => {
    send({
      type: 'mark_read',
      notificationIds
    });
  }, [send]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Reconnect when token changes
  useEffect(() => {
    if (isConnected) {
      disconnect();
      if (autoConnect) {
        setTimeout(connect, 100);
      }
    }
  }, [localStorage.getItem('token')]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    lastMessage,
    connect,
    disconnect,
    send,
    subscribe,
    markNotificationsRead,
    reconnectCount: reconnectCount.current
  };
}

export default useWebSocket;