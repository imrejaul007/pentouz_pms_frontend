import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface BrowserNotificationState {
  permission: NotificationPermission;
  supported: boolean;
  enabled: boolean;
}

export function useBrowserNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<BrowserNotificationState>({
    permission: 'default',
    supported: false,
    enabled: false
  });

  useEffect(() => {
    // Check if browser supports notifications
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    const permission = supported ? Notification.permission : 'denied';
    const enabled = permission === 'granted';

    setState({
      permission,
      supported,
      enabled
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!state.supported) {
      throw new Error('Browser notifications are not supported');
    }

    if (state.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, enabled: permission === 'granted' }));
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, [state.supported, state.permission]);

  const sendNotification = useCallback(async (options: BrowserNotificationOptions): Promise<Notification | null> => {
    if (!state.supported) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    if (state.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      // Check if page is visible - don't show browser notifications if user is active
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        return null;
      }

      const {
        title,
        body,
        icon = '/favicon.ico',
        badge = '/badge-icon.png',
        tag = `pentouz-${Date.now()}`,
        data = {},
        requireInteraction = false,
        silent = false,
        vibrate = [200, 100, 200]
      } = options;

      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag,
        data: {
          ...data,
          userId: user?._id,
          timestamp: Date.now()
        },
        requireInteraction,
        silent,
        vibrate: navigator.vibrate ? vibrate : undefined
      });

      // Auto-close after 8 seconds if not requiring interaction
      if (!requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 8000);
      }

      // Handle notification clicks
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();

        // Handle navigation based on notification data
        if (data.url) {
          window.location.href = data.url;
        } else if (data.route) {
          // If using React Router, you'd dispatch a navigation event here
          window.postMessage({
            type: 'NOTIFICATION_CLICKED',
            route: data.route,
            data: data
          }, '*');
        }

        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        // Track notification engagement
        console.log('Notification closed:', { tag, data });
      };

      // Handle notification error
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      return notification;
    } catch (error) {
      console.error('Failed to send browser notification:', error);
      return null;
    }
  }, [state.supported, state.permission, user?._id]);

  const sendHotelNotification = useCallback(async (
    type: 'booking' | 'service' | 'alert' | 'system',
    title: string,
    message: string,
    additionalData?: Record<string, any>
  ) => {
    const iconMap = {
      booking: '/icons/booking-notification.png',
      service: '/icons/service-notification.png',
      alert: '/icons/alert-notification.png',
      system: '/icons/system-notification.png'
    };

    const requireInteractionMap = {
      booking: true,
      service: true,
      alert: true,
      system: false
    };

    return await sendNotification({
      title: `THE PENTOUZ - ${title}`,
      body: message,
      icon: iconMap[type] || '/favicon.ico',
      tag: `pentouz-${type}-${Date.now()}`,
      requireInteraction: requireInteractionMap[type],
      data: {
        type,
        ...additionalData
      }
    });
  }, [sendNotification]);

  const clearAll = useCallback(() => {
    // Clear all THE PENTOUZ notifications
    // This requires service worker support for full functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications({ tag: 'pentouz' }).then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }, []);

  const scheduleNotification = useCallback(async (
    options: BrowserNotificationOptions,
    delay: number
  ): Promise<number> => {
    return window.setTimeout(() => {
      sendNotification(options);
    }, delay);
  }, [sendNotification]);

  const cancelScheduledNotification = useCallback((timeoutId: number) => {
    clearTimeout(timeoutId);
  }, []);

  // Listen for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear notifications when user returns to the page
        clearAll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearAll]);

  // Listen for notification clicks from other contexts
  useEffect(() => {
    const handleNotificationMessage = (event: MessageEvent) => {
      if (event.data.type === 'NOTIFICATION_CLICKED') {
        // Handle navigation or other actions
        console.log('Notification clicked:', event.data);
      }
    };

    window.addEventListener('message', handleNotificationMessage);
    return () => {
      window.removeEventListener('message', handleNotificationMessage);
    };
  }, []);

  return {
    state,
    requestPermission,
    sendNotification,
    sendHotelNotification,
    clearAll,
    scheduleNotification,
    cancelScheduledNotification,

    // Convenience methods
    isSupported: state.supported,
    isEnabled: state.enabled,
    hasPermission: state.permission === 'granted',
    needsPermission: state.permission === 'default',
    isDenied: state.permission === 'denied'
  };
}