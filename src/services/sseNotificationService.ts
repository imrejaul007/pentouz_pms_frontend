/**
 * PLAN 1: Phase 1.3 - Real-time Implementation - Server-Sent Events (SSE)
 * Enhanced SSE implementation for real-time notifications with proper reconnection and heartbeat
 */

import { API_CONFIG } from '../config/api';

export interface SSENotificationEvent {
  type: 'notification:new' | 'notification:read' | 'notification:deleted' | 'connection' | 'heartbeat' | 'error';
  id?: string;
  data?: any;
  message?: string;
  timestamp?: string;
}

export interface SSEConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatTimeout?: number;
  debug?: boolean;
  withCredentials?: boolean;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

class SSENotificationService {
  private eventSource: EventSource | null = null;
  private config: Required<SSEConfig>;
  private listeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private shouldReconnect = true;
  private lastHeartbeat = 0;
  private connectionPromise: Promise<void> | null = null;
  private isDestroyed = false;

  constructor(config: SSEConfig = {}) {
    this.config = {
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatTimeout: config.heartbeatTimeout || 60000, // 60 seconds
      debug: config.debug !== undefined ? config.debug : true,
      withCredentials: config.withCredentials !== undefined ? config.withCredentials : true
    };

    // Start heartbeat checker
    this.startHeartbeatChecker();
  }

  private log(message: string, ...args: any[]) {
    if (this.config.debug) {
      console.log(`[SSENotificationService] ${message}`, ...args);
    }
  }

  private error(message: string, ...args: any[]) {
    console.error(`[SSENotificationService] ${message}`, ...args);
  }

  private getSSEUrl(): string {
    const token = this.getAuthToken();
    const baseUrl = API_CONFIG.BASE_URL.replace('/api/v1', ''); // Remove API prefix for SSE
    return `${baseUrl}/api/v1/notifications/stream?token=${token}`;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  private setConnectionState(state: ConnectionState) {
    if (this.connectionState === state) return;

    this.connectionState = state;
    this.emit('connectionStateChange', state);
    this.log(`Connection state changed: ${state}`);
  }

  public connect(): Promise<void> {
    // Return existing connection promise if one is in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Already connected
    if (this.connectionState === 'connected') {
      return Promise.resolve();
    }

    // Check if we have auth token
    const token = this.getAuthToken();
    if (!token) {
      this.error('No authentication token available');
      return Promise.reject(new Error('No authentication token'));
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.setConnectionState('connecting');
        this.log('Connecting to SSE stream...');

        // Close existing connection
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        const sseUrl = this.getSSEUrl();
        this.log('SSE URL:', sseUrl);

        this.eventSource = new EventSource(sseUrl, {
          withCredentials: this.config.withCredentials
        });

        // Connection opened
        this.eventSource.onopen = (event) => {
          this.log('SSE connection opened');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          this.connectionPromise = null;
          this.lastHeartbeat = Date.now();
          resolve();
        };

        // Message received
        this.eventSource.onmessage = (event) => {
          try {
            this.lastHeartbeat = Date.now();

            // Handle heartbeat
            if (event.data === ':heartbeat') {
              this.log('Heartbeat received');
              return;
            }

            const notification: SSENotificationEvent = JSON.parse(event.data);
            this.log('SSE message received:', notification);

            if (notification.type === 'connection') {
              this.log('Connection established:', notification.message);
              return;
            }

            // Emit notification event
            this.emit(notification.type, notification.data || notification);

            // Emit generic 'message' event
            this.emit('message', notification);

          } catch (error) {
            this.error('Error parsing SSE message:', error);
          }
        };

        // Connection error
        this.eventSource.onerror = (event) => {
          this.error('SSE connection error:', event);
          this.setConnectionState('error');

          if (this.connectionPromise) {
            this.connectionPromise = null;
            reject(new Error('SSE connection failed'));
          }

          // Attempt reconnection if enabled and not at max attempts
          if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.error('Max reconnection attempts reached or reconnection disabled');
          }
        };

        // Handle custom event types for notifications
        this.eventSource.addEventListener('notification:new', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('notification:new', data);
          } catch (error) {
            this.error('Error parsing notification:new event:', error);
          }
        });

        this.eventSource.addEventListener('notification:read', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('notification:read', data);
          } catch (error) {
            this.error('Error parsing notification:read event:', error);
          }
        });

        this.eventSource.addEventListener('notification:deleted', (event: any) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('notification:deleted', data);
          } catch (error) {
            this.error('Error parsing notification:deleted event:', error);
          }
        });

      } catch (error) {
        this.error('Error creating SSE connection:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  public disconnect(): void {
    this.log('Disconnecting SSE...');
    this.shouldReconnect = false;

    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Close EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setConnectionState('disconnected');
    this.connectionPromise = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && !this.isDestroyed) {
        this.connect().catch(error => {
          this.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private startHeartbeatChecker(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.connectionState === 'connected') {
        const timeSinceHeartbeat = Date.now() - this.lastHeartbeat;

        if (timeSinceHeartbeat > this.config.heartbeatTimeout) {
          this.error('Heartbeat timeout - connection appears dead');
          this.setConnectionState('error');

          // Force reconnection
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }

          if (this.shouldReconnect) {
            this.scheduleReconnect();
          }
        }
      }
    }, 15000); // Check every 15 seconds
  }

  // Event emitter methods
  public on(event: string, listener: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  public off(event: string, listener: Function): this {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          this.error(`Error in event listener for '${event}':`, error);
        }
      });
      return true;
    }
    return false;
  }

  public removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  // Public getters
  public get connectionState(): ConnectionState {
    return this.connectionState;
  }

  public get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  public get isConnecting(): boolean {
    return this.connectionState === 'connecting' || this.connectionState === 'reconnecting';
  }

  // Subscribe to specific notification types
  public subscribeToNotifications(): void {
    // For SSE, subscription is automatic once connected
    this.log('Subscribed to all notification events via SSE');
  }

  // Send keep-alive ping (SSE doesn't need this, but keeping interface consistent)
  public ping(): void {
    // SSE handles keep-alive via heartbeat from server
    this.log('Ping - SSE connection healthy');
  }

  // Destroy service
  public destroy(): void {
    this.isDestroyed = true;
    this.disconnect();
    this.removeAllListeners();
  }

  // Get connection stats
  public getStats(): {
    connectionState: ConnectionState;
    reconnectAttempts: number;
    lastHeartbeat: number;
    isHealthy: boolean;
    uptime: number;
  } {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      isHealthy: this.connectionState === 'connected' && (Date.now() - this.lastHeartbeat) < this.config.heartbeatTimeout,
      uptime: this.lastHeartbeat > 0 ? Date.now() - this.lastHeartbeat : 0
    };
  }
}

// Create singleton instance
const sseNotificationService = new SSENotificationService({
  debug: process.env.NODE_ENV === 'development',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatTimeout: 60000
});

export default sseNotificationService;
export { SSENotificationService };