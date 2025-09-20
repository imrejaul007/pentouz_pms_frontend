import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Package,
  IndianRupee,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../LoadingSpinner';
import { formatRelativeTime } from '../../utils/dashboardUtils';
import { formatCurrency } from '../../utils/formatters';

interface InventoryNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  isRead: boolean;
  metadata?: {
    roomNumber?: string;
    roomId?: string;
    guestName?: string;
    totalCharges?: number;
    itemsCount?: number;
    items?: Array<{
      itemName?: string;
      condition?: string;
      reason?: string;
      cost?: number;
    }>;
  };
}

interface InventoryNotificationsProps {
  className?: string;
  showAll?: boolean;
  onClose?: () => void;
}

export function InventoryNotifications({ 
  className = '', 
  showAll = false, 
  onClose 
}: InventoryNotificationsProps) {
  const [notifications, setNotifications] = useState<InventoryNotification[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<string[]>([]);

  useEffect(() => {
    if (showAll) {
      fetchNotifications();
    } else {
      fetchSummary();
    }
  }, [showAll]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/inventory-notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch inventory notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/inventory-notifications/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory notification summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      setMarkingRead(prev => [...prev, ...notificationIds]);
      
      const response = await fetch('/api/v1/inventory-notifications/mark-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        // Update local state
        if (showAll) {
          setNotifications(prev => 
            prev.map(notification => 
              notificationIds.includes(notification.id) 
                ? { ...notification, isRead: true }
                : notification
            )
          );
        } else {
          setSummary(prev => ({
            ...prev,
            unread: Math.max(0, prev.unread - notificationIds.length),
            recent: prev.recent.map((notification: any) => 
              notificationIds.includes(notification.id) 
                ? { ...notification, isRead: true }
                : notification
            )
          }));
        }
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    } finally {
      setMarkingRead(prev => prev.filter(id => !notificationIds.includes(id)));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory_damage':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'inventory_missing':
        return <Package className="h-5 w-5 text-red-600" />;
      case 'inventory_guest_charged':
        return <IndianRupee className="h-5 w-5 text-green-600" />;
      case 'checkout_inspection_failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'inventory_low_stock':
        return <Package className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (showAll) {
    return (
      <Card className={`max-w-4xl mx-auto ${className}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Inventory Notifications</h2>
                <p className="text-gray-600">Recent inventory alerts and issues</p>
              </div>
            </div>
            {onClose && (
              <Button onClick={onClose} variant="secondary" size="sm">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No inventory notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{notification.message}</p>
                        
                        {/* Metadata Details */}
                        {notification.metadata && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {notification.metadata.roomNumber && (
                              <p>📍 Room {notification.metadata.roomNumber}</p>
                            )}
                            {notification.metadata.guestName && (
                              <p>👤 Guest: {notification.metadata.guestName}</p>
                            )}
                            {notification.metadata.totalCharges && (
                              <p>💰 Charges: {formatCurrency(notification.metadata.totalCharges)}</p>
                            )}
                            {notification.metadata.items && notification.metadata.items.length > 0 && (
                              <div className="mt-2">
                                <p className="font-medium">Affected items:</p>
                                <ul className="ml-4 space-y-1">
                                  {notification.metadata.items.map((item, index) => (
                                    <li key={index} className="text-xs">
                                      • {item.itemName} - {item.condition || item.reason}
                                      {item.cost && ` (${formatCurrency(item.cost)})`}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <Button
                          onClick={() => markAsRead([notification.id])}
                          disabled={markingRead.includes(notification.id)}
                          size="sm"
                          variant="secondary"
                        >
                          {markingRead.includes(notification.id) ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Summary view for dashboard
  if (!summary) return null;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
            <p className="text-sm text-gray-600">Recent inventory notifications</p>
          </div>
        </div>
        {summary.unread > 0 && (
          <Badge className="bg-red-100 text-red-800">
            {summary.unread} unread
          </Badge>
        )}
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {Object.entries(summary.categories).map(([key, count]) => (
          <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{count as number}</div>
            <div className="text-xs text-gray-600 capitalize">{key.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Recent Notifications */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Recent Alerts</h4>
        {summary.recent.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent notifications</p>
        ) : (
          summary.recent.map((notification: any) => (
            <div
              key={notification.id}
              className={`p-3 border rounded-lg ${
                notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t flex justify-between">
        <Button
          onClick={() => window.location.href = '/admin/inventory-notifications'}
          variant="secondary"
          size="sm"
        >
          View All
        </Button>
        {summary.unread > 0 && (
          <Button
            onClick={() => markAsRead(summary.recent.filter((n: any) => !n.isRead).map((n: any) => n.id))}
            size="sm"
          >
            Mark All Read
          </Button>
        )}
      </div>
    </Card>
  );
}