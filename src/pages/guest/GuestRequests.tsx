import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { guestServiceService, GuestServiceRequest } from '../../services/guestService';
import { bookingService } from '../../services/bookingService';
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { SERVICE_VARIATIONS } from '../../utils/currencyUtils';
import { useRealTime } from '../../services/realTimeService';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'assigned': return <AlertCircle className="w-4 h-4" />;
    case 'in_progress': return <Clock className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'now': return 'bg-red-100 text-red-800';
    case 'later': return 'bg-blue-100 text-blue-800';
    case 'urgent': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};


export default function GuestRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { connectionState, connect, disconnect, on, off } = useRealTime();

  // Form state
  const [formData, setFormData] = useState({
    bookingId: '',
    serviceType: '',
    serviceVariations: [] as string[],
    priority: 'now',
    scheduledTime: '',
    specialInstructions: ''
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchBookings();
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, filter, connect, disconnect]);

  // Real-time event listeners for guest service request updates
  useEffect(() => {
    if (connectionState !== 'connected' || !user) return;

    const handleGuestServiceUpdated = (data: any) => {
      console.log('Guest service request updated:', data);
      const updatedRequest = data.serviceRequest;
      
      // Only update if this request belongs to the current user
      if (updatedRequest.userId?._id === user.id || updatedRequest.userId === user.id) {
        setRequests(prev => prev.map(request => 
          request._id === updatedRequest._id ? updatedRequest : request
        ));

        // Show toast notification for status changes
        if (data.previousStatus && data.previousStatus !== updatedRequest.status) {
          const statusMessages = {
            'assigned': `Your ${updatedRequest.serviceType.replace('_', ' ')} request has been assigned to ${updatedRequest.assignedTo?.name || 'staff'}`,
            'in_progress': `Your ${updatedRequest.serviceType.replace('_', ' ')} request is now in progress`,
            'completed': `Your ${updatedRequest.serviceType.replace('_', ' ')} request has been completed`,
            'cancelled': 'Your service request has been cancelled'
          };
          
          const message = statusMessages[updatedRequest.status as keyof typeof statusMessages];
          if (message) {
            toast.success(message, {
              duration: 5000,
              icon: updatedRequest.status === 'completed' ? '✅' : 
                    updatedRequest.status === 'cancelled' ? '❌' : '🔔'
            });
          }
        }

        // Show notification for staff notes
        if (updatedRequest.notes && (!data.previousNotes || data.previousNotes !== updatedRequest.notes)) {
          toast.info('Staff added a note to your request', {
            duration: 4000,
            icon: '📝'
          });
        }
      }
    };

    const handleGuestServiceCreated = (data: any) => {
      console.log('New guest service request created:', data);
      const newRequest = data.serviceRequest;
      
      // Only add if this request belongs to the current user
      if (newRequest.userId?._id === user.id || newRequest.userId === user.id) {
        setRequests(prev => [newRequest, ...prev]);
        toast.success('Your service request has been created successfully', {
          duration: 4000,
          icon: '✨'
        });
      }
    };

    const handleGuestServiceCancelled = (data: any) => {
      console.log('Guest service request cancelled:', data);
      const cancelledRequest = data.serviceRequest;
      
      // Only update if this request belongs to the current user
      if (cancelledRequest.userId?._id === user.id || cancelledRequest.userId === user.id) {
        setRequests(prev => prev.map(request => 
          request._id === cancelledRequest._id ? cancelledRequest : request
        ));
      }
    };

    // Set up event listeners
    on('guest-service:updated', handleGuestServiceUpdated);
    on('guest-service:created', handleGuestServiceCreated);
    on('guest-service:cancelled', handleGuestServiceCancelled);

    return () => {
      off('guest-service:updated', handleGuestServiceUpdated);
      off('guest-service:created', handleGuestServiceCreated);
      off('guest-service:cancelled', handleGuestServiceCancelled);
    };
  }, [connectionState, on, off, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await guestServiceService.getServiceRequests({
        status: filter === 'all' ? undefined : filter,
        limit: 50
      });
      setRequests(response.data.serviceRequests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await bookingService.getUserBookings();
      const bookingsData = Array.isArray(response.data) ? response.data : [];
      setBookings(bookingsData.filter(b => ['confirmed', 'checked_in'].includes(b.status)));
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.bookingId || !formData.serviceType || formData.serviceVariations.length === 0) {
      toast.error('Please fill in all required fields and select at least one service option');
      return;
    }

    // Validate scheduled time when priority is "later"
    if (formData.priority === 'later' && !formData.scheduledTime) {
      toast.error('Please select a scheduled time for later requests');
      return;
    }

    try {
      setCreating(true);
      const requestData: any = {
        bookingId: formData.bookingId,
        serviceType: formData.serviceType,
        serviceVariation: formData.serviceVariations.length === 1 ? formData.serviceVariations[0] : 'multiple_services',
        serviceVariations: formData.serviceVariations,
        priority: formData.priority,
        specialInstructions: formData.specialInstructions
      };

      // Only include scheduledTime if priority is "later" or if it's set
      if (formData.priority === 'later' || formData.scheduledTime) {
        requestData.scheduledTime = formData.scheduledTime || new Date().toISOString();
      } else if (formData.priority === 'now') {
        // For "now" requests, set the scheduled time to current time
        requestData.scheduledTime = new Date().toISOString();
      }

      await guestServiceService.createServiceRequest(requestData);
      
      toast.success('Service request created successfully');
      setShowCreateForm(false);
      setFormData({
        bookingId: '',
        serviceType: '',
        serviceVariations: [],
        priority: 'now',
        scheduledTime: '',
        specialInstructions: ''
      });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create service request');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      await guestServiceService.cancelServiceRequest(requestId, 'Cancelled by guest');
      toast.success('Request cancelled successfully');
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const filteredRequests = requests.filter(request =>
    request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.serviceVariation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.serviceVariations?.some(variation => variation.toLowerCase().includes(searchTerm.toLowerCase())) ||
    request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.bookingId?.bookingNumber?.includes(searchTerm) ||
    request.serviceType.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Service Requests</h1>
        <div className="flex items-center space-x-4">
          <p className="text-sm sm:text-base text-gray-600">Manage your hotel service requests and track their status</p>
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

      {/* Actions */}
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(true)}
            disabled={bookings.length === 0}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>

          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {bookings.length === 0 && (
          <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            You need an active booking to create service requests
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto scrollbar-hide">
            <div className="flex space-x-4 sm:space-x-8 min-w-max">
              {[
                { id: 'all', label: 'All', count: requests.length, fullLabel: 'All Requests' },
                { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length, fullLabel: 'Pending' },
                { id: 'assigned', label: 'Assigned', count: requests.filter(r => r.status === 'assigned').length, fullLabel: 'Assigned' },
                { id: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length, fullLabel: 'In Progress' },
                { id: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length, fullLabel: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`py-2 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                    filter === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">{tab.fullLabel} ({tab.count})</span>
                  <span className="sm:hidden">{tab.label} ({tab.count})</span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <Card className="p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Service Request</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking *
              </label>
              <select
                value={formData.bookingId}
                onChange={(e) => setFormData(prev => ({ ...prev, bookingId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a booking</option>
                {bookings.map(booking => (
                  <option key={booking._id} value={booking._id}>
                    #{booking.bookingNumber} - {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    serviceType: e.target.value,
                    serviceVariations: [] // Reset variations when service type changes
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select service type</option>
                <option value="room_service">Room Service</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="maintenance">Maintenance</option>
                <option value="concierge">Concierge</option>
                <option value="transport">Transport</option>
                <option value="spa">Spa</option>
                <option value="laundry">Laundry</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.serviceType && (
              <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
                  <label className="block text-sm font-medium text-gray-700">
                    Service Options * (Select multiple)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allVariations = SERVICE_VARIATIONS[formData.serviceType as keyof typeof SERVICE_VARIATIONS] || [];
                        setFormData(prev => ({
                          ...prev,
                          serviceVariations: allVariations
                        }));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          serviceVariations: []
                        }));
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {SERVICE_VARIATIONS[formData.serviceType as keyof typeof SERVICE_VARIATIONS]?.map((variation) => (
                    <label key={variation} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.serviceVariations.includes(variation)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              serviceVariations: [...prev.serviceVariations, variation]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              serviceVariations: prev.serviceVariations.filter(v => v !== variation)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-900">{variation}</span>
                    </label>
                  ))}
                </div>
                {formData.serviceVariations.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Selected ({formData.serviceVariations.length}):</strong> {formData.serviceVariations.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When do you need this? *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    priority: value,
                    // Clear scheduled time if switching to "now"
                    scheduledTime: value === 'now' ? '' : prev.scheduledTime
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="now">Now</option>
                <option value="later">Later</option>
              </select>
            </div>

            {formData.priority === 'later' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={formData.priority === 'later'}
                />
              </div>
            )}

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Any special instructions or preferences..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRequest}
              loading={creating}
              className="w-full sm:w-auto"
            >
              Create Request
            </Button>
          </div>
        </Card>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">
            {filter === 'all' 
              ? "You haven't made any service requests yet." 
              : `No ${filter} requests found.`}
          </p>
          {bookings.length > 0 && (
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              className="w-full sm:w-auto"
            >
              Create Your First Request
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request._id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {request.serviceVariations && request.serviceVariations.length > 0
                        ? request.serviceVariations.length === 1 
                          ? request.serviceVariations[0]
                          : `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                        : request.serviceVariation || request.title || `${request.serviceType.replace('_', ' ')} Service`}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'now' ? 'Now' : request.priority === 'later' ? 'Scheduled' : `${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority`}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {request.bookingId?.bookingNumber ? `Booking #${request.bookingId.bookingNumber} • ` : ''}{request.serviceType.replace('_', ' ').charAt(0).toUpperCase() + request.serviceType.replace('_', ' ').slice(1)}
                  </p>
                  
                  {request.description && (
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                  )}

                  {/* Display multiple service variations */}
                  {request.serviceVariations && request.serviceVariations.length > 1 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {request.serviceVariations.map((variation, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {variation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(request.createdAt)}</span>
                    </div>
                    {request.scheduledTime && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Scheduled {formatDate(request.scheduledTime)}</span>
                      </div>
                    )}
                    {request.assignedTo && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Assigned to {request.assignedTo.name}</span>
                      </div>
                    )}
                  </div>

                  {request.specialInstructions && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Special Instructions:</strong> {request.specialInstructions}
                      </p>
                    </div>
                  )}

                  {request.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 sm:mt-0">
                  {['pending', 'assigned'].includes(request.status) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelRequest(request._id)}
                      className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">Cancel</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Cost Information */}
              {(request.estimatedCost || request.actualCost) && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm space-y-1 sm:space-y-0">
                    {request.estimatedCost && (
                      <span className="text-gray-600">
                        Estimated Cost: {formatCurrency(request.estimatedCost, 'INR')}
                      </span>
                    )}
                    {request.actualCost && (
                      <span className="text-gray-900 font-medium">
                        Actual Cost: {formatCurrency(request.actualCost, 'INR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}