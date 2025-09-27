import React from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  off(event: string, listener: Function): this {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) return false;
    this.events[event].forEach(listener => listener(...args));
    return true;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

export interface RealTimeEvent {
  type: string;
  entity: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  data: any;
  timestamp: string;
  userId?: string;
  hotelId?: string;
}

export interface RealTimeConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

class RealTimeService extends EventEmitter {
  private socket: Socket | null = null;
  private config: Required<RealTimeConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private isConnected = false;
  private isConnecting = false;
  private shouldReconnect = true;
  private subscriptions = new Set<string>();
  private messageQueue: any[] = [];
  private disabledLogShown = false;
  private connectionPromise: Promise<void> | null = null; // Singleton connection promise

  constructor(config: RealTimeConfig = {}) {
    super();
    
    this.config = {
      url: config.url || this.getSocketUrl(),
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      debug: config.debug !== undefined ? config.debug : true, // Enable debug logging
    };
  }

  private getSocketUrl(): string {
    // Connect to backend server using Socket.IO
    return API_CONFIG.WS_URL;
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debug) {
      console.log(`[RealTimeService] ${message}`, ...args);
    }
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  public connect(): Promise<void> {
    // Return existing connection promise if one is in progress
    if (this.connectionPromise) {
      this.log('Using existing connection promise');
      return this.connectionPromise;
    }

    // If already connected, resolve immediately
    if (this.isConnected) {
      this.log('Already connected, resolving immediately');
      return Promise.resolve();
    }

    // Create new connection promise
    this.connectionPromise = new Promise((resolve, reject) => {
      // RE-ENABLED WEBSOCKET CONNECTIONS WITH SINGLETON PATTERN
      // WebSocket connections re-enabled for hotel management notifications with proper connection management

      this.log('Attempting to connect to WebSocket server', {
        url: this.config.url,
        isConnected: this.isConnected,
        isConnecting: this.isConnecting
      });

      if (this.isConnecting) {
        this.log('Connection already in progress, rejecting duplicate attempt');
        reject(new Error('Connection already in progress'));
        return;
      }

      const token = this.getAuthToken();
      if (!token) {
        this.log('No authentication token available for WebSocket connection');
        reject(new Error('No authentication token available'));
        return;
      }

      this.log('Starting WebSocket connection with token');

      this.isConnecting = true;
      this.shouldReconnect = true;

      try {
        // Create Socket.IO connection
        this.socket = io(this.config.url, {
          path: '/ws/notifications',
          auth: {
            token
          },
          query: {
            token // Also send in query for compatibility
          },
          autoConnect: false,
          reconnection: false, // Disable automatic reconnection to prevent loops
          timeout: 30000, // Increase timeout
          transports: ['polling'], // Use only polling transport to avoid WebSocket issues
          forceNew: true, // Force new connection to avoid conflicts
          withCredentials: true,
          upgrade: true // Allow upgrade to WebSocket after initial connection
        });

        // Connection event handlers
        this.socket.on('connect', () => {
          this.log('Socket connected successfully');
          this.handleConnect();
          this.connectionPromise = null; // Clear connection promise on success
          resolve();
        });

        this.socket.on('event', (data) => {
          this.handleRealTimeEvent(data.data);
        });

        this.socket.on('connected', (data) => {
          this.log('Received connection confirmation:', data);
        });

        this.socket.on('subscribed', (data) => {
          this.log('Subscribed to:', data.subscription);
        });

        this.socket.on('unsubscribed', (data) => {
          this.log('Unsubscribed from:', data.subscription);
        });

        this.socket.on('pong', () => {
          // Heartbeat response
        });

        this.socket.on('connect_error', (error) => {
          this.log('Socket connection error:', error.message);
          this.handleError(error);
          if (this.isConnecting) {
            this.isConnecting = false;
            this.connectionPromise = null; // Clear connection promise on error
            reject(new Error(`Connection failed: ${error.message}`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          this.log('Socket disconnection detected:', { reason, wasConnected: this.isConnected });
          this.handleDisconnect(reason);
        });

        this.socket.on('reconnect', (attemptNumber) => {
          this.log(`Reconnected after ${attemptNumber} attempts`);
          this.handleConnect();
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          this.reconnectAttempts = attemptNumber;
          this.emit('reconnecting', attemptNumber);
        });

        this.socket.on('reconnect_failed', () => {
          this.log('Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        });

        // Start connection
        this.socket.connect();

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting && !this.isConnected) {
            this.log('Socket connection timeout after 30 seconds');
            this.connectionPromise = null; // Clear connection promise on timeout
            reject(new Error('Socket connection timeout'));
            this.disconnect();
          }
        }, 30000);

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null; // Clear connection promise on exception
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this.isConnecting = false;
    this.connectionPromise = null; // Clear connection promise on disconnect

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.subscriptions.clear();
    this.messageQueue = [];

    this.emit('disconnected');
    this.log('Disconnected from Socket.IO');
  }

  private handleConnect(): void {
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    this.log('Connected to Socket.IO');
    this.emit('connected');

    // Start heartbeat
    this.startHeartbeat();

    // Re-subscribe to previous subscriptions
    this.subscriptions.forEach(subscription => {
      this.sendMessage({ type: 'subscribe', subscription });
    });

    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private handleDisconnect(reason: string): void {
    this.isConnected = false;
    this.isConnecting = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.log('Socket.IO disconnected:', reason);
    this.emit('disconnected', { reason });

    // Custom reconnection logic since automatic reconnection is disabled
    if (this.shouldReconnect && reason !== 'io client disconnect') {
      this.attemptReconnection();
    }
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    this.log(`Attempting reconnection ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(error => {
          this.log('Reconnection failed:', error);
          // Try again
          this.attemptReconnection();
        });
      }
    }, Math.min(this.config.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1), 30000));
  }

  private handleRealTimeEvent(eventData: RealTimeEvent): void {
    this.log('Real-time event:', eventData);
    
    // Emit general event
    this.emit('event', eventData);
    
    // Emit specific events
    this.emit(`${eventData.entity}:${eventData.action}`, eventData.data);
    this.emit(`${eventData.entity}:*`, eventData);
    this.emit('*', eventData);
  }

  private handleError(error: any): void {
    this.log('Socket.IO error:', error);
    this.emit('error', error);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  private sendMessage(message: any): void {
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }

    try {
      if (message.type === 'subscribe') {
        this.socket.emit('subscribe', { subscription: message.subscription });
      } else if (message.type === 'unsubscribe') {
        this.socket.emit('unsubscribe', { subscription: message.subscription });
      } else if (message.type === 'ping') {
        this.socket.emit('ping');
      } else {
        this.socket.emit('message', message);
      }
      this.log('Sent message:', message);
    } catch (error) {
      this.log('Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  // Public API methods

  public subscribe(subscription: string): void {
    this.subscriptions.add(subscription);
    if (this.isConnected) {
      this.sendMessage({ type: 'subscribe', subscription });
    }
  }

  public unsubscribe(subscription: string): void {
    this.subscriptions.delete(subscription);
    if (this.isConnected) {
      this.sendMessage({ type: 'unsubscribe', subscription });
    }
  }

  public getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    // Return actual connection state now that WebSocket is re-enabled
    if (this.isConnected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Entity-specific subscription helpers

  public subscribeToMaintenance(): void {
    this.subscribe('maintenance:*');
  }

  public subscribeToGuestServices(): void {
    this.subscribe('guest-services:*');
  }

  public subscribeToSupplyRequests(): void {
    this.subscribe('supply-requests:*');
  }

  public subscribeToHousekeeping(): void {
    this.subscribe('housekeeping:*');
  }

  public subscribeToRooms(): void {
    this.subscribe('rooms:*');
  }

  public subscribeToInventory(): void {
    this.subscribe('inventory:*');
  }

  // Entity-specific event handlers

  public onMaintenanceUpdate(callback: (data: any) => void): void {
    this.on('maintenance:updated', callback);
  }

  public onMaintenanceCreate(callback: (data: any) => void): void {
    this.on('maintenance:created', callback);
  }

  public onGuestServiceUpdate(callback: (data: any) => void): void {
    this.on('guest-services:updated', callback);
  }

  public onSupplyRequestUpdate(callback: (data: any) => void): void {
    this.on('supply-requests:updated', callback);
  }

  public onRoomStatusChange(callback: (data: any) => void): void {
    this.on('rooms:status_changed', callback);
  }

  // Utility methods

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public reconnect(): void {
    if (this.isConnected) {
      this.disconnect();
    }
    this.connect().catch(error => {
      this.log('Manual reconnection failed:', error);
    });
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();

// React hook for using real-time service
export const useRealTime = () => {
  const [connectionState, setConnectionState] = React.useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = React.useState(0);

  React.useEffect(() => {
    const updateConnectionState = () => {
      setConnectionState(realTimeService.getConnectionState());
      setReconnectAttempts(realTimeService.getReconnectAttempts());
    };

    realTimeService.on('connected', updateConnectionState);
    realTimeService.on('disconnected', updateConnectionState);
    realTimeService.on('reconnecting', updateConnectionState);

    updateConnectionState();

    return () => {
      realTimeService.off('connected', updateConnectionState);
      realTimeService.off('disconnected', updateConnectionState);
      realTimeService.off('reconnecting', updateConnectionState);
    };
  }, []);

  return {
    connectionState,
    reconnectAttempts,
    connect: () => realTimeService.connect(),
    disconnect: () => realTimeService.disconnect(),
    subscribe: (subscription: string) => realTimeService.subscribe(subscription),
    unsubscribe: (subscription: string) => realTimeService.unsubscribe(subscription),
    on: (event: string, callback: (...args: any[]) => void) => realTimeService.on(event, callback),
    off: (event: string, callback: (...args: any[]) => void) => realTimeService.off(event, callback),
    isConnected: realTimeService.isConnectedToServer(),
  };
};

export default realTimeService;