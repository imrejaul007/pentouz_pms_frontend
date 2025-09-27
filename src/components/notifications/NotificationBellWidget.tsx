import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: string;
  readAt?: string;
  createdAt: string;
  metadata?: {
    category?: string;
  };
}

interface NotificationBellWidgetProps {
  className?: string;
  showPreview?: boolean;
  maxPreviewItems?: number;
}

export const NotificationBellWidget: React.FC<NotificationBellWidgetProps> = ({
  className = '',
  showPreview = true,
  maxPreviewItems = 5
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiRequest('/api/v1/notifications/unread-count');
      return response.data.unreadCount;
    },
    refetchInterval: 30000
  });

  // Fetch recent notifications for preview
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'preview'],
    queryFn: async () => {
      const response = await apiRequest(`/api/v1/notifications?limit=${maxPreviewItems}&unreadOnly=true`);
      return response.data.notifications;
    },
    refetchInterval: 30000,
    enabled: showPreview
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/v1/notifications/mark-all-read', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsOpen(false);
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateToNotifications = () => {
    const basePath = user?.role === 'admin' ? '/admin' :
                    user?.role === 'staff' ? '/staff' : '/guest';
    navigate(`${basePath}/notifications`);
    setIsOpen(false);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const hasUrgentNotifications = notifications.some(n => n.priority === 'urgent');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          hasUrgentNotifications
            ? 'text-red-600 hover:bg-red-50'
            : unreadCount > 0
            ? 'text-blue-600 hover:bg-blue-50'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Bell className={`w-5 h-5 ${hasUrgentNotifications ? 'animate-pulse' : ''}`} />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold ${
            hasUrgentNotifications ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Urgent Indicator */}
        {hasUrgentNotifications && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && showPreview && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`px-4 py-3 border-l-2 ${getPriorityColor(notification.priority)} hover:bg-gray-50 cursor-pointer`}
                    onClick={() => {
                      if (!notification.readAt) {
                        markAsReadMutation.mutate(notification._id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(notification.priority)}
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.metadata?.category && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs capitalize">
                              {notification.metadata.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {!notification.readAt && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification._id)}
                          className="p-1 hover:bg-white rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-gray-500 hover:text-green-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleNavigateToNotifications}
              className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-1"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBellWidget;