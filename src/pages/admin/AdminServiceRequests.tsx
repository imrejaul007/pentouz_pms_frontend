import React, { useState, useEffect } from 'react';
import '../../styles/admin-service-requests-animations.css';
import { useAuth } from '../../context/AuthContext';
import { adminGuestServicesService } from '../../services/adminGuestServicesService';
import {
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
  UserPlus,
  Package,
  FileText,
  Bell,
  BarChart3,
  Activity,
  Target,
  TrendingUp,
  Zap,
  RefreshCw,
  Settings,
  Star,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/Modal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useRealTime } from '../../services/realTimeService';
import toast from 'react-hot-toast';

interface ServiceRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  bookingId: {
    _id: string;
    bookingNumber: string;
  };
  hotelId: {
    _id: string;
    name: string;
  };
  serviceType: 'room_service' | 'housekeeping' | 'maintenance' | 'concierge' | 'transport' | 'spa' | 'laundry' | 'other';
  serviceVariation: string;
  serviceVariations?: string[];
  title?: string;
  description?: string;
  priority: 'now' | 'later' | 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: {
    _id: string;
    name: string;
  };
  scheduledTime?: string;
  completedTime?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  specialInstructions?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface GuestServiceFilters {
  status?: string;
  serviceType?: string;
  priority?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

interface ServiceStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  urgent: number;
  avgCompletionTime: number;
}

