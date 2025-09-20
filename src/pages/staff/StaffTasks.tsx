import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  Calendar,
  Home,
  Package
} from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { dailyInventoryCheckService, DailyInventoryCheck } from '../../services/dailyInventoryCheckService';
import { guestServiceService, GuestServiceRequest } from '../../services/guestService';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function StaffTasks() {
  const [inventoryChecks, setInventoryChecks] = useState<DailyInventoryCheck[]>([]);
  const [serviceRequests, setServiceRequests] = useState<GuestServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [showCreateCheck, setShowCreateCheck] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const [checksResponse, requestsResponse] = await Promise.all([
        dailyInventoryCheckService.getTodayChecks(),
        guestServiceService.getServiceRequests({ status: 'assigned', limit: 50 })
      ]);
      
      setInventoryChecks(checksResponse.data.dailyChecks || []);
      setServiceRequests(requestsResponse.data.serviceRequests || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateServiceRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setUpdating(requestId);
      await guestServiceService.updateServiceRequest(requestId, { status: newStatus });
      toast.success('Request status updated successfully');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Failed to update request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setUpdating(null);
    }
  };

  const completeInventoryCheck = async (checkId: string) => {
    try {
      setUpdating(checkId);
      await dailyInventoryCheckService.completeInventoryCheck(checkId);
      toast.success('Inventory check completed successfully');
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Failed to complete inventory check:', error);
      toast.error('Failed to complete inventory check');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'in_progress': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'completed': return 'bg-green-50 border-green-200 text-green-600';
      case 'overdue': return 'bg-red-50 border-red-200 text-red-600';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 mr-2 text-orange-600" />;
      case 'in_progress': return <RefreshCw className="h-5 w-5 mr-2 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 mr-2 text-green-600" />;
      case 'overdue': return <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />;
      default: return <Clock className="h-5 w-5 mr-2 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingChecks = inventoryChecks.filter(check => check.status === 'pending');
  const inProgressChecks = inventoryChecks.filter(check => check.status === 'in_progress');
  const completedChecks = inventoryChecks.filter(check => check.status === 'completed');
  const overdueChecks = inventoryChecks.filter(check => check.status === 'overdue');

  const assignedRequests = serviceRequests.filter(request => request.status === 'assigned');
  const inProgressRequests = serviceRequests.filter(request => request.status === 'in_progress');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage your daily tasks and inventory checks</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTasks} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateCheck(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Inventory Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Daily Inventory Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pending Checks */}
              {pendingChecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">Pending ({pendingChecks.length})</h4>
                  {pendingChecks.map((check) => (
                    <div key={check._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 mb-2">
                      <div>
                        <p className="font-medium">Room {check.roomId.roomNumber}</p>
                        <p className="text-sm text-gray-600">
                          {check.items.length} items to check
                        </p>
                        <p className="text-xs text-orange-600">
                          Due: {formatDate(check.checkDate)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => completeInventoryCheck(check._id)}
                        disabled={updating === check._id}
                      >
                        {updating === check._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Start'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* In Progress Checks */}
              {inProgressChecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">In Progress ({inProgressChecks.length})</h4>
                  {inProgressChecks.map((check) => (
                    <div key={check._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                      <div>
                        <p className="font-medium">Room {check.roomId.roomNumber}</p>
                        <p className="text-sm text-gray-600">
                          {check.items.length} items checked
                        </p>
                        <p className="text-xs text-blue-600">
                          Started: {getTimeAgo(check.updatedAt)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => completeInventoryCheck(check._id)}
                        disabled={updating === check._id}
                      >
                        {updating === check._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Complete'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Overdue Checks */}
              {overdueChecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Overdue ({overdueChecks.length})</h4>
                  {overdueChecks.map((check) => (
                    <div key={check._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 mb-2">
                      <div>
                        <p className="font-medium">Room {check.roomId.roomNumber}</p>
                        <p className="text-sm text-gray-600">
                          {check.items.length} items to check
                        </p>
                        <p className="text-xs text-red-600">
                          Overdue since: {formatDate(check.checkDate)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => completeInventoryCheck(check._id)}
                        disabled={updating === check._id}
                      >
                        {updating === check._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Complete'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Today */}
              {completedChecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Completed Today ({completedChecks.length})</h4>
                  {completedChecks.map((check) => (
                    <div key={check._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 mb-2">
                      <div>
                        <p className="font-medium">Room {check.roomId.roomNumber}</p>
                        <p className="text-sm text-gray-600">
                          {check.items.length} items checked
                        </p>
                        <p className="text-xs text-green-600">
                          Completed: {getTimeAgo(check.completedAt || check.updatedAt)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-700">Completed</Badge>
                    </div>
                  ))}
                </div>
              )}

              {inventoryChecks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No inventory checks assigned</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Service Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-purple-600" />
              Assigned Service Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Assigned Requests */}
              {assignedRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Assigned ({assignedRequests.length})</h4>
                  {assignedRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-600">
                          Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-blue-600">
                          Assigned: {getTimeAgo(request.updatedAt)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => updateServiceRequestStatus(request._id, 'in_progress')}
                        disabled={updating === request._id}
                      >
                        {updating === request._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Start'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* In Progress Requests */}
              {inProgressRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">In Progress ({inProgressRequests.length})</h4>
                  {inProgressRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-2">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-600">
                          Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Started: {getTimeAgo(request.updatedAt)}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => updateServiceRequestStatus(request._id, 'completed')}
                        disabled={updating === request._id}
                      >
                        {updating === request._id ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Complete'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {serviceRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No service requests assigned</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending Checks</p>
                <p className="text-2xl font-bold text-orange-600">{pendingChecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <RefreshCw className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressChecks.length + inProgressRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{completedChecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueChecks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
