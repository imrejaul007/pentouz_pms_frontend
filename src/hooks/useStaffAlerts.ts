import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealTime } from '../services/realTimeService';
import { staffAlertService } from '../services/staffAlertService';
import toast from 'react-hot-toast';

export function useStaffAlerts() {
  const queryClient = useQueryClient();
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // Real-time connection is managed externally - no auto-connect

  // Real-time event listeners for staff alerts
  useEffect(() => {
    if (connectionState !== 'connected') return;

    const handleNewAlert = (data: any) => {
      console.log('New staff alert received globally:', data);
      const newAlert = data.alert;
      
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
      
      // Show priority-based toast notification with sound for critical/urgent
      if (staffAlertService.requiresImmediate(newAlert)) {
        // Critical alert - most urgent
        toast.error(`🚨 CRITICAL: ${newAlert.title}`, {
          duration: 10000,
          style: {
            background: '#fef2f2',
            border: '2px solid #dc2626',
            color: '#dc2626',
            fontWeight: 'bold'
          }
        });
        
        // Play alert sound for critical alerts
        if (typeof Audio !== 'undefined') {
          const audio = new Audio('/alert-critical.mp3');
          audio.play().catch(() => {
            // Fallback if audio fails
            console.log('Critical alert: Audio notification failed');
          });
        }
      } else if (staffAlertService.isUrgent(newAlert)) {
        // Urgent alert
        toast.error(`⚠️ URGENT: ${newAlert.title}`, {
          duration: 8000,
          style: {
            background: '#fff7ed',
            border: '2px solid #ea580c',
            color: '#ea580c',
            fontWeight: 'bold'
          }
        });
      } else {
        // Standard priority alerts
        const emoji = getEmojiForAlertType(newAlert.type);
        toast.success(`${emoji} ${newAlert.title}`, {
          duration: 5000,
          style: {
            background: '#f0f9ff',
            border: '1px solid #0369a1',
            color: '#0369a1'
          }
        });
      }
    };

    const handleAlertUpdated = (data: any) => {
      console.log('Staff alert updated globally:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
    };

    const handleAlertResolved = (data: any) => {
      console.log('Staff alert resolved globally:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
    };

    const handleAlertEscalated = (data: any) => {
      console.log('Staff alert escalated globally:', data);
      const escalatedAlert = data.alert;
      
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
      
      // Show escalation notification
      toast.error(`🚨 ESCALATED: ${escalatedAlert.title}`, {
        duration: 7000,
        style: {
          background: '#fef2f2',
          border: '2px solid #dc2626',
          color: '#dc2626',
          fontWeight: 'bold'
        }
      });
    };

    const handleAlertAssigned = (data: any) => {
      console.log('Staff alert assigned globally:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
      
      if (data.assignedToMe) {
        toast.info(`📋 Alert assigned to you: ${data.alert.title}`, {
          duration: 5000,
          style: {
            background: '#f0f9ff',
            border: '1px solid #0369a1',
            color: '#0369a1'
          }
        });
      }
    };

    const handleBulkAlertUpdate = (data: any) => {
      console.log('Bulk staff alert update globally:', data);
      queryClient.invalidateQueries({ queryKey: ['staff-alert-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-staff-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['staff-alerts'] });
      
      toast.success(`📬 ${data.count} alerts updated`, {
        duration: 3000,
      });
    };

    // Set up event listeners
    on('staff-alert:new', handleNewAlert);
    on('staff-alert:updated', handleAlertUpdated);
    on('staff-alert:resolved', handleAlertResolved);
    on('staff-alert:escalated', handleAlertEscalated);
    on('staff-alert:assigned', handleAlertAssigned);
    on('staff-alerts:bulk-update', handleBulkAlertUpdate);

    return () => {
      off('staff-alert:new', handleNewAlert);
      off('staff-alert:updated', handleAlertUpdated);
      off('staff-alert:resolved', handleAlertResolved);
      off('staff-alert:escalated', handleAlertEscalated);
      off('staff-alert:assigned', handleAlertAssigned);
      off('staff-alerts:bulk-update', handleBulkAlertUpdate);
    };
  }, [connectionState, on, off, queryClient]);

  // Get alert summary with real-time updates
  const { data: alertSummary, isLoading: isLoadingAlertSummary } = useQuery({
    queryKey: ['staff-alert-summary'],
    queryFn: staffAlertService.getAlertSummary,
    refetchInterval: 30000, // Fallback polling
    staleTime: 5000
  });

  return {
    alertSummary,
    isLoadingAlertSummary,
    connectionState,
    unacknowledgedCount: alertSummary?.totalUnacknowledged || 0,
    criticalCount: alertSummary?.criticalCount || 0,
    urgentCount: alertSummary?.urgentCount || 0,
    totalActiveCount: alertSummary?.totalActive || 0,
    escalatedCount: alertSummary?.escalatedCount || 0,
    expiringSoonCount: alertSummary?.expiringSoon || 0
  };
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