export default function AdminServiceRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState<GuestServiceFilters>({ 
    page: 1, 
    limit: 20 
  });
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [availableStaff, setAvailableStaff] = useState<Array<{ _id: string; name: string; email: string; department: string }>>([]);
  
  // Real-time connection
  const { connectionState, connect, disconnect, on, off, isConnected } = useRealTime();
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    assignedTo: '',
    notes: '',
    scheduledTime: ''
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminGuestServicesService.getServices(filters);
      console.log('Service requests response:', response.data);
      
      // Filter for general service requests (exclude inventory and supply requests)
      const serviceRequests = (response.data.serviceRequests || []).filter(service => {
        // Exclude inventory requests
        const isNotInventory = !(service.serviceType === 'other' && 
          (service.serviceVariation === 'inventory_request' || 
           service.serviceVariations?.includes('inventory_request') ||
           service.title?.toLowerCase().includes('inventory')));
        
        // Exclude supply requests (if they have specific identifiers)
        const isNotSupply = !service.title?.toLowerCase().includes('supply');
        
        // Include general service types
        const isGeneralService = ['room_service', 'housekeeping', 'maintenance', 'concierge', 'transport', 'spa', 'laundry'].includes(service.serviceType) ||
          (service.serviceType === 'other' && service.serviceVariation === 'multiple_services');
        
        return isGeneralService && isNotInventory && isNotSupply;
      });
      
      setRequests(serviceRequests);
      setPagination({ 
        total: serviceRequests.length, 
        pages: Math.ceil(serviceRequests.length / (filters.limit || 20))
      });
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast.error('Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await adminGuestServicesService.getAvailableStaff();
      setAvailableStaff(response.data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const calculateStats = (requestList: ServiceRequest[]) => {
    const stats = {
      total: requestList.length,
      pending: requestList.filter(r => r.status === 'pending').length,
      assigned: requestList.filter(r => r.status === 'assigned').length,
      inProgress: requestList.filter(r => r.status === 'in_progress').length,
      completed: requestList.filter(r => r.status === 'completed').length,
      cancelled: requestList.filter(r => r.status === 'cancelled').length,
      urgent: requestList.filter(r => ['now', 'urgent'].includes(r.priority)).length,
      avgCompletionTime: 0 // Would need completion times to calculate
    };
    
    setStats(stats);
  };

  useEffect(() => {
    if (user && ['admin', 'manager'].includes(user.role)) {
      fetchRequests();
      fetchAvailableStaff();
    }
  }, [user, filters]);

  useEffect(() => {
    calculateStats(requests);
  }, [requests]);

  // Real-time updates
  useEffect(() => {
    if (isConnected) {
      const handleServiceUpdate = (data: any) => {
        console.log('Real-time service request update:', data);
        fetchRequests();
      };

      on('guest_service_created', handleServiceUpdate);
      on('guest_service_updated', handleServiceUpdate);
      on('guest_service_status_updated', handleServiceUpdate);

      return () => {
        off('guest_service_created', handleServiceUpdate);
        off('guest_service_updated', handleServiceUpdate);
        off('guest_service_status_updated', handleServiceUpdate);
      };
    }
  }, [isConnected, on, off]);

  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      setUpdating(true);
      await adminGuestServicesService.updateServiceStatus(requestId, { status, notes });
      toast.success(`Request ${status.replace('_', ' ')}`);
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignRequest = async () => {
    if (!selectedRequest || !assignData.assignedTo) return;

    try {
      setUpdating(true);
      await adminGuestServicesService.assignService(selectedRequest._id, {
        assignedTo: assignData.assignedTo,
        notes: assignData.notes,
        scheduledTime: assignData.scheduledTime || new Date().toISOString()
      });
      
      toast.success('Request assigned successfully');
      setShowAssignModal(false);
      setAssignData({ assignedTo: '', notes: '', scheduledTime: '' });
      fetchRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign request');
    } finally {
      setUpdating(false);
    }
  };

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

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'room_service': return '🍽️';
      case 'housekeeping': return '🧹';
      case 'maintenance': return '🔧';
      case 'concierge': return '🛎️';
      case 'transport': return '🚗';
      case 'spa': return '💆';
      case 'laundry': return '👔';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary level="page" onError={(error, errorInfo) => {
      console.error('AdminServiceRequests Error:', error, errorInfo);
      toast.error('An error occurred in the service requests management page');
    }}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Bell className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent leading-tight">
                Service Requests Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
                Manage general hotel service requests (room service, housekeeping, maintenance, etc.)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className={`flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium shadow-sm ${
              isConnected 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {isConnected ? 'Live Connected' : 'Offline'}
            </div>
            <Button
              onClick={fetchRequests}
              variant="outline"
              disabled={loading}
              className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Total Requests</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-yellow-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-md">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">In Progress</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Completed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900">Filter Service Requests</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Search Requests</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Service Type</label>
              <select
                value={filters.serviceType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value || undefined }))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              >
                <option value="">All Services</option>
                <option value="room_service">Room Service</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="maintenance">Maintenance</option>
                <option value="concierge">Concierge</option>
                <option value="transport">Transport</option>
                <option value="spa">Spa</option>
                <option value="laundry">Laundry</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              >
                <option value="">All Priority</option>
                <option value="now">Now</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="later">Later</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => setFilters({ page: 1, limit: 20 })}
              variant="outline"
              className="text-sm px-4 py-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Requests List */}
      {requests.length === 0 ? (
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden p-12 text-center">
          <div className="p-4 bg-gray-100 rounded-2xl inline-block mb-6">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">No service requests found</h3>
          <p className="text-gray-600 font-medium">No service requests match your current filters. Try adjusting your search criteria.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <Card key={request._id} className={`bg-white border-0 shadow-lg rounded-lg overflow-hidden p-4 hover:shadow-xl transition-all duration-300 ${request.priority === 'urgent' || request.priority === 'now' ? 'border-l-4 border-red-500' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <span className="text-lg">{getServiceTypeIcon(request.serviceType)}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        {request.serviceVariations && request.serviceVariations.length > 1
                          ? `${request.serviceVariations.length} ${request.serviceType.replace('_', ' ')} services`
                          : request.serviceVariation === 'multiple_services'
                          ? `Multiple ${request.serviceType.replace('_', ' ')} services`
                          : request.serviceVariations?.[0] || request.title || `${request.serviceType.replace('_', ' ')} Service`}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {request.bookingId?.bookingNumber && (
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>Booking #{request.bookingId.bookingNumber}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{request.userId.name} ({request.userId.email})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                      <Target className="w-3 h-3 mr-1" />
                      {request.priority === 'now' ? 'Now' : request.priority === 'later' ? 'Scheduled' : `${request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority`}
                    </span>
                  </div>

                  {request.description && (
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                  )}

                  {request.serviceVariations && request.serviceVariations.length > 1 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {request.serviceVariations.map((variation, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {variation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
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
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Special Instructions:</strong> {request.specialInstructions}
                      </p>
                    </div>
                  )}

                  {request.notes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {request.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowViewModal(true);
                    }}
                    className="text-xs px-3 py-1.5 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>

                  {request.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowAssignModal(true);
                      }}
                      className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  )}

                  {['assigned', 'in_progress'].includes(request.status) && (
                    <div className="flex flex-col space-y-2">
                      {request.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(request._id, 'in_progress')}
                          disabled={updating}
                          className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {updating ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Activity className="w-3 h-3 mr-1" />
                              Start
                            </>
                          )}
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(request._id, 'completed')}
                          disabled={updating}
                          className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {updating ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(request._id, 'cancelled')}
                        disabled={updating}
                        className="text-xs px-3 py-1.5 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {updating ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {(request.estimatedCost || request.actualCost) && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    {request.estimatedCost && (
                      <span className="text-gray-600">
                        Estimated: {formatCurrency(request.estimatedCost, 'INR')}
                      </span>
                    )}
                    {request.actualCost && (
                      <span className="text-gray-900 font-medium">
                        Actual: {formatCurrency(request.actualCost, 'INR')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedRequest && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setAssignData({ assignedTo: '', notes: '', scheduledTime: '' });
          }}
          title="Assign Service Request"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Staff Member *
              </label>
              <select
                value={assignData.assignedTo}
                onChange={(e) => setAssignData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                required
              >
                <option value="">Choose a staff member...</option>
                {availableStaff.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} - {staff.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scheduled Time
              </label>
              <input
                type="datetime-local"
                value={assignData.scheduledTime}
                onChange={(e) => setAssignData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assignment Instructions
              </label>
              <textarea
                value={assignData.notes}
                onChange={(e) => setAssignData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-24 resize-none text-sm"
                placeholder="Add any special instructions, requirements, or notes for the assigned staff member..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setAssignData({ assignedTo: '', notes: '', scheduledTime: '' });
              }}
              className="text-sm px-4 py-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRequest}
              disabled={updating || !assignData.assignedTo}
              className="text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Request
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}
    </div>
    </ErrorBoundary>
  );
}