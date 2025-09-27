import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealTime } from '../services/realTimeService';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // Real-time connection is managed externally - no auto-connect

  // Real-time event listeners
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const handleNewNotification = (data: any) => {
      console.log('New notification received globally:', data);
      const newNotification = data.notification;
      
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
      
      // Show toast notification
      const typeInfo = notificationService.getNotificationTypeInfo(newNotification.type);
      toast.success(newNotification.title, {
        duration: 5000,
        icon: getEmojiForNotificationType(newNotification.type),
      });
    };

    const handleNotificationRead = (data: any) => {
      console.log('Notification read globally:', data);
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
    };

    const handleNotificationDelivered = (data: any) => {
      console.log('Notification delivered globally:', data);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
    };

    const handleBulkNotificationUpdate = (data: any) => {
      console.log('Bulk notification update globally:', data);
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
    };

    // Set up event listeners
    on('notification:new', handleNewNotification);
    on('notification:read', handleNotificationRead);
    on('notification:delivered', handleNotificationDelivered);
    on('notifications:bulk-update', handleBulkNotificationUpdate);

    return () => {
      off('notification:new', handleNewNotification);
      off('notification:read', handleNotificationRead);
      off('notification:delivered', handleNotificationDelivered);
      off('notifications:bulk-update', handleBulkNotificationUpdate);
    };
  }, [connectionState, on, off, queryClient]);

  // Get unread count with real-time updates
  const { data: unreadCount, isLoading: isLoadingUnreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000, // Fallback polling
    staleTime: 5000
  });

  return {
    unreadCount: unreadCount || 0,
    isLoadingUnreadCount,
    connectionState
  };
}

function getEmojiForNotificationType(type: string): string {
  const emojiMap: Record<string, string> = {
    booking_confirmation: '✅',
    booking_reminder: '⏰',
    booking_cancellation: '❌',
    payment_success: '💳',
    payment_failed: '⚠️',
    loyalty_points: '⭐',
    service_booking: '📅',
    service_reminder: '🔔',
    promotional: '🎁',
    system_alert: '🚨',
    welcome: '👋',
    check_in: '🏨',
    check_out: '👋',
    review_request: '📝',
    special_offer: '🏷️'
  };
  
  return emojiMap[type] || '📢';
}

export function useNotificationStream() {
  const { connect, disconnect, connectionState } = useRealTime();

  useEffect(() => {
    // Auto-connect to notification stream when component mounts
    if (connectionState === 'disconnected') {
      connect();
    }

    // Cleanup on unmount
    return () => {
      // Don't auto-disconnect as other components might be using the connection
    };
  }, [connect, connectionState]);

  return {
    connectionState
  };
}