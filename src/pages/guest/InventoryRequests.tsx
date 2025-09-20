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
  Package,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
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
    case 'pending': return 'bg-orange-100 text-orange-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
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

export default function InventoryRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<GuestServiceRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    bookingId: '',
    title: '',
    description: '',
    priority: 'medium',
    items: [{ name: '', quantity: 1, price: 0 }],
    specialInstructions: ''
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchBookings();
    }
  }, [user, filter]);


  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await guestServiceService.getServiceRequests({
        serviceType: 'other', // Inventory requests are categorized as 'other'
        status: filter === 'all' ? undefined : filter,
        limit: 50
      });
      setRequests(response.data.serviceRequests || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to load inventory requests');
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
    if (!formData.bookingId || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await guestServiceService.createServiceRequest({
        bookingId: formData.bookingId,
        serviceType: 'other',
        serviceVariation: 'inventory_request',
        serviceVariations: ['inventory_request'],
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        items: formData.items.filter(item => item.name.trim()),
        specialInstructions: formData.specialInstructions
      });

      toast.success('Inventory request created successfully');
      setShowCreateForm(false);
      resetForm();
      fetchRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
      toast.error('Failed to create inventory request');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bookingId: '',
      title: '',
      description: '',
      priority: 'medium',
      items: [{ name: '', quantity: 1, price: 0 }],
      specialInstructions: ''
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Requests</h1>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">Request additional items or report missing/damaged inventory</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Inventory Request</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking *
                </label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingId: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a booking</option>
                  {bookings.map(booking => (
                    <option key={booking._id} value={booking._id}>
                      {booking.bookingNumber} - {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Missing towels, Damaged lamp, Need extra pillows"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide details about your request..."
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Needed
                </label>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Item name"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-20"
                      min="1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addItem} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Any special instructions or preferences..."
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreateRequest} disabled={creating}>
                {creating ? 'Creating...' : 'Create Request'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <Card key={request._id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </div>
                  
                  {request.description && (
                    <p className="text-gray-600 mb-2">{request.description}</p>
                  )}

                  {request.items && request.items.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Requested Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {request.items.map((item, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {item.name} (Qty: {item.quantity})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {request.specialInstructions && (
                    <p className="text-sm text-gray-500 mb-2">
                      <strong>Special Instructions:</strong> {request.specialInstructions}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Booking: {request.bookingId?.bookingNumber}</span>
                    <span>Created: {formatDate(request.createdAt)}</span>
                    {request.assignedTo && (
                      <span>Assigned to: {request.assignedTo.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {request.status === 'pending' && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory requests found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'You haven\'t made any inventory requests yet'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
