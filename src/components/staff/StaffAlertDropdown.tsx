import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  X,
  ChevronRight,
  Play,
  Check,
  AlertOctagon,
  Zap,
  Circle
} from 'lucide-react';
import { staffAlertService, StaffAlert } from '../../services/staffAlertService';
import { useRealTime } from '../../services/realTimeService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../LoadingSpinner';
import toast from 'react-hot-toast';

interface StaffAlertDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function StaffAlertDropdown({ isOpen, onToggle }: StaffAlertDropdownProps) {
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // Real-time connection setup
  useEffect(() => {
    if (isOpen) {
      connect();
    }
    return () => {
      if (!isOpen) {
        disconnect();
      }
    };
  }, [isOpen, connect, disconnect]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Real-time event listeners for staff alerts
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const handleNewAlert = (data: any) => {
      console.log('New staff alert received:', data);
      const newAlert = data.alert;
      
      // Update queries immediately
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      
      // Show priority-based toast notification
      const priorityInfo = staffAlertService.getPriorityInfo(newAlert.priority);
      const typeInfo = staffAlertService.getAlertTypeInfo(newAlert.type);
      
      if (staffAlertService.requiresImmediate(newAlert)) {
        toast.error(newAlert.title, {
          duration: 8000,
          icon: '🚨',
        });
      } else if (staffAlertService.isUrgent(newAlert)) {
        toast.error(newAlert.title, {
          duration: 6000,
          icon: '⚠️',
        });
      } else {
        toast.success(newAlert.title, {
          duration: 4000,
          icon: getEmojiForAlertType(newAlert.type),
        });
      }
    };

    const handleAlertUpdated = (data: any) => {
      console.log('Staff alert updated:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
    };

    const handleAlertResolved = (data: any) => {
      console.log('Staff alert resolved:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      
      toast.success(`Alert resolved: ${data.alert.title}`, {
        duration: 3000,
        icon: '✅'
      });
    };

    const handleAlertEscalated = (data: any) => {
      console.log('Staff alert escalated:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      
      toast.error(`Alert escalated: ${data.alert.title}`, {
        duration: 5000,
        icon: '🚨'
      });
    };

    // Set up event listeners
    on('staff-alert:new', handleNewAlert);
    on('staff-alert:updated', handleAlertUpdated);
    on('staff-alert:resolved', handleAlertResolved);
    on('staff-alert:escalated', handleAlertEscalated);

    return () => {
      off('staff-alert:new', handleNewAlert);
      off('staff-alert:updated', handleAlertUpdated);
      off('staff-alert:resolved', handleAlertResolved);
      off('staff-alert:escalated', handleAlertEscalated);
    };
  }, [connectionState, on, off, queryClient]);

  // Fetch alert summary
  const { data: alertSummary } = useQuery({
    queryKey: ['staff-alert-summary'],
    queryFn: staffAlertService.getAlertSummary,
    refetchInterval: 30000,
    enabled: true
  });

  // Fetch recent alerts when dropdown is open
  const {
    data: recentAlerts,
    isLoading: isLoadingAlerts,
  } = useQuery({
    queryKey: ['recent-staff-alerts', showAll],
    queryFn: () => staffAlertService.getRecentAlerts(showAll ? 10 : 5),
    enabled: isOpen,
    refetchInterval: 30000
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: staffAlertService.acknowledgeAlert,
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      toast.success('Alert acknowledged');
    }
  });

  // Start working mutation
  const startWorkingMutation = useMutation({
    mutationFn: staffAlertService.startWorkingOnAlert,
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      toast.success('Started working on alert');
    }
  });

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlertMutation.mutate(alertId);
  };

  const handleStartWorking = (alertId: string) => {
    startWorkingMutation.mutate(alertId);
  };

  const handleViewAllAlerts = () => {
    window.location.href = '/staff/alerts';
    onToggle();
  };

  const getAlertIcon = (alert: StaffAlert) => {
    const typeInfo = staffAlertService.getAlertTypeInfo(alert.type);
    const priorityInfo = staffAlertService.getPriorityInfo(alert.priority);
    
    return (
      <div className={`p-2 rounded-full flex-shrink-0 ${typeInfo.color}`}>
        {staffAlertService.requiresImmediate(alert) ? (
          <Zap className="h-3 w-3 text-current" />
        ) : staffAlertService.isUrgent(alert) ? (
          <AlertTriangle className="h-3 w-3 text-current" />
        ) : (
          <Circle className="h-3 w-3 text-current" />
        )}
      </div>
    );
  };

  const getStatusIcon = (alert: StaffAlert) => {
    switch (alert.status) {
      case 'acknowledged':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'in_progress':
        return <Play className="h-3 w-3 text-yellow-500" />;
      case 'resolved':
        return <Check className="h-3 w-3 text-green-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="relative">
      <div 
        ref={dropdownRef}
        className="absolute right-0 top-2 z-50 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Staff Alerts</h3>
            {alertSummary?.totalUnacknowledged > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {alertSummary.totalUnacknowledged}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {alertSummary && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                {alertSummary.criticalCount > 0 && (
                  <span className="text-red-600 font-medium">
                    🚨 {alertSummary.criticalCount} Critical
                  </span>
                )}
                {alertSummary.urgentCount > 0 && (
                  <span className="text-orange-600 font-medium">
                    ⚠️ {alertSummary.urgentCount} Urgent
                  </span>
                )}
                <span className="text-gray-600">
                  {alertSummary.totalActive} Active
                </span>
              </div>
              {alertSummary.escalatedCount > 0 && (
                <span className="text-red-600 font-medium">
                  ⬆️ {alertSummary.escalatedCount} Escalated
                </span>
              )}
            </div>
          </div>
        )}

        {/* Alerts List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoadingAlerts ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : recentAlerts?.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No active alerts</p>
              <p className="text-xs text-gray-500">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentAlerts?.slice(0, showAll ? 10 : 5).map((alert) => (
                <div
                  key={alert._id}
                  className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                    staffAlertService.requiresImmediate(alert) ? 'bg-red-50 border-l-4 border-l-red-500' :
                    staffAlertService.isUrgent(alert) ? 'bg-orange-50 border-l-4 border-l-orange-500' :
                    alert.status === 'active' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {alert.title}
                        </p>
                        <div className="flex items-center space-x-1 ml-2">
                          {getStatusIcon(alert)}
                          {staffAlertService.isExpiringSoon(alert) && (
                            <Clock className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {alert.message}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{staffAlertService.formatTimeAgo(alert.createdAt)}</span>
                          {alert.metadata?.roomNumber && (
                            <span>• Room {alert.metadata.roomNumber}</span>
                          )}
                          {alert.metadata?.guestName && (
                            <span>• {alert.metadata.guestName}</span>
                          )}
                        </div>
                        
                        {/* Priority Badge */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          staffAlertService.getPriorityInfo(alert.priority).bgColor
                        } ${staffAlertService.getPriorityInfo(alert.priority).color}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      {alert.status === 'active' && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAcknowledgeAlert(alert._id)}
                            disabled={acknowledgeAlertMutation.isLoading}
                            className="text-xs px-2 py-1 h-6"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Ack
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartWorking(alert._id)}
                            disabled={startWorkingMutation.isLoading}
                            className="text-xs px-2 py-1 h-6 text-blue-600"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-xs"
          >
            {showAll ? 'Show Recent' : 'Show All'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleViewAllAlerts}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Alert Center
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function getEmojiForAlertType(type: string): string {
  const emojiMap: Record<string, string> = {
    guest_service_request: '🛎️',
    maintenance_required: '🔧',
    room_ready: '✅',
    room_issue: '🚪',
    inventory_low: '📦',
    inventory_critical: '⚠️',
    checkout_ready: '🏃',
    cleaning_priority: '🧹',
    safety_incident: '🚨',
    equipment_failure: '❌',
    system_alert: '💻',
    shift_change: '🔄',
    vip_arrival: '⭐',
    complaint_received: '😟',
    emergency_request: '🚨',
    security_alert: '🛡️',
    payment_issue: '💳',
    booking_modification: '📝',
    special_request: '💖',
    deadline_approaching: '⏰',
    staff_assistance: '🤝',
    quality_check: '✔️',
    audit_required: '📋',
    training_reminder: '📚'
  };
  
  return emojiMap[type] || '📢';
}