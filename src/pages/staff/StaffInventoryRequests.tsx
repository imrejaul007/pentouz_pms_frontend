import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User,
  MapPin,
  Play,
  CheckSquare,
  RefreshCw,
  Eye,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';
import toast from 'react-hot-toast';
import { adminGuestServicesService, GuestService } from '../../services/adminGuestServicesService';
import { useAuth } from '../../context/AuthContext';

interface InventoryRequest extends GuestService {
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  specialInstructions?: string;
}

export default function StaffInventoryRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');


  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);



  const fetchRequests = async () => {
    try {
      setLoading(true);
      const filters = {
        serviceType: 'other', // Only inventory requests
        assignedTo: user?.id, // Only requests assigned to current staff member
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100
      };

      const response = await adminGuestServicesService.getServices(filters);
      
      // Filter for inventory requests specifically
      const inventoryRequests = (response.data.serviceRequests || []).filter(service => 
        service.serviceType === 'other' && (
          service.title?.toLowerCase().includes('inventory') ||
          service.title?.toLowerCase().includes('missing') ||
          service.title?.toLowerCase().includes('damaged') ||
          service.title?.toLowerCase().includes('towel') ||
          service.title?.toLowerCase().includes('pillow') ||
          service.title?.toLowerCase().includes('amenity')
        )
      );

      setRequests(inventoryRequests);
    } catch (error) {
      console.error('Failed to fetch inventory requests:', error);
      toast.error('Failed to load inventory requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: 'in_progress' | 'completed') => {
    try {
      setUpdating(requestId);
      await adminGuestServicesService.updateStatus(requestId, newStatus);
      
      toast.success(`Request ${newStatus === 'completed' ? 'completed' : 'started'} successfully`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to update request status:', error);
      toast.error('Failed to update request status');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewRequest = (request: InventoryRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 mr-2 text-orange-600" />;
      case 'assigned': return <User className="h-5 w-5 mr-2 text-blue-600" />;
      case 'in_progress': return <RefreshCw className="h-5 w-5 mr-2 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 mr-2 text-green-600" />;
      case 'cancelled': return <AlertCircle className="h-5 w-5 mr-2 text-red-600" />;
      default: return <Clock className="h-5 w-5 mr-2 text-gray-600" />;
    }
  };

  const getActionButton = (request: InventoryRequest) => {
    const isUpdating = updating === request._id;
    
    switch (request.status) {
      case 'assigned':
        return (
          <Button 
            size="sm" 
            onClick={() => updateRequestStatus(request._id, 'in_progress')}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            size="sm" 
            onClick={() => updateRequestStatus(request._id, 'completed')}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : (
              <>
                <CheckSquare className="h-4 w-4 mr-1" />
                Complete
              </>
            )}
          </Button>
        );
      case 'completed':
        return <Badge variant="secondary" className="text-green-700 bg-green-50">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="text-red-700 bg-red-50">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const getItemsSummary = (items?: Array<{ name: string; quantity: number; price: number }>) => {
    if (!items || items.length === 0) return 'No specific items listed';
    
    const summary = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    return summary.length > 30 ? `${summary.substring(0, 30)}...` : summary;
  };

  const filterRequestsByStatus = (status: string) => {
    if (status === 'all') return requests;
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

  const assignedRequests = filterRequestsByStatus('assigned');
  const inProgressRequests = filterRequestsByStatus('in_progress');
  const completedRequests = filterRequestsByStatus('completed');
  const allActiveRequests = requests.filter(r => ['assigned', 'in_progress'].includes(r.status));

  return (
    <ErrorBoundary level="page">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inventory Requests</h1>
            <p className="text-gray-600">Manage inventory requests assigned to you</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchRequests} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{assignedRequests.length}</p>
                  <p className="text-sm text-gray-600">Assigned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <RefreshCw className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressRequests.length}</p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{completedRequests.length}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{allActiveRequests.length}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'assigned' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('assigned')}
              >
                Assigned
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory requests</h3>
                <p className="text-gray-500">
                  {statusFilter === 'all' 
                    ? "You don't have any inventory requests assigned to you yet." 
                    : `No ${statusFilter.replace('_', ' ')} requests found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                        </div>
                        <Badge className={getStatusColor(request.status)} variant="outline">
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)} variant="outline">
                          {request.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{request.description}</p>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        <strong>Items:</strong> {getItemsSummary(request.items)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <strong className="text-gray-700">Guest:</strong><br />
                          {request.userId?.name}
                        </div>
                        <div>
                          <strong className="text-gray-700">Room:</strong><br />
                          {request.bookingId?.rooms?.[0]?.roomId?.roomNumber || 'N/A'}
                        </div>
                        <div>
                          <strong className="text-gray-700">Booking:</strong><br />
                          {request.bookingId?.bookingNumber}
                        </div>
                        <div>
                          <strong className="text-gray-700">Created:</strong><br />
                          {getTimeAgo(request.createdAt)}
                        </div>
                      </div>

                      {request.specialInstructions && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <strong className="text-sm text-blue-800">Special Instructions:</strong>
                          <p className="text-sm text-blue-700 mt-1">{request.specialInstructions}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {getActionButton(request)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Request Modal */}
        {selectedRequest && (
          <Modal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            title="Inventory Request Details"
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRequest.title}</h3>
                  <p className="text-gray-600 mt-1">{selectedRequest.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <Badge className={getPriorityColor(selectedRequest.priority)} variant="outline">
                    {selectedRequest.priority}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)} variant="outline">
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guest</label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedRequest.userId?.name}</div>
                    <div className="text-sm text-gray-500">{selectedRequest.userId?.email}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room & Booking</label>
                  <div className="mt-1">
                    <div className="font-medium">
                      Room {selectedRequest.bookingId?.rooms?.[0]?.roomId?.roomNumber || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedRequest.bookingId?.bookingNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Items</label>
                  <div className="bg-gray-50 p-3 rounded-md space-y-2">
                    {selectedRequest.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.specialInstructions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                  <div className="mt-1 text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
                    {selectedRequest.specialInstructions}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {format(parseISO(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
                {selectedRequest.completedTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completed</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {format(parseISO(selectedRequest.completedTime), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
                <>
                  {selectedRequest.status === 'assigned' && (
                    <Button 
                      onClick={() => {
                        updateRequestStatus(selectedRequest._id, 'in_progress');
                        setShowViewModal(false);
                      }}
                      disabled={updating === selectedRequest._id}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Processing
                    </Button>
                  )}
                  {selectedRequest.status === 'in_progress' && (
                    <Button 
                      onClick={() => {
                        updateRequestStatus(selectedRequest._id, 'completed');
                        setShowViewModal(false);
                      }}
                      disabled={updating === selectedRequest._id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </>
              )}
            </div>
          </Modal>
        )}
      </div>
    </ErrorBoundary>
  );
}