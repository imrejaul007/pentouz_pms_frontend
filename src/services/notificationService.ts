import { api } from './api';

// Interfaces
export interface Notification {
  _id: string;
  userId: string;
  hotelId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  readAt?: string;
  scheduledFor?: string;
  sentAt?: string;
  deliveredAt?: string;
  metadata?: {
    bookingId?: {
      _id: string;
      bookingNumber: string;
      checkIn: string;
      checkOut: string;
      roomNumber?: string;
    };
    serviceBookingId?: {
      _id: string;
      bookingDate: string;
      numberOfPeople: number;
      serviceId?: string;
    };
    paymentId?: {
      _id: string;
      amount: number;
      currency: string;
      status: string;
    };
    loyaltyTransactionId?: {
      _id: string;
      points: number;
      type: string;
      description: string;
    };
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    category?: string;
    tags?: string[];
  };
  deliveryAttempts: DeliveryAttempt[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  isExpired?: boolean;
  isScheduled?: boolean;
  canBeSent?: boolean;
}

export interface NotificationType {
  type: string;
  label: string;
  description: string;
  category: string;
  defaultEnabled: boolean;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultEnabled: boolean;
  supportsQuietHours: boolean;
  supportsFrequency: boolean;
}

export type NotificationTypeValue = 
  | 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation'
  | 'payment_success' | 'payment_failed' | 'loyalty_points'
  | 'service_booking' | 'service_reminder' | 'promotional'
  | 'system_alert' | 'welcome' | 'check_in' | 'check_out'
  | 'review_request' | 'special_offer';

export type NotificationChannelValue = 'email' | 'sms' | 'push' | 'in_app';

export interface DeliveryAttempt {
  channel: NotificationChannelValue;
  attemptedAt: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  responseData?: any;
}

export interface NotificationPreference {
  _id: string;
  userId: string;
  hotelId: string;
  email: {
    enabled: boolean;
    address: string;
    types: Record<NotificationTypeValue, boolean>;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  sms: {
    enabled: boolean;
    number: string;
    types: Record<NotificationTypeValue, boolean>;
    frequency: 'immediate' | 'hourly' | 'daily';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  push: {
    enabled: boolean;
    token: string;
    deviceInfo?: {
      platform: 'web' | 'ios' | 'android';
      version?: string;
      model?: string;
    };
    types: Record<NotificationTypeValue, boolean>;
    frequency: 'immediate' | 'hourly' | 'daily';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  inApp: {
    enabled: boolean;
    types: Record<NotificationTypeValue, boolean>;
    sound: boolean;
    vibration: boolean;
    showBadge: boolean;
  };
  global: {
    enabled: boolean;
    language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh';
    timezone: string;
    digest: {
      enabled: boolean;
      frequency: 'daily' | 'weekly';
      time: string;
    };
  };
  hasEnabledChannels?: boolean;
  enabledChannels?: NotificationChannelValue[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkReadRequest {
  notificationIds: string[];
}

export interface UpdatePreferencesRequest {
  channel: 'email' | 'sms' | 'push' | 'inApp';
  settings: {
    enabled?: boolean;
    address?: string;
    number?: string;
    token?: string;
    frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
    sound?: boolean;
    vibration?: boolean;
    showBadge?: boolean;
  };
}

export interface UpdateTypeRequest {
  enabled: boolean;
}

export interface TestNotificationRequest {
  channel: NotificationChannelValue;
  type?: NotificationTypeValue;
}

class NotificationService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();
  private browserNotificationEnabled = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  // Get notifications with pagination and filters
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.unreadOnly) searchParams.append('unreadOnly', params.unreadOnly.toString());
    
    const response = await api.get(`/notifications?${searchParams.toString()}`);
    return response.data.data;
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unreadCount;
  }

  // Get specific notification
  async getNotification(id: string): Promise<Notification> {
    const response = await api.get(`/notifications/${id}`);
    return response.data.data.notification;
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
    // Track read event
    await this.trackNotificationEvent('read', {
      notificationId: id,
      channel: 'in_app',
      metadata: { action: 'mark_as_read' }
    });
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<{ modifiedCount: number }> {
    const response = await api.post('/notifications/mark-read', { notificationIds });
    return response.data.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await api.post('/notifications/mark-all-read');
    return response.data.data;
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreference> {
    const response = await api.get('/notifications/preferences');
    return response.data.data.preferences;
  }

  // Update notification preferences
  async updatePreferences(request: UpdatePreferencesRequest): Promise<NotificationPreference> {
    const response = await api.patch('/notifications/preferences', request);
    return response.data.data.preferences;
  }

  // Update specific notification type setting
  async updateTypeSetting(
    channel: string,
    type: string,
    enabled: boolean
  ): Promise<NotificationPreference> {
    const response = await api.patch(`/notifications/preferences/${channel}/${type}`, { enabled });
    return response.data.data.preferences;
  }

  // Get available notification types
  async getNotificationTypes(): Promise<NotificationType[]> {
    const response = await api.get('/notifications/types');
    return response.data.data.notificationTypes;
  }

  // Get available notification channels
  async getNotificationChannels(): Promise<NotificationChannel[]> {
    const response = await api.get('/notifications/channels');
    return response.data.data.channels;
  }

  // Send test notification
  async sendTestNotification(request: TestNotificationRequest): Promise<Notification> {
    const response = await api.post('/notifications/test', request);
    return response.data.data.notification;
  }

  // Utility functions
  getNotificationTypeInfo(type: NotificationTypeValue): {
    label: string;
    color: string;
    icon: string;
    description: string;
  } {
    const typeInfo: Record<NotificationTypeValue, {
      label: string;
      color: string;
      icon: string;
      description: string;
    }> = {
      booking_confirmation: {
        label: 'Booking Confirmation',
        color: 'bg-green-100 text-green-800',
        icon: 'check-circle',
        description: 'Your booking has been confirmed'
      },
      booking_reminder: {
        label: 'Booking Reminder',
        color: 'bg-blue-100 text-blue-800',
        icon: 'clock',
        description: 'Reminder about your upcoming booking'
      },
      booking_cancellation: {
        label: 'Booking Cancellation',
        color: 'bg-red-100 text-red-800',
        icon: 'x-circle',
        description: 'Your booking has been cancelled'
      },
      payment_success: {
        label: 'Payment Success',
        color: 'bg-green-100 text-green-800',
        icon: 'credit-card',
        description: 'Payment processed successfully'
      },
      payment_failed: {
        label: 'Payment Failed',
        color: 'bg-red-100 text-red-800',
        icon: 'alert-circle',
        description: 'Payment processing failed'
      },
      loyalty_points: {
        label: 'Loyalty Points',
        color: 'bg-purple-100 text-purple-800',
        icon: 'star',
        description: 'Loyalty points update'
      },
      service_booking: {
        label: 'Service Booking',
        color: 'bg-indigo-100 text-indigo-800',
        icon: 'calendar',
        description: 'Hotel service booking confirmation'
      },
      service_reminder: {
        label: 'Service Reminder',
        color: 'bg-blue-100 text-blue-800',
        icon: 'bell',
        description: 'Reminder about scheduled service'
      },
      promotional: {
        label: 'Promotional',
        color: 'bg-yellow-100 text-yellow-800',
        icon: 'gift',
        description: 'Special offers and promotions'
      },
      system_alert: {
        label: 'System Alert',
        color: 'bg-orange-100 text-orange-800',
        icon: 'alert-triangle',
        description: 'Important system notification'
      },
      welcome: {
        label: 'Welcome',
        color: 'bg-green-100 text-green-800',
        icon: 'heart',
        description: 'Welcome message'
      },
      check_in: {
        label: 'Check-in',
        color: 'bg-blue-100 text-blue-800',
        icon: 'log-in',
        description: 'Check-in related notification'
      },
      check_out: {
        label: 'Check-out',
        color: 'bg-gray-100 text-gray-800',
        icon: 'log-out',
        description: 'Check-out related notification'
      },
      review_request: {
        label: 'Review Request',
        color: 'bg-purple-100 text-purple-800',
        icon: 'message-square',
        description: 'Request to review your stay'
      },
      special_offer: {
        label: 'Special Offer',
        color: 'bg-pink-100 text-pink-800',
        icon: 'tag',
        description: 'Exclusive offer for you'
      }
    };

    return typeInfo[type] || {
      label: 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      icon: 'help-circle',
      description: 'Unknown notification type'
    };
  }

  getPriorityInfo(priority: string): {
    label: string;
    color: string;
    icon: string;
  } {
    const priorityInfo: Record<string, { label: string; color: string; icon: string }> = {
      low: {
        label: 'Low',
        color: 'bg-gray-100 text-gray-800',
        icon: 'minus'
      },
      medium: {
        label: 'Medium',
        color: 'bg-blue-100 text-blue-800',
        icon: 'circle'
      },
      high: {
        label: 'High',
        color: 'bg-orange-100 text-orange-800',
        icon: 'alert-triangle'
      },
      urgent: {
        label: 'Urgent',
        color: 'bg-red-100 text-red-800',
        icon: 'alert-octagon'
      }
    };

    return priorityInfo[priority] || priorityInfo.medium;
  }

  getStatusInfo(status: string): {
    label: string;
    color: string;
    description: string;
  } {
    const statusInfo: Record<string, { label: string; color: string; description: string }> = {
      pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Notification is waiting to be sent'
      },
      sent: {
        label: 'Sent',
        color: 'bg-blue-100 text-blue-800',
        description: 'Notification has been sent'
      },
      delivered: {
        label: 'Delivered',
        color: 'bg-green-100 text-green-800',
        description: 'Notification has been delivered'
      },
      failed: {
        label: 'Failed',
        color: 'bg-red-100 text-red-800',
        description: 'Notification delivery failed'
      },
      read: {
        label: 'Read',
        color: 'bg-gray-100 text-gray-800',
        description: 'Notification has been read'
      }
    };

    return statusInfo[status] || statusInfo.pending;
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  }

  isUnread(notification: Notification): boolean {
    // A notification is unread if it doesn't have a readAt timestamp
    return !notification.readAt;
  }

  canMarkAsRead(notification: Notification): boolean {
    return this.isUnread(notification);
  }

  canDelete(notification: Notification): boolean {
    return true; // Users can delete any notification
  }

  // Connect to SSE stream for real-time notifications
  connectToStream(token?: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    const url = `${baseUrl}/notifications/stream`;

    this.eventSource = new EventSource(url, {
      withCredentials: true
    });

    this.eventSource.onopen = () => {
      console.log('Connected to notification stream');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'notification') {
          this.handleNewNotification(data.data);
        } else if (data.type === 'connection') {
          console.log('Notification stream connected:', data.message);
        }
      } catch (error) {
        console.error('Failed to parse notification data:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      this.eventSource?.close();

      // Reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay *= 2;
          this.connectToStream(token);
        }, this.reconnectDelay);
      }
    };
  }

