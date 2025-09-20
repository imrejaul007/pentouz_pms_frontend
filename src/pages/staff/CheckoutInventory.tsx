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
  Package,
  Search,
  Filter,
  Eye,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { checkoutInventoryService, CheckoutInventory as CheckoutInventoryType } from '../../services/checkoutInventoryService';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { CheckoutInventoryForm } from '../../components/staff/CheckoutInventoryForm';
import { CheckoutInventoryDetails } from '../../components/staff/CheckoutInventoryDetails';

export default function CheckoutInventory() {
  console.log('CheckoutInventory component rendered'); // Debug log
  
  const [checkoutInventories, setCheckoutInventories] = useState<CheckoutInventoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<CheckoutInventoryType | null>(null);
  const [showDetails, setShowDetails] = useState(false);


  useEffect(() => {
    console.log('CheckoutInventory useEffect triggered'); // Debug log
    fetchCheckoutInventories();
  }, [filter]);



  const fetchCheckoutInventories = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filter
      let queryParams: any = { limit: 50 };
      
      if (filter === 'pending') {
        queryParams.status = 'pending';
      } else if (filter === 'completed') {
        queryParams.status = 'completed';
        // Note: We'll filter for paymentStatus === 'pending' on frontend since backend doesn't support combined filters
      } else if (filter === 'paid') {
        queryParams.paymentStatus = 'paid';
      }
      // If filter === 'all', don't add any filters (fetch all)
      
      const response = await checkoutInventoryService.getCheckoutInventories(queryParams);
      setCheckoutInventories(response.data.checkoutInventories || []);
    } catch (error) {
      console.error('Failed to fetch checkout inventories:', error);
      toast.error('Failed to load checkout inventories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchCheckoutInventories();
    toast.success('Checkout inventory created successfully');
  };

  const handleViewDetails = (inventory: CheckoutInventoryType) => {
    setSelectedInventory(inventory);
    setShowDetails(true);
  };

  const handlePaymentSuccess = () => {
    setShowDetails(false);
    fetchCheckoutInventories();
    toast.success('Payment processed successfully');
  };

  const handleCompleteCheck = async (inventory: CheckoutInventoryType) => {
    try {
      setLoading(true);
      await checkoutInventoryService.completeInventoryCheck(inventory._id);
      toast.success('Inventory check completed successfully!');
      fetchCheckoutInventories();
    } catch (error) {
      console.error('Failed to complete inventory check:', error);
      toast.error('Failed to complete inventory check');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventories = checkoutInventories.filter(inventory => {
    const matchesSearch = 
      inventory.bookingId.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.roomId.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inventory.checkedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && inventory.status === 'pending') ||
      (filter === 'completed' && inventory.status === 'completed' && inventory.paymentStatus === 'pending') ||
      (filter === 'paid' && inventory.paymentStatus === 'paid');
    
    return matchesSearch && matchesFilter;
  });

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Checkout Inventory Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage guest checkout inventory checks and billing</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchCheckoutInventories} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Checks</p>
                <p className="text-2xl font-semibold text-gray-900">{checkoutInventories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {checkoutInventories.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {checkoutInventories.filter(i => i.status === 'completed' && i.paymentStatus === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {checkoutInventories.filter(i => i.paymentStatus === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by booking number, room, or staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
          <Button
            variant={filter === 'paid' ? 'primary' : 'outline'}
            onClick={() => setFilter('paid')}
          >
            Paid
          </Button>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Check
        </Button>
      </div>

      {/* Checkout Inventories List */}
      <div className="space-y-4">
        {filteredInventories.length > 0 ? (
          filteredInventories.map((inventory) => (
            <Card key={inventory._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">
                        Booking #{inventory.bookingId.bookingNumber}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inventory.status)}`}>
                        {inventory.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(inventory.paymentStatus)}`}>
                        {inventory.paymentStatus}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Room</p>
                        <p className="font-medium">{inventory.roomId.roomNumber} ({inventory.roomId.type})</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Checked By</p>
                        <p className="font-medium">{inventory.checkedBy.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-medium text-green-600">{formatCurrency(inventory.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Items: {inventory.items.length}</span>
                      <span>Checked: {formatDate(inventory.checkedAt)}</span>
                      {inventory.paidAt && (
                        <span>Paid: {formatDate(inventory.paidAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(inventory)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {inventory.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleCompleteCheck(inventory)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete Check
                      </Button>
                    )}
                    {inventory.status === 'completed' && inventory.paymentStatus === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(inventory)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Process Payment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No checkout inventories found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No checkout inventory checks have been created yet'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Check
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CheckoutInventoryForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Details Modal */}
      {showDetails && selectedInventory && (
        <CheckoutInventoryDetails
          inventory={selectedInventory}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
