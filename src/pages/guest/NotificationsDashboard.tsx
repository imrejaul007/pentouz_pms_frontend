import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Filter, 
  Search, 
  Check, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  CreditCard,
  Calendar,
  Gift,
  Heart,
  LogIn,
  LogOut,
  MessageSquare,
  Tag,
  HelpCircle,
  Minus,
  Circle,
  AlertTriangle,
  AlertOctagon,
  Mail,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { notificationService, Notification, NotificationType, NotificationChannel, NotificationPreference } from '../../services/notificationService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PushNotificationSetup } from '../../components/notifications/PushNotificationSetup';
import { useRealTime } from '../../services/realTimeService';
import toast from 'react-hot-toast';

export default function NotificationsDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    unreadOnly: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');

  const queryClient = useQueryClient();
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // Real-time WebSocket connection setup - FIXED: Don't disconnect singleton service
  useEffect(() => {
    connect().catch(error => {
      console.error('[NotificationsDashboard] WebSocket connection failed:', error);
    });
    return () => {
      console.log('[NotificationsDashboard] Component unmounting, keeping singleton connection active');
      // Don't disconnect on unmount as other components may be using the same connection
    };
  }, [connect]);

  // Real-time event listeners for notifications
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const handleNewNotification = (data: any) => {
      console.log('New notification received:', data);
      const newNotification = data.notification;
      
      // Add new notification to the cache
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: [newNotification, ...oldData.notifications],
          unreadCount: oldData.unreadCount + 1
        };
      });

      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

      // Show toast notification
      const typeInfo = notificationService.getNotificationTypeInfo(newNotification.type);
      toast.success(newNotification.title, {
        duration: 5000,
        icon: typeInfo.icon === 'bell' ? '🔔' : '📢',
        action: {
          label: 'View',
          onClick: () => {
            // Mark as read when viewed
            markAsReadMutation.mutate(newNotification._id);
          },
        },
      });
    };

    const handleNotificationRead = (data: any) => {
      console.log('Notification marked as read:', data);
      const notificationId = data.notificationId;
      
      // Update the notification in cache
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map((n: Notification) =>
            n._id === notificationId ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, oldData.unreadCount - 1)
        };
      });

      // Update unread count
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    };

    const handleNotificationDelivered = (data: any) => {
      console.log('Notification delivered:', data);
      const notificationId = data.notificationId;
      
      // Update delivery status in cache
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map((n: Notification) =>
            n._id === notificationId ? { ...n, status: 'delivered', deliveredAt: new Date().toISOString() } : n
          )
        };
      });
    };

    const handleNotificationFailed = (data: any) => {
      console.log('Notification delivery failed:', data);
      const notificationId = data.notificationId;
      
      // Update failure status in cache
      queryClient.setQueryData(['notifications'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map((n: Notification) =>
            n._id === notificationId ? { ...n, status: 'failed' } : n
          )
        };
      });

      toast.error('Notification delivery failed', {
        duration: 3000,
        icon: '⚠️'
      });
    };

    const handleBulkNotificationUpdate = (data: any) => {
      console.log('Bulk notification update:', data);
      
      // Refresh notifications data
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

      toast.success(`${data.count} notifications updated`, {
        duration: 3000,
        icon: '📬'
      });
    };

    // Set up event listeners
    on('notification:new', handleNewNotification);
    on('notification:read', handleNotificationRead);
    on('notification:delivered', handleNotificationDelivered);
    on('notification:failed', handleNotificationFailed);
    on('notifications:bulk-update', handleBulkNotificationUpdate);

    return () => {
      off('notification:new', handleNewNotification);
      off('notification:read', handleNotificationRead);
      off('notification:delivered', handleNotificationDelivered);
      off('notification:failed', handleNotificationFailed);
      off('notifications:bulk-update', handleBulkNotificationUpdate);
    };
  }, [connectionState, on, off, queryClient, markAsReadMutation]);

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError
  } = useQuery({
    queryKey: ['notifications', currentPage, filters, searchTerm],
    queryFn: () => notificationService.getNotifications({
      page: currentPage,
      limit: 20,
      ...filters,
      ...(searchTerm && { search: searchTerm })
    }),
    keepPreviousData: true
  });

  // Fetch notification types
  const {
    data: notificationTypes,
    isLoading: isLoadingTypes
  } = useQuery({
    queryKey: ['notificationTypes'],
    queryFn: notificationService.getNotificationTypes
  });

  // Fetch notification channels
  const {
    data: notificationChannels,
    isLoading: isLoadingChannels
  } = useQuery({
    queryKey: ['notificationChannels'],
    queryFn: notificationService.getNotificationChannels
  });

  // Fetch preferences
  const {
    data: preferences,
    isLoading: isLoadingPreferences
  } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: notificationService.getPreferences,
    enabled: activeTab === 'preferences'
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
      toast.success('Notification marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark notification as read');
    }
  });

  const markMultipleAsReadMutation = useMutation({
    mutationFn: notificationService.markMultipleAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
      setSelectedNotifications([]);
      toast.success('Notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark notifications as read');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error('Failed to mark all notifications as read');
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
      toast.success('Notification deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete notification');
    }
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: notificationService.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      toast.success('Preferences updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
    }
  });

  const updateTypeSettingMutation = useMutation({
    mutationFn: ({ channel, type, enabled }: { channel: string; type: string; enabled: boolean }) =>
      notificationService.updateTypeSetting(channel, type, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      toast.success('Notification setting updated');
    },
    onError: (error) => {
      toast.error('Failed to update notification setting');
    }
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Handle notification selection
  const handleNotificationSelect = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (notificationsData?.notifications) {
      const allIds = notificationsData.notifications.map(n => n._id);
      setSelectedNotifications(prev => 
        prev.length === allIds.length ? [] : allIds
      );
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Handle mark multiple as read
  const handleMarkMultipleAsRead = () => {
    if (selectedNotifications.length > 0) {
      markMultipleAsReadMutation.mutate(selectedNotifications);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle delete notification
  const handleDeleteNotification = (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      deleteNotificationMutation.mutate(notificationId);
    }
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'check-circle': CheckCircle,
      'clock': Clock,
      'x-circle': XCircle,
      'credit-card': CreditCard,
      'alert-circle': AlertCircle,
      'star': Star,
      'calendar': Calendar,
      'bell': Bell,
      'gift': Gift,
      'alert-triangle': AlertTriangle,
      'heart': Heart,
      'log-in': LogIn,
      'log-out': LogOut,
      'message-square': MessageSquare,
      'tag': Tag,
      'help-circle': HelpCircle,
      'minus': Minus,
      'circle': Circle,
      'alert-octagon': AlertOctagon,
      'mail': Mail,
      'message-circle': MessageCircle,
      'smartphone': Smartphone
    };
    return iconMap[iconName] || HelpCircle;
  };

  if (isLoadingNotifications || isLoadingTypes || isLoadingChannels) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Notifications</h1>
            <div className="flex items-center space-x-4 mt-1 sm:mt-2">
              <p className="text-sm sm:text-base text-gray-600">
                Stay updated with your hotel activities and important information
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionState === 'connected' ? 'bg-green-500' : 
                  connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500">
                  {connectionState === 'connected' ? 'Live Updates' : 
                   connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 sm:flex-shrink-0">
            {notificationsData?.unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading}
                className="flex items-center justify-center space-x-2 min-h-[2.5rem] text-sm"
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">Mark Read</span>
              </Button>
            )}
          </div>
        </div>

        {/* Unread count badge */}
        {notificationsData?.unreadCount > 0 && (
          <div className="mt-3 sm:mt-4 inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <Bell className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {notificationsData.unreadCount} unread notification{notificationsData.unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4 sm:mb-6">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {activeTab === 'notifications' ? (
        <>
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      {notificationTypes?.map((type) => (
                        <option key={type.type} value={type.type}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.unreadOnly}
                        onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Unread only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={handleMarkMultipleAsRead}
                    disabled={markMultipleAsReadMutation.isLoading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark as Read
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="space-y-4">
            {notificationsData?.notifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {searchTerm || Object.values(filters).some(f => f !== '' && f !== false)
                    ? 'No notifications match your current filters.'
                    : 'You\'re all caught up! No new notifications.'
                  }
                </p>
              </Card>
            ) : (
              notificationsData?.notifications.map((notification) => (
                <NotificationCard
                  key={notification._id}
                  notification={notification}
                  isSelected={selectedNotifications.includes(notification._id)}
                  onSelect={() => handleNotificationSelect(notification._id)}
                  onMarkAsRead={() => handleMarkAsRead(notification._id)}
                  onDelete={() => handleDeleteNotification(notification._id)}
                  getIconComponent={getIconComponent}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {notificationsData?.pagination.totalPages > 1 && (
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing {((notificationsData.pagination.currentPage - 1) * notificationsData.pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(notificationsData.pagination.currentPage * notificationsData.pagination.itemsPerPage, notificationsData.pagination.totalItems)} of{' '}
                  {notificationsData.pagination.totalItems} results
                </div>
                <div className="flex justify-center sm:justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="text-sm px-3 py-2"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(notificationsData.pagination.totalPages, prev + 1))}
                    disabled={currentPage === notificationsData.pagination.totalPages}
                    className="text-sm px-3 py-2"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <NotificationPreferences
          preferences={preferences}
          isLoading={isLoadingPreferences}
          notificationTypes={notificationTypes}
          notificationChannels={notificationChannels}
          onUpdatePreferences={updatePreferencesMutation.mutate}
          onUpdateTypeSetting={updateTypeSettingMutation.mutate}
        />
      )}
    </div>
  );
}

// Notification Card Component
interface NotificationCardProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
  getIconComponent: (iconName: string) => React.ComponentType<any>;
}

function NotificationCard({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
  getIconComponent
}: NotificationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const typeInfo = notificationService.getNotificationTypeInfo(notification.type as any);
  const priorityInfo = notificationService.getPriorityInfo(notification.priority);
  const statusInfo = notificationService.getStatusInfo(notification.status);
  const isUnread = notificationService.isUnread(notification);
  const IconComponent = getIconComponent(typeInfo.icon);

  return (
    <Card className={`p-3 sm:p-4 transition-all duration-200 ${isUnread ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''}`}>
      <div className="flex items-start space-x-3 sm:space-x-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
        />

        {/* Icon */}
        <div className={`p-1.5 sm:p-2 rounded-full ${typeInfo.color} flex-shrink-0`}>
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-gray-900 leading-tight">
                  {notification.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color} flex-shrink-0`}>
                    {priorityInfo.label}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color} flex-shrink-0`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 mb-2 leading-relaxed">{notification.message}</p>
              
              {/* Metadata */}
              {notification.metadata && (
                <div className="text-xs text-gray-500 space-y-1">
                  {notification.metadata.bookingId && (
                    <div>Booking: {notification.metadata.bookingId.bookingNumber}</div>
                  )}
                  {notification.metadata.paymentId && (
                    <div>Payment: ₹{notification.metadata.paymentId.amount} {notification.metadata.paymentId.currency}</div>
                  )}
                  {notification.metadata.loyaltyTransactionId && (
                    <div>Loyalty: {notification.metadata.loyaltyTransactionId.points} points</div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{notificationService.formatTimeAgo(notification.createdAt)}</span>
                {notification.channels.length > 0 && (
                  <span>via {notification.channels.join(', ')}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="p-1"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {showActions && (
                <div className="absolute right-0 top-8 z-10 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[120px]">
                  {isUnread && (
                    <button
                      onClick={() => {
                        onMarkAsRead();
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Notification Preferences Component
interface NotificationPreferencesProps {
  preferences?: NotificationPreference;
  isLoading: boolean;
  notificationTypes?: NotificationType[];
  notificationChannels?: NotificationChannel[];
  onUpdatePreferences: (request: any) => void;
  onUpdateTypeSetting: (request: { channel: string; type: string; enabled: boolean }) => void;
}

function NotificationPreferences({
  preferences,
  isLoading,
  notificationTypes,
  notificationChannels,
  onUpdatePreferences,
  onUpdateTypeSetting
}: NotificationPreferencesProps) {
  const [activeChannel, setActiveChannel] = useState('email');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!preferences || !notificationTypes || !notificationChannels) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading preferences</h3>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'check-circle': CheckCircle,
      'clock': Clock,
      'x-circle': XCircle,
      'credit-card': CreditCard,
      'alert-circle': AlertCircle,
      'star': Star,
      'calendar': Calendar,
      'bell': Bell,
      'gift': Gift,
      'alert-triangle': AlertTriangle,
      'heart': Heart,
      'log-in': LogIn,
      'log-out': LogOut,
      'message-square': MessageSquare,
      'tag': Tag,
      'help-circle': HelpCircle,
      'minus': Minus,
      'circle': Circle,
      'alert-octagon': AlertOctagon,
      'mail': Mail,
      'message-circle': MessageCircle,
      'smartphone': Smartphone
    };
    return iconMap[iconName] || HelpCircle;
  };

  const getChannelIcon = (channelId: string) => {
    const channel = notificationChannels.find(c => c.id === channelId);
    return channel ? getIconComponent(channel.icon) : HelpCircle;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Channel Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {notificationChannels.map((channel) => {
            const IconComponent = getChannelIcon(channel.id);
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap flex-shrink-0 ${
                  activeChannel === channel.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4 flex-shrink-0" />
                <span>{channel.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Channel Settings */}
      {notificationChannels.map((channel) => {
        if (activeChannel !== channel.id) return null;

        const channelPrefs = preferences[channel.id as keyof NotificationPreference] as any;
        const isEnabled = channelPrefs?.enabled;

        return (
          <div key={channel.id} className="space-y-6">
            {/* Channel Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{channel.name}</h3>
                <p className="text-sm text-gray-600">{channel.description}</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => onUpdatePreferences({
                    channel: channel.id,
                    settings: { enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable {channel.name}</span>
              </label>
            </div>

            {isEnabled && (
              <div className="space-y-4">
                {/* Contact Information */}
                {(channel.id === 'email' || channel.id === 'sms') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {channel.id === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <Input
                      type={channel.id === 'email' ? 'email' : 'tel'}
                      value={channelPrefs[channel.id === 'email' ? 'address' : 'number'] || ''}
                      onChange={(e) => onUpdatePreferences({
                        channel: channel.id,
                        settings: { [channel.id === 'email' ? 'address' : 'number']: e.target.value }
                      })}
                      placeholder={channel.id === 'email' ? 'Enter email address' : 'Enter phone number'}
                    />
                  </div>
                )}

                {/* Frequency (if supported) */}
                {channel.supportsFrequency && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={channelPrefs.frequency || 'immediate'}
                      onChange={(e) => onUpdatePreferences({
                        channel: channel.id,
                        settings: { frequency: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      {channel.id === 'email' && <option value="weekly">Weekly</option>}
                    </select>
                  </div>
                )}

                {/* Quiet Hours (if supported) */}
                {channel.supportsQuietHours && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Quiet Hours</label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={channelPrefs.quietHours?.enabled || false}
                          onChange={(e) => onUpdatePreferences({
                            channel: channel.id,
                            settings: {
                              quietHours: {
                                ...channelPrefs.quietHours,
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Enable</span>
                      </label>
                    </div>
                    {channelPrefs.quietHours?.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                          <Input
                            type="time"
                            value={channelPrefs.quietHours.start || '22:00'}
                            onChange={(e) => onUpdatePreferences({
                              channel: channel.id,
                              settings: {
                                quietHours: {
                                  ...channelPrefs.quietHours,
                                  start: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Time</label>
                          <Input
                            type="time"
                            value={channelPrefs.quietHours.end || '08:00'}
                            onChange={(e) => onUpdatePreferences({
                              channel: channel.id,
                              settings: {
                                quietHours: {
                                  ...channelPrefs.quietHours,
                                  end: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* In-App specific settings */}
                {channel.id === 'in_app' && (
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={channelPrefs.sound || false}
                        onChange={(e) => onUpdatePreferences({
                          channel: channel.id,
                          settings: { sound: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Play sound</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={channelPrefs.vibration || false}
                        onChange={(e) => onUpdatePreferences({
                          channel: channel.id,
                          settings: { vibration: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vibrate</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={channelPrefs.showBadge || false}
                        onChange={(e) => onUpdatePreferences({
                          channel: channel.id,
                          settings: { showBadge: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Show badge count</span>
                    </label>
                  </div>
                )}

                {/* Notification Types */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notificationTypes.map((type) => (
                      <label key={type.type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={channelPrefs.types?.[type.type as any] !== false}
                          onChange={(e) => onUpdateTypeSetting(channel.id, type.type, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
