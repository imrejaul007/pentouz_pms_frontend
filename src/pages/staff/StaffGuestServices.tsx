import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, CheckCircle, MessageSquare, Bell, RefreshCw, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TaskCompletionModal, getDefaultSteps, getServiceVariationSteps } from '../../components/staff/TaskCompletionModal';
import { guestServiceService, GuestServiceRequest } from '../../services/guestService';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function StaffGuestServices() {
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<GuestServiceRequest | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);


  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await guestServiceService.getServiceRequests({ limit: 100 });
      setRequests(response.data.serviceRequests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setUpdating(requestId);
      await guestServiceService.updateServiceRequest(requestId, { status: newStatus });
      toast.success('Request status updated successfully');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to update request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteClick = (request: GuestServiceRequest) => {
    setSelectedRequest(request);
    setShowCompletionModal(true);
  };

  const handleCompleteRequest = async (completedSteps: string[]) => {
    if (!selectedRequest) return;

    try {
      setUpdating(selectedRequest._id);
      
      // Extract completed service variations from the steps
      const completedServiceVariations: string[] = [];
      if (selectedRequest.serviceVariations) {
        selectedRequest.serviceVariations.forEach((variation, index) => {
          if (completedSteps.includes(`service_${index}`)) {
            completedServiceVariations.push(variation);
          }
        });
      }
      
      // Check if all service variations are completed
      const allServicesCompleted = selectedRequest.serviceVariations?.length === completedServiceVariations.length;
      
      await guestServiceService.updateServiceRequest(selectedRequest._id, { 
        status: allServicesCompleted ? 'completed' : 'in_progress',
        completedServiceVariations: completedServiceVariations,
        completedSteps: completedSteps,
        completedTime: allServicesCompleted ? new Date().toISOString() : undefined
      });
      
      toast.success(allServicesCompleted ? 'Request completed successfully' : 'Progress updated successfully');
      fetchRequests(); // Refresh the list
      setShowCompletionModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to update request:', error);
      toast.error('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 border-orange-200 text-orange-600';
      case 'assigned': return 'bg-blue-50 border-blue-200 text-blue-600';
      case 'in_progress': return 'bg-yellow-50 border-yellow-200 text-yellow-600';
      case 'completed': return 'bg-green-50 border-green-200 text-green-600';
      case 'cancelled': return 'bg-red-50 border-red-200 text-red-600';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 mr-2 text-orange-600" />;
      case 'assigned': return <Users className="h-5 w-5 mr-2 text-blue-600" />;
      case 'in_progress': return <MessageSquare className="h-5 w-5 mr-2 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 mr-2 text-green-600" />;
      case 'cancelled': return <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />;
      default: return <Clock className="h-5 w-5 mr-2 text-gray-600" />;
    }
  };

  const getActionButton = (request: GuestServiceRequest) => {
    const isUpdating = updating === request._id;
    
    switch (request.status) {
      case 'pending':
        return (
          <Button 
            size="sm" 
            onClick={() => updateRequestStatus(request._id, 'assigned')}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Assign'}
          </Button>
        );
      case 'assigned':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => updateRequestStatus(request._id, 'in_progress')}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Start'}
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleCompleteClick(request)}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Complete'}
          </Button>
        );
      case 'completed':
        return <Badge variant="outline" className="text-green-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filterRequestsByStatus = (status: string) => {
    return requests.filter(request => request.status === status);
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

  const pendingRequests = filterRequestsByStatus('pending');
  const inProgressRequests = filterRequestsByStatus('in_progress');
  const completedRequests = filterRequestsByStatus('completed');
  const assignedRequests = filterRequestsByStatus('assigned');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Services</h1>
          <p className="text-gray-600">Manage guest requests and services</p>
        </div>
        <Button onClick={fetchRequests} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">
                        {request.serviceVariations && request.serviceVariations.length > 0
                          ? request.serviceVariations.length === 1 
                            ? request.serviceVariations[0]
                            : `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                          : request.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-orange-600">
                        Requested: {getTimeAgo(request.createdAt)}
                      </p>
                      {/* Show multiple service variations */}
                      {request.serviceVariations && request.serviceVariations.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {request.serviceVariations.map((variation, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {variation}
                            </span>
                          ))}
                        </div>
                      )}
                      {request.description && (
                        <p className="text-xs text-gray-500 mt-1">{request.description}</p>
                      )}
                    </div>
                    {getActionButton(request)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No pending requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assigned Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Assigned Requests ({assignedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedRequests.length > 0 ? (
                assignedRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium">
                        {request.serviceVariations && request.serviceVariations.length > 0
                          ? request.serviceVariations.length === 1 
                            ? request.serviceVariations[0]
                            : `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                          : request.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-blue-600">
                        Assigned: {getTimeAgo(request.updatedAt)}
                      </p>
                      {/* Show multiple service variations */}
                      {request.serviceVariations && request.serviceVariations.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {request.serviceVariations.map((variation, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {variation}
                            </span>
                          ))}
                        </div>
                      )}
                      {request.assignedTo && (
                        <p className="text-xs text-gray-500">Assigned to: {request.assignedTo.name}</p>
                      )}
                    </div>
                    {getActionButton(request)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No assigned requests</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-yellow-600" />
              In Progress ({inProgressRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressRequests.length > 0 ? (
                inProgressRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium">
                        {request.serviceVariations && request.serviceVariations.length > 0
                          ? request.serviceVariations.length === 1 
                            ? request.serviceVariations[0]
                            : `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                          : request.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-yellow-600">
                        Started: {getTimeAgo(request.updatedAt)}
                      </p>
                      {/* Show multiple service variations with completion status */}
                      {request.serviceVariations && request.serviceVariations.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {request.serviceVariations.map((variation, index) => {
                            const isCompleted = request.completedServiceVariations?.includes(variation);
                            return (
                              <span 
                                key={index} 
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  isCompleted 
                                    ? 'bg-green-100 text-green-800 line-through' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {variation}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {getActionButton(request)}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No requests in progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Completed Today ({completedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedRequests.length > 0 ? (
                completedRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium">
                        {request.serviceVariations && request.serviceVariations.length > 0
                          ? request.serviceVariations.length === 1 
                            ? request.serviceVariations[0]
                            : `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                          : request.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        Room {request.bookingId?.bookingNumber} - {request.serviceType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-green-600">
                        Completed: {getTimeAgo(request.completedTime || request.updatedAt)}
                      </p>
                      {/* Show multiple service variations - all completed */}
                      {request.serviceVariations && request.serviceVariations.length > 1 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {request.serviceVariations.map((variation, index) => (
                            <span 
                              key={index} 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                            >
                              ✓ {variation}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-green-700">Completed</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No completed requests today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Modal */}
      {selectedRequest && (
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedRequest(null);
          }}
          onComplete={handleCompleteRequest}
          title="Complete Guest Service Request"
          taskName={`${selectedRequest.bookingId?.bookingNumber ? `Room ${selectedRequest.bookingId.bookingNumber} - ` : ''}${
            selectedRequest.serviceVariations && selectedRequest.serviceVariations.length > 0
              ? selectedRequest.serviceVariations.length === 1 
                ? selectedRequest.serviceVariations[0]
                : `${selectedRequest.serviceVariations.length} ${selectedRequest.serviceType.replace('_', ' ')} services`
              : selectedRequest.title || 'Guest Service Request'
          }`}
          steps={
            selectedRequest.serviceVariations && selectedRequest.serviceVariations.length > 0
              ? getServiceVariationSteps(selectedRequest.serviceVariations, selectedRequest.completedServiceVariations)
              : getDefaultSteps('guest_service', selectedRequest.serviceType)
          }
          loading={updating === selectedRequest._id}
        />
      )}
    </div>
  );
}