  // Disconnect from SSE stream
  disconnectStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.listeners.clear();
  }

  // Handle new notification
  private handleNewNotification(notification: Notification) {
    // Notify all listeners
    this.listeners.forEach(callbacks => {
      callbacks.forEach(callback => callback(notification));
    });

    // Request browser notification permission if urgent
    if (notification.priority === 'urgent' && 'Notification' in window) {
      this.showBrowserNotification(notification);
    }
  }

  // Show browser notification
  private async showBrowserNotification(notification: Notification) {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: notification._id,
        requireInteraction: notification.priority === 'urgent'
      });
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    }
  }

  // Subscribe to notifications
  subscribe(key: string, callback: (notification: Notification) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  // Request browser notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Get notification summary
  async getSummary() {
    const response = await api.get('/notifications/summary');
    return response.data.data;
  }

  // Initialize browser notifications
  async initializeBrowserNotifications(): Promise<boolean> {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.warn('Browser notifications not supported');
        return false;
      }

      // Register service worker for advanced notification features
      if ('serviceWorker' in navigator) {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw-notifications.js', {
          scope: '/'
        });
        console.log('Notification service worker registered');
      }

      // Request permission if not already granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        this.browserNotificationEnabled = permission === 'granted';
      } else {
        this.browserNotificationEnabled = Notification.permission === 'granted';
      }

      return this.browserNotificationEnabled;
    } catch (error) {
      console.error('Failed to initialize browser notifications:', error);
      return false;
    }
  }

  // Send browser notification
  async sendBrowserNotification(notification: Notification): Promise<void> {
    if (!this.browserNotificationEnabled) {
      return;
    }

    // Don't show browser notification if page is visible and focused
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      return;
    }

    try {
      const typeInfo = this.getNotificationTypeInfo(notification.type);
      const priorityInfo = this.getPriorityInfo(notification.priority);

      const options: NotificationOptions = {
        body: notification.message,
        icon: this.getNotificationIcon(notification.type),
        badge: '/badge-icon.png',
        tag: `pentouz-${notification._id}`,
        data: {
          id: notification._id,
          type: notification.type,
          url: this.getNotificationUrl(notification),
          timestamp: Date.now()
        },
        requireInteraction: notification.priority === 'urgent',
        silent: false,
        vibrate: [200, 100, 200]
      };

      // Add action buttons for certain notification types
      if (notification.type === 'service_request' || notification.type === 'guest_request') {
        options.actions = [
          {
            action: 'accept',
            title: 'Accept'
          },
          {
            action: 'view',
            title: 'View Details'
          }
        ];
      }

      const browserNotification = new Notification(
        `THE PENTOUZ - ${notification.title}`,
        options
      );

      // Auto-close non-urgent notifications after 8 seconds
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 8000);
      }

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        const url = this.getNotificationUrl(notification);
        if (url) {
          window.location.href = url;
        }
        browserNotification.close();
      };

      // Track notification display
      await this.trackNotificationEvent('delivered', {
        notificationId: notification._id,
        channel: 'browser',
        metadata: {
          category: notification.metadata?.category || 'general',
          priority: notification.priority,
          type: notification.type
        }
      });

    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  }

  // Get notification icon based on type
  private getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      booking_confirmation: '/icons/booking.png',
      booking_reminder: '/icons/reminder.png',
      payment_success: '/icons/payment.png',
      payment_failed: '/icons/alert.png',
      service_request: '/icons/service.png',
      guest_request: '/icons/guest.png',
      maintenance_alert: '/icons/maintenance.png',
      inventory_alert: '/icons/inventory.png',
      system_alert: '/icons/system.png',
      check_in: '/icons/checkin.png',
      check_out: '/icons/checkout.png',
      promotional: '/icons/offer.png',
      special_offer: '/icons/special.png'
    };

    return iconMap[type] || '/favicon.ico';
  }

  // Get notification URL for navigation
  private getNotificationUrl(notification: Notification): string {
    const urlMap: Record<string, string> = {
      booking_confirmation: `/bookings/${notification.metadata?.bookingId}`,
      booking_reminder: `/bookings/${notification.metadata?.bookingId}`,
      payment_success: `/payments/${notification.metadata?.paymentId}`,
      payment_failed: `/payments/${notification.metadata?.paymentId}`,
      service_request: `/services/${notification.metadata?.serviceId}`,
      guest_request: `/requests/${notification.metadata?.requestId}`,
      maintenance_alert: `/maintenance/${notification.metadata?.maintenanceId}`,
      inventory_alert: `/inventory`,
      system_alert: `/admin/alerts`,
      check_in: `/bookings/${notification.metadata?.bookingId}`,
      check_out: `/bookings/${notification.metadata?.bookingId}`,
      promotional: `/offers`,
      special_offer: `/offers/${notification.metadata?.offerId}`
    };

    return urlMap[notification.type] || '/notifications';
  }

  // Track notification events for analytics
  async trackNotificationEvent(
    event: 'sent' | 'delivered' | 'read' | 'clicked' | 'dismissed' | 'failed',
    options: {
      notificationId?: string;
      channel?: 'in_app' | 'browser' | 'email' | 'sms' | 'push';
      metadata?: Record<string, any>;
      deviceInfo?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      await api.post('/analytics/notification-events', {
        event,
        notificationId: options.notificationId,
        channel: options.channel || 'in_app',
        metadata: {
          category: 'general',
          priority: 'normal',
          source: 'system',
          ...options.metadata,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        },
        deviceInfo: {
          platform: navigator.platform,
          isMobile: /mobile/i.test(navigator.userAgent),
          browser: this.getBrowserInfo(),
          ...options.deviceInfo
        }
      });
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  // Get browser information
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Enhanced notification handler with browser notifications
  private handleNewNotification = (notification: Notification): void => {
    // Trigger browser notification
    this.sendBrowserNotification(notification);

    // Continue with existing logic
    this.listeners.get('new')?.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  };

  // Get notification preferences from user settings
  async getNotificationPreferences(): Promise<any> {
    try {
      const response = await api.get('/user-preferences/notifications');
      return response.data.data.notifications;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {
        channels: { inApp: true, email: true, sms: false, push: true },
        sound: true,
        desktop: true
      };
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences: any): Promise<void> {
    try {
      await api.put('/user-preferences/notifications', preferences);

      // Update browser notification enabled state
      this.browserNotificationEnabled = preferences.channels?.push || false;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  }

  // Clear all browser notifications
  clearAllBrowserNotifications(): void {
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.getNotifications().then(notifications => {
        notifications.forEach(notification => {
          if (notification.tag?.startsWith('pentouz-')) {
            notification.close();
          }
        });
      });
    }
  }

  // Schedule a browser notification for later
  async scheduleNotification(notification: Notification, delay: number): Promise<void> {
    if (!this.browserNotificationEnabled) {
      return;
    }

    setTimeout(() => {
      this.sendBrowserNotification(notification);
    }, delay);
  }
}

export const notificationService = new NotificationService();
