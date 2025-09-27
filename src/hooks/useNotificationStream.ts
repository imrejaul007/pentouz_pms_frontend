/**
 * PLAN 1: Phase 1.3 - Real-time Implementation Hook
 * React hook for managing SSE notification stream connections
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import sseNotificationService, { SSENotificationEvent } from '../services/sseNotificationService';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface NotificationStreamState {
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  stats: {
    reconnectAttempts: number;
    lastHeartbeat: number;
    isHealthy: boolean;
    uptime: number;
  };
}

interface UseNotificationStreamOptions {
  autoConnect?: boolean;
  onNotificationReceived?: (notification: any) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  debug?: boolean;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const {
    autoConnect = true,
    onNotificationReceived,
    onConnectionStateChange,
    debug = false
  } = options;

  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [state, setState] = useState<NotificationStreamState>({
    connectionState: 'disconnected',
    isConnected: false,
    isConnecting: false,
    lastError: null,
    stats: {
      reconnectAttempts: 0,
      lastHeartbeat: 0,
      isHealthy: false,
      uptime: 0
    }
  });

  const handlersRef = useRef<{
    onNotificationReceived?: (notification: any) => void;
    onConnectionStateChange?: (state: ConnectionState) => void;
  }>({});

  // Update handlers ref when they change
  useEffect(() => {
    handlersRef.current.onNotificationReceived = onNotificationReceived;
    handlersRef.current.onConnectionStateChange = onConnectionStateChange;
  }, [onNotificationReceived, onConnectionStateChange]);

  // Update state from service
  const updateState = useCallback(() => {
    const serviceStats = sseNotificationService.getStats();
    const newState: NotificationStreamState = {
      connectionState: serviceStats.connectionState,
      isConnected: serviceStats.connectionState === 'connected',
      isConnecting: serviceStats.connectionState === 'connecting' || serviceStats.connectionState === 'reconnecting',
      lastError: null, // We'll track this separately
      stats: serviceStats
    };

    setState(newState);

    if (debug) {
      console.log('[useNotificationStream] State updated:', newState);
    }
  }, [debug]);

  // Connect to SSE service
  const connect = useCallback(async () => {
    if (!isAuthenticated || !user) {
      if (debug) console.log('[useNotificationStream] Cannot connect: user not authenticated');
      return;
    }

    try {
      if (debug) console.log('[useNotificationStream] Connecting to SSE...');
      await sseNotificationService.connect();
      updateState();
    } catch (error) {
      console.error('[useNotificationStream] Connection failed:', error);
      setState(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, [isAuthenticated, user, debug, updateState]);

  // Disconnect from SSE service
  const disconnect = useCallback(() => {
    if (debug) console.log('[useNotificationStream] Disconnecting from SSE...');
    sseNotificationService.disconnect();
    updateState();
  }, [debug, updateState]);

  // Setup event listeners
  useEffect(() => {
    const handleConnectionStateChange = (newState: ConnectionState) => {
      updateState();

      if (handlersRef.current.onConnectionStateChange) {
        handlersRef.current.onConnectionStateChange(newState);
      }

      if (debug) {
        console.log('[useNotificationStream] Connection state changed:', newState);
      }
    };

    const handleNotificationNew = (notification: any) => {
      if (debug) {
        console.log('[useNotificationStream] New notification received:', notification);
      }

      // Invalidate notification queries to update UI
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Call user's handler
      if (handlersRef.current.onNotificationReceived) {
        handlersRef.current.onNotificationReceived(notification);
      }
    };

    const handleNotificationRead = (notification: any) => {
      if (debug) {
        console.log('[useNotificationStream] Notification marked as read:', notification);
      }

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleNotificationDeleted = (notification: any) => {
      if (debug) {
        console.log('[useNotificationStream] Notification deleted:', notification);
      }

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    };

    const handleMessage = (event: SSENotificationEvent) => {
      if (debug) {
        console.log('[useNotificationStream] SSE message received:', event);
      }
    };

    const handleError = (error: any) => {
      console.error('[useNotificationStream] SSE error:', error);
      setState(prev => ({
        ...prev,
        lastError: error?.message || 'SSE connection error'
      }));
    };

    // Register event listeners
    sseNotificationService.on('connectionStateChange', handleConnectionStateChange);
    sseNotificationService.on('notification:new', handleNotificationNew);
    sseNotificationService.on('notification:read', handleNotificationRead);
    sseNotificationService.on('notification:deleted', handleNotificationDeleted);
    sseNotificationService.on('message', handleMessage);
    sseNotificationService.on('error', handleError);

    // Cleanup function
    return () => {
      sseNotificationService.off('connectionStateChange', handleConnectionStateChange);
      sseNotificationService.off('notification:new', handleNotificationNew);
      sseNotificationService.off('notification:read', handleNotificationRead);
      sseNotificationService.off('notification:deleted', handleNotificationDeleted);
      sseNotificationService.off('message', handleMessage);
      sseNotificationService.off('error', handleError);
    };
  }, [queryClient, debug]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && user && !sseNotificationService.isConnected) {
      connect();
    }
  }, [autoConnect, isAuthenticated, user, connect]);

  // Auto-disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (sseNotificationService.isConnected) {
        disconnect();
      }
    }
  }, [isAuthenticated, user, disconnect]);

  // Update state periodically to keep stats fresh
  useEffect(() => {
    const interval = setInterval(updateState, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [updateState]);

  // Manual subscription management
  const subscribe = useCallback(() => {
    sseNotificationService.subscribeToNotifications();
  }, []);

  // Manual ping (for health checking)
  const ping = useCallback(() => {
    sseNotificationService.ping();
  }, []);

  // Force reconnection
  const reconnect = useCallback(async () => {
    if (debug) console.log('[useNotificationStream] Force reconnecting...');
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [debug, disconnect, connect]);

  return {
    // Connection state
    connectionState: state.connectionState,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    lastError: state.lastError,

    // Stats
    stats: state.stats,

    // Actions
    connect,
    disconnect,
    reconnect,
    subscribe,
    ping,

    // Convenience methods
    isHealthy: state.stats.isHealthy,
    needsReconnection: state.connectionState === 'error' || !state.stats.isHealthy,

    // Service access for advanced usage
    service: sseNotificationService
  };
}

export default useNotificationStream;