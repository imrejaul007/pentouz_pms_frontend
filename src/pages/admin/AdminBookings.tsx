import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminService } from '../../services/adminService';
import { AdminBooking, BookingFilters, BookingStats } from '../../types/admin';
import { formatCurrency, formatNumber, getStatusColor } from '../../utils/dashboardUtils';
import { format, parseISO } from 'date-fns';
import WalkInBooking from './WalkInBooking';
import PaymentCollectionModal from '../../components/admin/PaymentCollectionModal';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, 
  Coins, 
  Users, 
  TrendingUp, 
  Filter,
  Eye,
  Edit,
  X,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  Plus,
  Search,
  Home,
  User,
  UserPlus,
  Building
} from 'lucide-react';

export default function AdminBookings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookingFilters>({
    page: 1,
    limit: 50 // Increased from 10 to 50 to show more bookings
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Payment collection modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<AdminBooking | null>(null);
  
  // Room assignment state
  const [showRoomAssignmentModal, setShowRoomAssignmentModal] = useState(false);
  const [selectedBookingForRoomAssignment, setSelectedBookingForRoomAssignment] = useState<AdminBooking | null>(null);
  const [availableRoomsForAssignment, setAvailableRoomsForAssignment] = useState<any[]>([]);
  const [selectedRoomNumbers, setSelectedRoomNumbers] = useState<{ [key: string]: string }>({});
  
  // Manual booking form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    hotelId: '68cd01414419c17b5f6b4c12', // Updated to match seeded hotel ID
    userId: '',
    roomIds: [] as string[],
    checkIn: '',
    checkOut: '',
    guestDetails: {
      adults: 1,
      children: 0,
      specialRequests: ''
    },
    totalAmount: 0,
    currency: 'INR',
    paymentStatus: 'pending' as 'pending' | 'paid',
    status: 'pending' as 'pending' | 'confirmed'
  });

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔍 [AdminBookings] FETCH DEBUG - Calling admin service with filters:', filters);

      // Add hotelId to filters to ensure we only get bookings for the correct hotel
      const bookingFilters = {
        ...filters,
        hotelId: user?.hotelId || '68cd01414419c17b5f6b4c12' // Use the correct seeded hotel ID
      };
      console.log('🔍 [AdminBookings] FETCH DEBUG - Enhanced filters with hotelId:', bookingFilters);

      const response = await adminService.getBookings(bookingFilters);
      console.log('🔍 [AdminBookings] FETCH DEBUG - Admin service response:', response);
      console.log('🔍 [AdminBookings] FETCH DEBUG - Response structure:', {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        pagination: response.pagination
      });

      // Handle both possible response structures with better error checking
      let bookingsData = [];
      if (response.data) {
        if (response.data.bookings) {
          bookingsData = response.data.bookings;
        } else if (Array.isArray(response.data)) {
          bookingsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bookingsData = response.data.data;
        }
      }

      console.log('🔍 [AdminBookings] FETCH DEBUG - Extracted bookings data:', {
        length: bookingsData.length,
        firstBooking: bookingsData[0] ? {
          id: bookingsData[0]._id,
          hotelId: bookingsData[0].hotelId,
          status: bookingsData[0].status
        } : null
      });

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);

      // Set pagination with fallback values
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        // Calculate pagination if not provided
        setPagination({
          current: bookingFilters.page || 1,
          pages: Math.ceil(bookingsData.length / (bookingFilters.limit || 50)),
          total: bookingsData.length
        });
      }

    } catch (error: any) {
      console.error('❌ [AdminBookings] Error fetching bookings:', error);
      console.error('❌ [AdminBookings] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response?.status === 429) {
        console.log('⏳ [AdminBookings] Rate limit exceeded, will retry automatically');
      }
      setBookings([]);
      setPagination({ current: 1, pages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      console.log('📊 [AdminBookings] Fetching booking stats...');

      // Pass hotelId filter to stats to match booking list
      const statsFilters = {
        hotelId: user?.hotelId || '68cd01414419c17b5f6b4c12' // Use the correct seeded hotel ID
      };

      console.log('📊 [AdminBookings] Stats filters:', statsFilters);
      const response = await adminService.getBookingStats(statsFilters);
      console.log('📊 [AdminBookings] Stats response:', response);

      setStats(response.data?.stats || response.data || null);
    } catch (error) {
      console.error('❌ [AdminBookings] Error fetching stats:', error);
      setStats(null);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filters]);

  // Handle status update
  const handleStatusUpdate = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show') => {
    const booking = bookings.find(b => b._id === bookingId);
    
    // Check if this is a pending -> confirmed transition that needs room assignment
    if (booking?.status === 'pending' && newStatus === 'confirmed') {
      // If booking has no rooms assigned or roomType is not specified, trigger room assignment
      if (!booking.rooms || booking.rooms.length === 0) {
        handleRoomAssignmentForConfirmation(booking);
        return;
      }
    }
    
    try {
      setUpdating(true);
      await adminService.updateBooking(bookingId, { status: newStatus });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      await fetchBookings();
      await fetchStats();
      toast.success('Booking status updated successfully');
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    } finally {
      setUpdating(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string, reason: string = 'Cancelled by admin') => {
    try {
      setUpdating(true);
      await adminService.cancelBooking(bookingId, reason);
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle room assignment specifically for confirmation
  const handleRoomAssignmentForConfirmation = async (booking: AdminBooking) => {
    try {
      setSelectedBookingForRoomAssignment(booking);
      
      console.log('🔍 BOOKING DEBUG - Full booking object:', JSON.stringify(booking, null, 2));
      console.log('🔍 BOOKING DEBUG - Room type value:', booking.roomType);
      console.log('🔍 BOOKING DEBUG - Room type type:', typeof booking.roomType);
      console.log('🔍 BOOKING DEBUG - Rooms array:', booking.rooms);
      console.log('🔍 BOOKING DEBUG - Rooms length:', booking.rooms?.length);
      console.log('🔍 BOOKING DEBUG - Hotel ID:', booking.hotelId);
      console.log('🔍 BOOKING DEBUG - Hotel ID type:', typeof booking.hotelId);
      console.log('🔍 BOOKING DEBUG - Hotel ID _id:', booking.hotelId?._id);
      
      // Check if hotel information is available
      let hotelId = booking.hotelId?._id;
      
      // If hotelId is not populated as an object, try to use it as a string
      if (!hotelId && typeof booking.hotelId === 'string') {
        hotelId = booking.hotelId;
        console.log('🔍 BOOKING DEBUG - Using hotelId as string:', hotelId);
      }
      
      // If still no hotelId, try to get it from the user context or use a fallback
      if (!hotelId) {
        console.log('🔍 BOOKING DEBUG - No hotel ID found in booking, trying fallback');
        
        // Try to get hotelId from user context (if user is logged in and has hotelId)
        const userHotelId = user?.hotelId || '68cd01414419c17b5f6b4c12'; // Updated to match seeded hotel ID
        
        if (userHotelId) {
          hotelId = userHotelId;
          console.log('🔍 BOOKING DEBUG - Using fallback hotel ID from user context:', hotelId);
        } else {
          console.log('🔍 BOOKING DEBUG - No fallback hotel ID available');
          toast.error('Hotel information is missing for this booking');
          return;
        }
      }
      
      console.log('🔍 BOOKING DEBUG - Final hotel ID to use:', hotelId);
      
      // Fetch available rooms for the booking dates
      const checkInDate = new Date(booking.checkIn).toISOString().split('T')[0];
      const checkOutDate = new Date(booking.checkOut).toISOString().split('T')[0];
      
      console.log('Room assignment - dates:', { 
        originalCheckIn: booking.checkIn, 
        formattedCheckIn: checkInDate,
        originalCheckOut: booking.checkOut, 
        formattedCheckOut: checkOutDate 
      });
      
      const response = await adminService.getAvailableRooms(
        hotelId, 
        checkInDate, 
        checkOutDate
      );
      
      let availableRooms = response.data.rooms;
      console.log('Available rooms received:', availableRooms);
      
      setAvailableRoomsForAssignment(availableRooms);
      setSelectedRoomNumbers({});
      setShowRoomAssignmentModal(true);
    } catch (error) {
      console.error('Error fetching available rooms for assignment:', error);
      toast.error('Failed to load available rooms');
    }
  };

  // Handle room assignment submission
  const handleSubmitRoomAssignment = async () => {
    if (!selectedBookingForRoomAssignment) return;

    try {
      const selectedRoomId = selectedRoomNumbers.selectedRoomId;
      const selectedRoomType = selectedRoomNumbers.selectedRoomType;
      
      if (!selectedRoomId) {
        toast.error('Please select a room');
        return;
      }

      // Find the selected room details
      const selectedRoom = availableRoomsForAssignment.find(r => r._id === selectedRoomId);
      if (!selectedRoom) {
        toast.error('Selected room not found');
        return;
      }

      // Create room assignment data
      const roomAssignments = [{
        roomType: selectedRoomType,
        roomNumber: selectedRoom.roomNumber
      }];

      // Submit room assignment by updating the booking with the selected room
      const roomAssignmentUpdate = {
        rooms: [{
          roomId: selectedRoomId,
          rate: selectedRoom.baseRate || selectedRoom.currentRate || 0
        }],
        status: 'confirmed'
      };

      const updatedBooking = await adminService.updateBooking(selectedBookingForRoomAssignment._id, roomAssignmentUpdate);

      toast.success('Room assigned and booking confirmed successfully!');

      // Update the selected booking in the modal if it's the same booking
      if (selectedBooking && selectedBooking._id === selectedBookingForRoomAssignment._id) {
        setSelectedBooking(updatedBooking.data.booking);
      }

      // Close modal and refresh data
      setShowRoomAssignmentModal(false);
      setSelectedBookingForRoomAssignment(null);
      setAvailableRoomsForAssignment([]);
      setSelectedRoomNumbers({});
      
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error assigning room:', error);
      toast.error('Failed to assign room');
    }
  };

  // Handle check-in with payment collection
  const handleCheckIn = (booking: AdminBooking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  // Handle payment collection and check-in
  const handlePaymentCollection = async (paymentDetails: { paymentMethods: any[] }) => {
    if (!selectedBookingForPayment) return;

    try {
      setUpdating(true);
      const response = await adminService.checkInBooking(selectedBookingForPayment._id, paymentDetails);
      
      toast.success('Guest checked in successfully!');
      
      // Update the selected booking in the modal if it's the same booking
      if (selectedBooking && selectedBooking._id === selectedBookingForPayment._id) {
        setSelectedBooking(response.data.booking);
      }

      // Close payment modal and refresh data
      setShowPaymentModal(false);
      setSelectedBookingForPayment(null);
      
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error checking in guest:', error);
      toast.error('Failed to check in guest');
    } finally {
      setUpdating(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async (booking: AdminBooking) => {
    try {
      setUpdating(true);
      const response = await adminService.checkOutBooking(booking._id);
      
      toast.success('Guest checked out successfully!');
      
      // Update the selected booking in the modal if it's the same booking
      if (selectedBooking && selectedBooking._id === booking._id) {
        setSelectedBooking(response.data.booking);
      }

      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error checking out guest:', error);
      toast.error('Failed to check out guest');
    } finally {
      setUpdating(false);
    }
  };

  // Fetch available rooms
  const fetchAvailableRooms = async (hotelId: string, checkIn: string, checkOut: string) => {
    try {
      const response = await adminService.getAvailableRooms(hotelId, checkIn, checkOut);
      setAvailableRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      setAvailableRooms([]);
    }
  };

  // Fetch users for guest selection
  const fetchUsers = async (search: string = '') => {
    try {
      const response = await adminService.getUsers({ search, role: 'guest' });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Handle create booking form submission
  const handleCreateBooking = async () => {
    try {
      setCreating(true);
      await adminService.createBooking(createForm);
      
      // Reset form and close modal
      setCreateForm({
        hotelId: '68cd01414419c17b5f6b4c12', // Updated to match seeded hotel ID
        userId: '',
        roomIds: [],
        checkIn: '',
        checkOut: '',
        guestDetails: {
          adults: 1,
          children: 0,
          specialRequests: ''
        },
        totalAmount: 0,
        currency: 'INR',
        paymentStatus: 'pending',
        status: 'pending'
      });
      setShowCreateModal(false);
      
      // Refresh bookings and stats
      await fetchBookings();
      await fetchStats();
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setCreating(false);
    }
  };

  // Calculate total amount when rooms or dates change
  const calculateTotalAmount = () => {
    if (!createForm.checkIn || !createForm.checkOut || createForm.roomIds.length === 0) {
      return 0;
    }

    const checkInDate = new Date(createForm.checkIn);
    const checkOutDate = new Date(createForm.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const selectedRooms = availableRooms.filter(room => createForm.roomIds.includes(room._id));
    const roomsTotal = selectedRooms.reduce((total, room) => total + (room.currentRate || 0), 0);
    
    return roomsTotal * nights;
  };

  // Update total amount when form changes
  useEffect(() => {
    const totalAmount = calculateTotalAmount();
    setCreateForm(prev => ({ ...prev, totalAmount }));
  }, [createForm.roomIds, createForm.checkIn, createForm.checkOut, availableRooms]);

  // Fetch available rooms when dates change
  useEffect(() => {
    if (createForm.hotelId && createForm.checkIn && createForm.checkOut) {
      fetchAvailableRooms(createForm.hotelId, createForm.checkIn, createForm.checkOut);
    }
  }, [createForm.hotelId, createForm.checkIn, createForm.checkOut]);

  // Fetch users when user search changes
  useEffect(() => {
    fetchUsers(userSearch);
  }, [userSearch]);

  // Table columns
  const columns = [
    {
      key: 'bookingNumber',
      header: 'Booking #',
      render: (value: string) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      )
    },
    {
      key: 'userId',
      header: 'Guest',
      render: (value: any) => (
        <div>
          <div className="font-medium">{value?.name || 'Unknown Guest'}</div>
          <div className="text-sm text-gray-500">{value?.email || 'No email'}</div>
        </div>
      )
    },
    {
      key: 'rooms',
      header: 'Rooms',
      render: (value: any[]) => (
        <div className="space-y-1">
          {value && Array.isArray(value) ? value.map((room, index) => (
            <div key={index} className="text-sm">
              {room?.roomId?.roomNumber || 'Unknown Room'} ({room?.roomId?.type || 'Unknown Type'})
            </div>
          )) : <div className="text-sm text-gray-500">No rooms</div>}
        </div>
      )
    },
    {
      key: 'checkIn',
      header: 'Check In',
      render: (value: string) => (
        <div className="text-sm">
          {value ? format(parseISO(value), 'MMM dd, yyyy') : 'No date'}
        </div>
      )
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      render: (value: string) => (
        <div className="text-sm">
          {value ? format(parseISO(value), 'MMM dd, yyyy') : 'No date'}
        </div>
      )
    },
    {
      key: 'nights',
      header: 'Nights',
      render: (value: number) => (
        <span className="text-sm font-medium">{value || 0}</span>
      ),
      align: 'center' as const
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (value: number, row: AdminBooking) => (
        <div className="text-sm font-medium">
          {formatCurrency(value || 0, row?.currency || 'USD')}
        </div>
      ),
      align: 'right' as const
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <StatusBadge status={value} variant="pill" size="sm" />
      )
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (value: string) => (
        <StatusBadge 
          status={value} 
          variant="pill" 
          size="sm"
          className={value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: AdminBooking) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBooking(row);
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(row._id, 'confirmed')}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelBooking(row._id)}
                disabled={updating}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          {row.status === 'confirmed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate(row._id, 'checked_in')}
              disabled={updating}
            >
              <UserCheck className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {row.status === 'checked_in' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate(row._id, 'checked_out')}
              disabled={updating}
            >
              <UserX className="h-4 w-4 text-gray-600" />
            </Button>
          )}
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">Manage all hotel bookings and reservations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            onClick={() => setShowWalkInModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Walk-in Booking
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white hidden"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Booking
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Coins className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue, 'INR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.pending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Booking Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageBookingValue, 'INR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}



      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={filters.paymentStatus || ''}
                  onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Payment Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={filters.source || ''}
                  onChange={(e) => setFilters({ ...filters, source: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Sources</option>
                  <option value="direct">Direct</option>
                  <option value="booking_com">Booking.com</option>
                  <option value="expedia">Expedia</option>
                  <option value="airbnb">Airbnb</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                <Input
                  type="date"
                  value={filters.checkIn || ''}
                  onChange={(e) => setFilters({ ...filters, checkIn: e.target.value || undefined, page: 1 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search bookings by guest name, email, or booking number..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
                  className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Results per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  value={filters.limit || 50}
                  onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {/* Export button */}
              <Button
                variant="outline"
                className="whitespace-nowrap border-2 hover:border-blue-500 hover:bg-blue-50"
              >
                Export
              </Button>
            </div>
          </div>
          
          {/* Results info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium text-gray-900">
                  {((pagination.current - 1) * (filters.limit || 50)) + 1}
                </span> to <span className="font-medium text-gray-900">
                  {Math.min(pagination.current * (filters.limit || 50), pagination.total)}
                </span> of <span className="font-medium text-gray-900">{pagination.total}</span> bookings
              </div>
              
              {/* Modern Pagination */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                  disabled={pagination.current === 1}
                  className="border-2 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous page</span>
                  ←
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const pageNum = Math.max(1, pagination.current - 2) + i;
                    if (pageNum > pagination.pages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.current ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: pageNum })}
                        className={pageNum === pagination.current 
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" 
                          : "border-2 hover:border-blue-500 hover:bg-blue-50"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  {pagination.pages > 5 && pagination.current < pagination.pages - 2 && (
                    <>
                      <span className="text-gray-400 px-1">…</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: pagination.pages })}
                        className="border-2 hover:border-blue-500 hover:bg-blue-50"
                      >
                        {pagination.pages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, (filters.page || 1) + 1) })}
                  disabled={pagination.current === pagination.pages}
                  className="border-2 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next page</span>
                  →
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <DataTable
        title="All Bookings"
        data={bookings}
        columns={columns}
        loading={loading}
        searchable={false}
        pagination={false}
        emptyMessage="No bookings found"
        onRowClick={(booking) => {
          setSelectedBooking(booking);
          setShowDetailsModal(true);
        }}
      />

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedBooking(null);
          }}
          title={`Booking Details - ${selectedBooking.bookingNumber}`}
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Guest</h3>
                <p className="text-sm text-gray-900">{selectedBooking.userId?.name || 'Guest name not available'}</p>
                <p className="text-sm text-gray-600">{selectedBooking.userId?.email || 'Email not available'}</p>
                {selectedBooking.userId?.phone && (
                  <p className="text-sm text-gray-600">{selectedBooking.userId.phone}</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Hotel</h3>
                <p className="text-sm text-gray-900">
                  {selectedBooking.hotelId?.name || 'Hotel name not available'}
                </p>
                {selectedBooking.hotelId?.address && typeof selectedBooking.hotelId.address === 'object' && (
                  <p className="text-sm text-gray-600">
                    {selectedBooking.hotelId.address.street}, {selectedBooking.hotelId.address.city}, {selectedBooking.hotelId.address.state}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Check In</h3>
                <p className="text-sm text-gray-900">
                  {format(parseISO(selectedBooking.checkIn), 'EEEE, MMMM dd, yyyy')}
                </p>
                {selectedBooking.checkInTime && (
                  <p className="text-sm text-gray-600">
                    Time: {format(parseISO(selectedBooking.checkInTime), 'HH:mm')}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Check Out</h3>
                <p className="text-sm text-gray-900">
                  {format(parseISO(selectedBooking.checkOut), 'EEEE, MMMM dd, yyyy')}
                </p>
                {selectedBooking.checkOutTime && (
                  <p className="text-sm text-gray-600">
                    Time: {format(parseISO(selectedBooking.checkOutTime), 'HH:mm')}
                  </p>
                )}
              </div>
            </div>

            {/* Rooms */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Rooms</h3>
              <div className="space-y-2">
                {selectedBooking.rooms && selectedBooking.rooms.length > 0 ? (
                  selectedBooking.rooms.map((room, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{room.roomId?.roomNumber || 'Room number not available'}</p>
                        <p className="text-sm text-gray-600">{room.roomId?.type || 'Room type not available'}</p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(room.rate, selectedBooking.currency)}/night
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No rooms assigned</p>
                )}
              </div>
            </div>

            {/* Guest Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Guest Details</h3>
              {selectedBooking.guestDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Adults</p>
                      <p className="text-sm font-medium">{selectedBooking.guestDetails.adults || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Children</p>
                      <p className="text-sm font-medium">{selectedBooking.guestDetails.children || 0}</p>
                    </div>
                  </div>
                  {selectedBooking.guestDetails.specialRequests && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Special Requests</p>
                      <p className="text-sm text-gray-900">{selectedBooking.guestDetails.specialRequests}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">Guest details not available</p>
              )}
            </div>

            {/* Extras */}
            {selectedBooking.extras && selectedBooking.extras.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Extras</h3>
                <div className="space-y-2">
                  {selectedBooking.extras.map((extra, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{extra.name} (x{extra.quantity})</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(extra.price * extra.quantity, selectedBooking.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Info */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Amount</span>
                <span className="text-lg font-bold">
                  {formatCurrency(selectedBooking.totalAmount, selectedBooking.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Payment Status</span>
                <StatusBadge status={selectedBooking.paymentStatus} variant="pill" size="sm" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Booking Status</span>
                <StatusBadge status={selectedBooking.status} variant="pill" size="sm" />
              </div>
            </div>

            {/* Payment Details */}
            {selectedBooking.paymentDetails && selectedBooking.paymentDetails.paymentMethods && selectedBooking.paymentDetails.paymentMethods.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Details</h3>
                <div className="space-y-2">
                  {selectedBooking.paymentDetails.paymentMethods.map((payment: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium capitalize">{payment.method}</span>
                        {payment.reference && (
                          <span className="text-xs text-gray-500 ml-2">({payment.reference})</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(payment.amount, selectedBooking.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Total Paid</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(selectedBooking.paymentDetails.totalPaid, selectedBooking.currency)}
                    </span>
                  </div>
                  {selectedBooking.paymentDetails.remainingAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Remaining</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(selectedBooking.paymentDetails.remainingAmount, selectedBooking.currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Created: {format(parseISO(selectedBooking.createdAt), 'MMM dd, yyyy HH:mm')}
                </div>
                <div className="flex space-x-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleStatusUpdate(selectedBooking._id, 'confirmed');
                          setShowDetailsModal(false);
                        }}
                        disabled={updating}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleCancelBooking(selectedBooking._id);
                          setShowDetailsModal(false);
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(selectedBooking)}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Check In
                    </Button>
                  )}
                  {selectedBooking.status === 'checked_in' && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(selectedBooking)}
                      disabled={updating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Check Out
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Booking Modal */}
      <Modal
        isOpen={showCreateModal}
                 onClose={() => {
           setShowCreateModal(false);
           setCreateForm({
             hotelId: '68cd01414419c17b5f6b4c12', // Updated to match seeded hotel ID
             userId: '',
             roomIds: [],
             checkIn: '',
             checkOut: '',
             guestDetails: {
               adults: 1,
               children: 0,
               specialRequests: ''
             },
             totalAmount: 0,
             currency: 'INR',
             paymentStatus: 'pending',
             status: 'pending'
           });
          setAvailableRooms([]);
          setUsers([]);
          setUserSearch('');
        }}
        title="Create New Booking"
        size="lg"
      >
        <div className="space-y-6">
          {/* Step 1: Guest Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Guest Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Guest
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search guest by name or email"
                    className="pl-10"
                  />
                </div>
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Guest
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    {users.map((user) => (
                      <div
                        key={user._id}
                        className={`p-3 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-gray-50 ${
                          createForm.userId === user._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setCreateForm(prev => ({ ...prev, userId: user._id }))}
                      >
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Date Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                <Input
                  type="date"
                  value={createForm.checkIn}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date
                </label>
                <Input
                  type="date"
                  value={createForm.checkOut}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={createForm.checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Room Selection */}
          {availableRooms.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Available Rooms</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableRooms.map((room) => (
                  <div
                    key={room._id}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      createForm.roomIds.includes(room._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => {
                      setCreateForm(prev => ({
                        ...prev,
                        roomIds: prev.roomIds.includes(room._id)
                          ? prev.roomIds.filter(id => id !== room._id)
                          : [...prev.roomIds, room._id]
                      }));
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">Room {room.roomNumber}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {room.type} • Floor {room.floor}
                        </div>
                        {room.amenities && room.amenities.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {room.amenities.slice(0, 3).join(', ')}
                            {room.amenities.length > 3 && ` +${room.amenities.length - 3} more`}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(room.currentRate || 0, 'INR')}/night
                        </div>
                        <div className="text-xs text-gray-500">
                          Max {room.maxOccupancy} guests
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Guest Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Guest Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adults
                </label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.guestDetails.adults}
                  onChange={(e) => setCreateForm(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, adults: parseInt(e.target.value) || 1 }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Children
                </label>
                <Input
                  type="number"
                  min="0"
                  value={createForm.guestDetails.children}
                  onChange={(e) => setCreateForm(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, children: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                value={createForm.guestDetails.specialRequests}
                onChange={(e) => setCreateForm(prev => ({
                  ...prev,
                  guestDetails: { ...prev.guestDetails, specialRequests: e.target.value }
                }))}
                placeholder="Any special requests or notes..."
              />
            </div>
          </div>

          {/* Step 6: Booking Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.status}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    status: e.target.value as 'pending' | 'confirmed' 
                  }))}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={createForm.paymentStatus}
                  onChange={(e) => setCreateForm(prev => ({ 
                    ...prev, 
                    paymentStatus: e.target.value as 'pending' | 'paid' 
                  }))}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Total Amount Summary */}
          {createForm.totalAmount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Total Amount</span>
                <span className="text-blue-600">
                  {formatCurrency(createForm.totalAmount, createForm.currency)}
                </span>
              </div>
              {createForm.checkIn && createForm.checkOut && (
                <div className="text-sm text-gray-600 mt-1">
                  {Math.ceil((new Date(createForm.checkOut).getTime() - new Date(createForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights • {createForm.roomIds.length} room{createForm.roomIds.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={creating || !createForm.hotelId || !createForm.userId || createForm.roomIds.length === 0 || !createForm.checkIn || !createForm.checkOut}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Room Assignment Modal */}
      {selectedBookingForRoomAssignment && (
        <Modal
          isOpen={showRoomAssignmentModal}
          onClose={() => {
            setShowRoomAssignmentModal(false);
            setSelectedBookingForRoomAssignment(null);
            setAvailableRoomsForAssignment([]);
            setSelectedRoomNumbers({});
          }}
          title="Assign Room Numbers"
          size="lg"
        >
          <div className="space-y-6">
            {/* Booking Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Booking #{selectedBookingForRoomAssignment.bookingNumber}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Guest: </span>
                  <span className="font-medium">{selectedBookingForRoomAssignment.userId.name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Dates: </span>
                  <span className="font-medium">
                    {format(parseISO(selectedBookingForRoomAssignment.checkIn), 'MMM dd')} - {format(parseISO(selectedBookingForRoomAssignment.checkOut), 'MMM dd')}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Room Assignments */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Current Room Assignments</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                {selectedBookingForRoomAssignment.rooms.length === 0 && !selectedBookingForRoomAssignment.roomType ? (
                  <div className="text-center text-yellow-700">
                    <div className="font-medium">Room - No Room Assigned Yet</div>
                    <div className="text-sm">No room type specified • Room number will be assigned below</div>
                  </div>
                ) : selectedBookingForRoomAssignment.rooms.length === 0 && selectedBookingForRoomAssignment.roomType ? (
                  <div className="text-center text-yellow-700">
                    <div className="font-medium">Room - No Room Assigned Yet</div>
                    <div className="text-sm capitalize">Room type: {selectedBookingForRoomAssignment.roomType} • Room number will be assigned below</div>
                  </div>
                ) : (
                  selectedBookingForRoomAssignment.rooms.map((room, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Room {room.roomId.roomNumber}</div>
                        <div className="text-sm text-gray-600 capitalize">{room.roomId.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(room.rate, selectedBookingForRoomAssignment.currency)}/night</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Rooms for Assignment */}
            {availableRoomsForAssignment.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Available Rooms</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Handle bookings with empty rooms array (room-type bookings or no rooms assigned) */}
                  {selectedBookingForRoomAssignment.rooms.length === 0 ? (
                    selectedBookingForRoomAssignment.roomType ? (
                      // If booking has roomType, filter by that type
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2 capitalize">
                          Assign {selectedBookingForRoomAssignment.roomType} Room
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableRoomsForAssignment
                            .filter(room => room.type === selectedBookingForRoomAssignment.roomType)
                            .map((room) => (
                              <button
                                key={room._id}
                                className={`p-3 border rounded-lg text-sm transition-colors ${
                                  selectedRoomNumbers.selectedRoomId === room._id
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => setSelectedRoomNumbers({
                                  selectedRoomId: room._id,
                                  selectedRoomType: room.type,
                                  general: room.roomNumber
                                })}
                              >
                                <div className="font-semibold">{room.roomNumber}</div>
                                <div className="text-xs capitalize">{room.type}</div>
                                <div className="text-xs text-gray-500">₹{room.baseRate}/night</div>
                              </button>
                            ))
                          }
                        </div>
                        {availableRoomsForAssignment.filter(room => room.type === selectedBookingForRoomAssignment.roomType).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No available {selectedBookingForRoomAssignment.roomType} rooms for the selected dates
                          </div>
                        )}
                      </div>
                    ) : (
                      // If booking has no roomType, show all available rooms grouped by type
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-3">
                          Select a room for this booking:
                        </div>
                        {['single', 'double', 'suite', 'deluxe'].map(roomType => {
                          const roomsOfType = availableRoomsForAssignment.filter(room => room.type === roomType);
                          if (roomsOfType.length === 0) return null;
                          
                          return (
                            <div key={roomType} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2 capitalize">
                                {roomType} Rooms
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {roomsOfType.map((room) => (
                                  <button
                                    key={room._id}
                                    className={`p-3 border rounded-lg text-sm transition-colors ${
                                      selectedRoomNumbers.selectedRoomId === room._id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    onClick={() => setSelectedRoomNumbers({
                                      selectedRoomId: room._id,
                                      selectedRoomType: room.type,
                                      general: room.roomNumber
                                    })}
                                  >
                                    <div className="font-semibold">{room.roomNumber}</div>
                                    <div className="text-xs capitalize">{room.type}</div>
                                    <div className="text-xs text-gray-500">₹{room.baseRate}/night</div>
                                  </button>
                                ))
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    // Handle existing bookings with specific rooms already assigned (traditional re-assignment)
                    selectedBookingForRoomAssignment.rooms.map((bookingRoom, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Assign {bookingRoom.roomId.type} Room
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {availableRoomsForAssignment
                            .filter(room => room.type === bookingRoom.roomId.type)
                            .map((room) => (
                              <button
                                key={room._id}
                                className={`p-3 border rounded-lg text-sm transition-colors ${
                                  selectedRoomNumbers[bookingRoom.roomId.type] === room.roomNumber
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                onClick={() => setSelectedRoomNumbers(prev => ({
                                  ...prev,
                                  [bookingRoom.roomId.type]: room.roomNumber
                                }))}
                              >
                                <div className="font-semibold">{room.roomNumber}</div>
                                <div className="text-xs capitalize">{room.type}</div>
                                <div className="text-xs text-gray-500">₹{room.baseRate}/night</div>
                              </button>
                            ))
                          }
                        </div>
                        {availableRoomsForAssignment.filter(room => room.type === bookingRoom.roomId.type).length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No available {bookingRoom.roomId.type} rooms
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {availableRoomsForAssignment.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No available rooms found for the booking dates</p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoomAssignmentModal(false);
                setSelectedBookingForRoomAssignment(null);
                setAvailableRoomsForAssignment([]);
                setSelectedRoomNumbers({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRoomAssignment}
              disabled={!selectedRoomNumbers.selectedRoomId}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Assign Rooms
            </Button>
          </div>
        </Modal>
      )}

      {/* Walk-in Booking Modal */}
      <WalkInBooking
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        onSuccess={() => {
          fetchBookings();
          fetchStats();
        }}
      />

      {/* Payment Collection Modal */}
      {selectedBookingForPayment && (
        <PaymentCollectionModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBookingForPayment(null);
          }}
          onConfirm={handlePaymentCollection}
          totalAmount={selectedBookingForPayment.totalAmount}
          currency={selectedBookingForPayment.currency}
          bookingNumber={selectedBookingForPayment.bookingNumber}
        />
      )}
    </div>
  );
}