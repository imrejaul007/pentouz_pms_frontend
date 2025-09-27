import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { adminService } from '../../services/adminService';
import { formatCurrency } from '../../utils/dashboardUtils';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Home, 
  Calendar, 
  CreditCard, 
  Phone,
  Mail,
  MapPin,
  Users,
  Baby,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface WalkInBookingProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledData?: {
    roomNumber?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
  };
}

interface GuestForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  idType: 'passport' | 'driving_license' | 'national_id' | 'other';
  idNumber: string;
}

interface BookingForm {
  hotelId: string;
  roomIds: string[];
  checkIn: string;
  checkOut: string;
  guestDetails: {
    adults: number;
    children: number;
    specialRequests: string;
  };
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid';
  status: 'checked_in';
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  advanceAmount: number;
}

export default function WalkInBooking({ isOpen, onClose, onSuccess, prefilledData }: WalkInBookingProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  
  // Form states
  const [guestForm, setGuestForm] = useState<GuestForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    idType: 'passport',
    idNumber: ''
  });

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    hotelId: '', // Will be set dynamically based on user context or available hotels
    roomIds: [],
    checkIn: prefilledData?.checkIn || new Date().toISOString().split('T')[0],
    checkOut: prefilledData?.checkOut || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Set to 2 days later
    guestDetails: {
      adults: 1,
      children: 0,
      specialRequests: ''
    },
    totalAmount: 0,
    currency: 'INR',
    paymentStatus: 'pending',
    status: 'checked_in',
    paymentMethod: 'cash',
    advanceAmount: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch hotels on component mount
  useEffect(() => {
    if (isOpen) {
      fetchHotels();
    }
  }, [isOpen]);

  // Fetch available rooms when dates or hotel changes
  useEffect(() => {
    if (bookingForm.hotelId && bookingForm.checkIn && bookingForm.checkOut) {
      fetchAvailableRooms();
    }
  }, [bookingForm.hotelId, bookingForm.checkIn, bookingForm.checkOut]);

  // Auto-select room when prefilled room number is available and rooms are loaded
  useEffect(() => {
    if (prefilledData?.roomNumber && availableRooms.length > 0 && bookingForm.roomIds.length === 0) {
      const matchingRoom = availableRooms.find(room =>
        room.roomNumber === prefilledData.roomNumber && room.isAvailable
      );

      if (matchingRoom) {
        console.log('🎯 Auto-selecting pre-filled room:', matchingRoom.roomNumber);
        setBookingForm(prev => ({
          ...prev,
          roomIds: [matchingRoom._id]
        }));
      } else {
        console.log('⚠️ Pre-filled room not found or not available:', prefilledData.roomNumber);
        // Show user which room was requested but unavailable
        toast.error(`Room ${prefilledData.roomNumber} is not available for the selected dates`);
      }
    }
  }, [availableRooms, prefilledData?.roomNumber, bookingForm.roomIds.length]);

  const fetchHotels = async () => {
    try {
      console.log('🏨 [WalkInBooking] Fetching hotels...');
      const response = await adminService.getHotels();
      const hotelsList = response.data.hotels || [];
      console.log('🏨 [WalkInBooking] Hotels fetched:', hotelsList);

      setHotels(hotelsList);

      // Dynamic hotel selection logic
      let selectedHotel = '';

      // 1. First try to use user's hotel if available
      if (user?.hotelId) {
        const userHotel = hotelsList.find(hotel => hotel._id === user.hotelId);
        if (userHotel) {
          selectedHotel = user.hotelId;
          console.log('🏨 [WalkInBooking] Using user hotel:', userHotel.name);
        }
      }

      // 2. If no user hotel, try to use the seeded hotel ID
      if (!selectedHotel) {
        const seededHotel = hotelsList.find(hotel => hotel._id === '68c7e6ebca8aed0ec8036a9c');
        if (seededHotel) {
          selectedHotel = '68c7e6ebca8aed0ec8036a9c';
          console.log('🏨 [WalkInBooking] Using seeded hotel:', seededHotel.name);
        }
      }

      // 3. Fallback to first available hotel
      if (!selectedHotel && hotelsList.length > 0) {
        selectedHotel = hotelsList[0]._id;
        console.log('🏨 [WalkInBooking] Fallback to first hotel:', hotelsList[0].name);
      }

      // Set the selected hotel
      if (selectedHotel) {
        setSelectedHotelId(selectedHotel);
        setBookingForm(prev => ({
          ...prev,
          hotelId: selectedHotel
        }));
        console.log('🏨 [WalkInBooking] Hotel selected:', selectedHotel);
      } else {
        console.warn('⚠️ [WalkInBooking] No hotels available');
        toast.error('No hotels available. Please contact administrator.');
      }

    } catch (error) {
      console.error('❌ [WalkInBooking] Error fetching hotels:', error);
      toast.error('Failed to load hotel information. Please try again.');
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      console.log('🏨 [WalkInBooking] Fetching available rooms with params:', {
        hotelId: bookingForm.hotelId,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut
      });

      console.log('🔍 [WalkInBooking] Making API call to getAvailableRooms...');
      const response = await adminService.getAvailableRooms(
        bookingForm.hotelId,
        bookingForm.checkIn,
        bookingForm.checkOut
      );
      console.log('✅ [WalkInBooking] Available rooms response:', response);
      console.log('📊 [WalkInBooking] Response data structure:', response.data);
      console.log('🏠 [WalkInBooking] Rooms array:', response.data.rooms);
      console.log('📈 [WalkInBooking] Total rooms returned:', response.data.rooms?.length || 0);

      const rooms = response.data.rooms || [];
      const availableRooms = rooms.filter(room => room.isAvailable);
      const unavailableRooms = rooms.filter(room => !room.isAvailable);

      console.log(`🏠 [WalkInBooking] Rooms breakdown: ${rooms.length} total, ${availableRooms.length} available, ${unavailableRooms.length} unavailable`);

      if (availableRooms.length === 0 && rooms.length > 0) {
        console.log('⚠️ [WalkInBooking] No available rooms found, reasons:');
        unavailableRooms.forEach((room, index) => {
          console.log(`  Room ${index + 1}: ${room.roomNumber} - Status: ${room.currentStatus}, Occupied by booking: ${room.isOccupiedByBooking}`);
        });
      }

      console.log('💾 [WalkInBooking] Setting available rooms state with all rooms (frontend will filter by availability)');
      setAvailableRooms(rooms); // Store all rooms, let frontend filter them
    } catch (error: any) {
      console.error('❌ [WalkInBooking] Error fetching available rooms:', error);
      console.error('❌ [WalkInBooking] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });

      // Handle different types of errors with user-friendly messages
      if (error.response?.status === 429) {
        console.log('⏳ [WalkInBooking] Rate limit exceeded, will retry automatically');
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status === 404) {
        console.log('🔍 [WalkInBooking] No hotel or rooms found');
        toast.error('No rooms found for the selected hotel. Please check hotel configuration.');
      } else if (error.response?.status === 401) {
        console.log('🔐 [WalkInBooking] Authentication required');
        toast.error('Please log in again to access room information.');
      } else if (error.response?.status >= 500) {
        console.log('🚨 [WalkInBooking] Server error');
        toast.error('Server error occurred. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.log('🌐 [WalkInBooking] Network error');
        toast.error('Network error. Please check your connection and try again.');
      } else {
        console.log('⚠️ [WalkInBooking] Unknown error');
        toast.error('Failed to fetch room availability. Please try again.');
      }

      setAvailableRooms([]);
    }
  };



  const validateGuestForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!guestForm.name.trim()) newErrors.name = 'Name is required';
    if (!guestForm.email.trim()) newErrors.email = 'Email is required';
    if (!guestForm.phone.trim()) newErrors.phone = 'Phone is required';
    if (!guestForm.address.trim()) newErrors.address = 'Address is required';
    if (!guestForm.city.trim()) newErrors.city = 'City is required';
    if (!guestForm.state.trim()) newErrors.state = 'State is required';
    if (!guestForm.idNumber.trim()) newErrors.idNumber = 'ID Number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBookingForm = () => {
    const newErrors: Record<string, string> = {};
    
    console.log('Validating booking form:', bookingForm);
    
    if (!bookingForm.roomIds.length) {
      newErrors.rooms = 'Please select at least one room';
      console.log('Room validation failed: no rooms selected');
    }
    if (!bookingForm.checkIn) {
      newErrors.checkIn = 'Check-in date is required';
      console.log('Check-in validation failed: no check-in date');
    }
    if (!bookingForm.checkOut) {
      newErrors.checkOut = 'Check-out date is required';
      console.log('Check-out validation failed: no check-out date');
    }
    if (bookingForm.guestDetails.adults < 1) {
      newErrors.adults = 'At least one adult is required';
      console.log('Adults validation failed: less than 1 adult');
    }

    // Validate that check-out is after check-in
    if (bookingForm.checkIn && bookingForm.checkOut) {
      const checkInDate = new Date(bookingForm.checkIn);
      const checkOutDate = new Date(bookingForm.checkOut);
      if (checkInDate >= checkOutDate) {
        newErrors.checkOut = 'Check-out date must be after check-in date';
        console.log('Date validation failed: check-out not after check-in');
      }
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut || bookingForm.roomIds.length === 0) {
      return 0;
    }

    const checkInDate = new Date(bookingForm.checkIn);
    const checkOutDate = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const selectedRooms = availableRooms.filter(room => bookingForm.roomIds.includes(room._id) && room.isAvailable);
    const roomsTotal = selectedRooms.reduce((total, room) => total + (room.currentRate || 0), 0);
    
    return roomsTotal * nights;
  };

  const handleNext = () => {
    console.log('handleNext called, step:', step);
    if (step === 1) {
      const isValid = validateGuestForm();
      console.log('Step 1 validation result:', isValid);
      if (!isValid) return;
    }
    if (step === 2) {
      const isValid = validateBookingForm();
      console.log('Step 2 validation result:', isValid);
      console.log('Booking form state:', bookingForm);
      console.log('Available rooms:', availableRooms);
      if (!isValid) return;
    }
    
    console.log('Moving to next step:', step + 1);
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleCreateBooking = async () => {
    try {
      setLoading(true);
      
      // Create user account for walk-in guest
      const userData = {
        name: guestForm.name,
        email: guestForm.email,
        phone: guestForm.phone,
        role: 'guest',
        password: Math.random().toString(36).substring(2, 15), // Generate random password
        preferences: {
          other: `Walk-in guest. Address: ${guestForm.address}, ${guestForm.city}, ${guestForm.state}, ${guestForm.country}. ID: ${guestForm.idType} - ${guestForm.idNumber}`
        }
      };

      let userId;
      try {
        // Create user and booking in sequence
        const userResponse = await adminService.createUser(userData);
        userId = userResponse.data.user._id;
        toast.success('Guest account created successfully');
      } catch (userError) {
        console.error('Error creating user:', userError);
        console.error('User error status:', userError.response?.status);
        console.error('User error message:', userError.response?.data?.message);
        console.error('Full error:', userError.response?.data);

        // Check if user already exists
        if (userError.response?.status === 409 && userError.response?.data?.message?.includes('already exists')) {
          // User exists, fetch the existing user using search
          try {
            const existingUsersResponse = await adminService.getUsers({ search: guestForm.email });
            const existingUser = existingUsersResponse.data.users.find(user => user.email === guestForm.email);
            if (existingUser) {
              userId = existingUser._id;
              toast.info(`Using existing guest account for ${guestForm.email}`);
            } else {
              toast.error('User exists but could not retrieve details. Please try again.');
              return;
            }
          } catch (fetchError) {
            toast.error('Could not retrieve existing user details. Please try again.');
            return;
          }
        } else if (userError.response?.status === 400) {
          toast.error(`User creation failed: ${userError.response?.data?.message || 'Invalid user data'}`);
          return;
        } else {
          toast.error('Failed to create guest account. Please try again.');
          return;
        }
      }

      // Create booking
      console.log('🔍 Creating booking with userId:', userId);
      console.log('🔍 Payment details:', {
        paymentMethod: bookingForm.paymentMethod,
        advanceAmount: bookingForm.advanceAmount,
        totalAmount: calculateTotalAmount(),
        paymentStatus: bookingForm.advanceAmount >= calculateTotalAmount() ? 'paid' : (bookingForm.advanceAmount > 0 ? 'partially_paid' : 'pending')
      });

      try {
                 const bookingData = {
           hotelId: bookingForm.hotelId,
           userId: userId,
           roomIds: bookingForm.roomIds,
           checkIn: bookingForm.checkIn,
           checkOut: bookingForm.checkOut,
           guestDetails: bookingForm.guestDetails,
           totalAmount: calculateTotalAmount(),
           currency: bookingForm.currency,
           paymentStatus: bookingForm.advanceAmount >= calculateTotalAmount() ? 'paid' : (bookingForm.advanceAmount > 0 ? 'partially_paid' : 'pending'),
           status: 'confirmed' as const,
           // Include payment information
           paymentMethod: bookingForm.paymentMethod,
           advanceAmount: bookingForm.advanceAmount,
           paymentReference: '', // Can be extended later for card/UPI references
           paymentNotes: bookingForm.advanceAmount > 0 ? `Walk-in payment: ${formatCurrency(bookingForm.advanceAmount, bookingForm.currency)} via ${bookingForm.paymentMethod}` : '',
           // Required idempotency key
           idempotencyKey: `walkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
         };

        await adminService.createBooking(bookingData);
        
        toast.success('Walk-in booking created successfully!');
        
        // Invalidate all relevant queries to force refresh
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['rooms'] }); 
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['real-time'] });
        queryClient.invalidateQueries({ queryKey: ['occupancy'] });
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        
        // Call onSuccess to refresh parent component data
        onSuccess();
        
        // Refresh available rooms in this component too
        if (bookingForm.hotelId && bookingForm.checkIn && bookingForm.checkOut) {
          setTimeout(() => {
            fetchAvailableRooms();
          }, 500); // Small delay to allow backend to process
        }
        
        // Close modal after a short delay to show success message
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (bookingError) {
        console.error('Error creating booking:', bookingError);
        console.error('Booking error status:', bookingError.response?.status);
        console.error('Booking error message:', bookingError.response?.data?.message);
        console.error('Full booking error:', bookingError.response?.data);
        console.error('Booking data that failed:', typeof bookingData !== 'undefined' ? bookingData : 'bookingData not available');

        if (bookingError.response?.status === 400) {
          toast.error(`Booking failed: ${bookingError.response?.data?.message || 'Invalid booking data'}`);
        } else if (bookingError.response?.status === 409) {
          toast.error('Selected rooms are no longer available. Please select different rooms.');
        } else {
          toast.error('Failed to create booking. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGuestForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      idType: 'passport',
      idNumber: ''
    });
    setBookingForm({
      hotelId: selectedHotelId || '', // Use the dynamically selected hotel ID
      roomIds: [],
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Set to 2 days later
      guestDetails: {
        adults: 1,
        children: 0,
        specialRequests: ''
      },
      totalAmount: 0,
      currency: 'INR',
      paymentStatus: 'pending',
      status: 'checked_in',
      paymentMethod: 'cash',
      advanceAmount: 0
    });
    setErrors({});
    onClose();
  };

  const totalAmount = calculateTotalAmount();
  const remainingAmount = totalAmount - bookingForm.advanceAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={prefilledData?.roomNumber ? `New Booking - Room ${prefilledData.roomNumber}` : "Walk-in Booking"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Pre-filled Info Banner */}
        {prefilledData?.roomNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Quick Booking from Tape Chart - Room {prefilledData.roomNumber}
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Check-in: {prefilledData.checkIn} | Check-out: {prefilledData.checkOut} | {prefilledData.nights} night{prefilledData.nights !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Guest Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Guest Information</h3>
              <p className="text-sm text-gray-600">Enter details for the walk-in guest</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="text"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="pl-10"
                    error={errors.name}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    className="pl-10"
                    error={errors.email}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    className="pl-10"
                    error={errors.phone}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Type *
                </label>
                <select
                  value={guestForm.idType}
                  onChange={(e) => setGuestForm(prev => ({ 
                    ...prev, 
                    idType: e.target.value as 'passport' | 'driving_license' | 'national_id' | 'other' 
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="national_id">National ID</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number *
                </label>
                <Input
                  type="text"
                  value={guestForm.idNumber}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Enter ID number"
                  error={errors.idNumber}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <Input
                  type="text"
                  value={guestForm.country}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  type="text"
                  value={guestForm.address}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter street address"
                  className="pl-10"
                  error={errors.address}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  type="text"
                  value={guestForm.city}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                  error={errors.city}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <Input
                  type="text"
                  value={guestForm.state}
                  onChange={(e) => setGuestForm(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                  error={errors.state}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Booking Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
              <p className="text-sm text-gray-600">Select rooms and dates for the stay</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hotel
                </label>
                <select
                  value={bookingForm.hotelId}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, hotelId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  {hotels.map(hotel => (
                    <option key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date *
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10"
                    error={errors.checkIn}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date *
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                                     <Input
                     type="date"
                     value={bookingForm.checkOut}
                     onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                     min={bookingForm.checkIn ? new Date(new Date(bookingForm.checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                     className="pl-10"
                     error={errors.checkOut}
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Adults *
                </label>
                <div className="relative">
                  <Users className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="number"
                    min="1"
                    value={bookingForm.guestDetails.adults}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      guestDetails: { ...prev.guestDetails, adults: parseInt(e.target.value) || 1 }
                    }))}
                    className="pl-10"
                    error={errors.adults}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Children
                </label>
                <div className="relative">
                  <Baby className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="number"
                    min="0"
                    value={bookingForm.guestDetails.children}
                    onChange={(e) => setBookingForm(prev => ({
                      ...prev,
                      guestDetails: { ...prev.guestDetails, children: parseInt(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

                         {/* Available Rooms */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Available Rooms * ({availableRooms.filter(room => room.isAvailable).length} available of {availableRooms.length} total)
               </label>

               {/* Show available rooms */}
               {availableRooms.filter(room => room.isAvailable).length > 0 ? (
                 <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2">
                   {availableRooms.filter(room => room.isAvailable).map((room) => (
                     <div
                       key={room._id}
                       className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                         bookingForm.roomIds.includes(room._id)
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-300 hover:border-gray-400'
                       }`}
                       onClick={() => {
                         setBookingForm(prev => ({
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
                             <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Available</span>
                             {prefilledData?.roomNumber === room.roomNumber && (
                               <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-medium">
                                 Pre-selected
                               </span>
                             )}
                           </div>
                           <div className="text-sm text-gray-600">
                             {room.type} • Floor {room.floor} • Status: {room.currentStatus}
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="font-medium">
                             {formatCurrency(room.currentRate || 0, 'INR')}/night
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : availableRooms.length > 0 ? (
                 // Show unavailable rooms with reasons
                 <div className="space-y-3">
                   <div className="p-4 border border-orange-300 rounded-lg bg-orange-50">
                     <div className="flex items-center mb-2">
                       <AlertCircle className="h-4 w-4 text-orange-600 mr-2" />
                       <p className="text-orange-800 font-medium">No available rooms for selected dates</p>
                     </div>
                     <p className="text-orange-700 text-sm">
                       {availableRooms.length} rooms found, but all are currently unavailable. See details below:
                     </p>
                   </div>

                   <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                     <div className="text-sm text-gray-600 font-medium mb-2">Unavailable Rooms:</div>
                     {availableRooms.filter(room => !room.isAvailable).map((room) => (
                       <div key={room._id} className="p-2 border border-gray-200 rounded bg-white">
                         <div className="flex justify-between items-center">
                           <div>
                             <div className="flex items-center">
                               <Home className="h-4 w-4 text-gray-400 mr-2" />
                               <span className="font-medium text-gray-700">Room {room.roomNumber}</span>
                               <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                 {room.isOccupiedByBooking ? 'Booked' : room.currentStatus}
                               </span>
                             </div>
                             <div className="text-xs text-gray-500">
                               {room.type} • Floor {room.floor}
                               {room.isOccupiedByBooking && ' • Has existing booking for these dates'}
                             </div>
                           </div>
                           <div className="text-right">
                             <div className="text-sm text-gray-600">
                               {formatCurrency(room.currentRate || 0, 'INR')}/night
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                   <p className="text-gray-600 text-center">
                     {bookingForm.checkIn && bookingForm.checkOut
                       ? 'No rooms found for this hotel. Please check hotel configuration.'
                       : 'Please select check-in and check-out dates to see available rooms.'
                     }
                   </p>
                 </div>
               )}

              {errors.rooms && (
                <p className="text-red-500 text-sm mt-1">{errors.rooms}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Requests
              </label>
              <div className="relative">
                <FileText className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={bookingForm.guestDetails.specialRequests}
                  onChange={(e) => setBookingForm(prev => ({
                    ...prev,
                    guestDetails: { ...prev.guestDetails, specialRequests: e.target.value }
                  }))}
                  placeholder="Any special requests or notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment & Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Payment & Confirmation</h3>
              <p className="text-sm text-gray-600">Review booking details and handle payment</p>
            </div>

            {/* Guest Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{guestForm.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{guestForm.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{guestForm.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ID</p>
                    <p className="font-medium">{guestForm.idType} - {guestForm.idNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-medium">{new Date(bookingForm.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-medium">{new Date(bookingForm.checkOut).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nights</p>
                      <p className="font-medium">
                        {Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium">
                        {bookingForm.guestDetails.adults} adult(s), {bookingForm.guestDetails.children} child(ren)
                      </p>
                    </div>
                  </div>

                                     <div>
                     <p className="text-sm text-gray-600 mb-2">Selected Rooms</p>
                     <div className="space-y-2">
                       {availableRooms
                         .filter(room => bookingForm.roomIds.includes(room._id) && room.isAvailable)
                         .map(room => (
                           <div key={room._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                             <span>Room {room.roomNumber} ({room.type})</span>
                             <span className="font-medium">
                               {formatCurrency(room.currentRate || 0, 'INR')}/night
                             </span>
                           </div>
                         ))}
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span>Total Amount</span>
                    <span className="text-blue-600">{formatCurrency(totalAmount, 'INR')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={bookingForm.paymentMethod}
                        onChange={(e) => setBookingForm(prev => ({ 
                          ...prev, 
                          paymentMethod: e.target.value as 'cash' | 'card' | 'upi' | 'bank_transfer' 
                        }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Advance Amount
                      </label>
                      <div className="relative">
                        <CreditCard className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                        <Input
                          type="number"
                          min="0"
                          max={totalAmount}
                          value={bookingForm.advanceAmount}
                          onChange={(e) => setBookingForm(prev => ({ 
                            ...prev, 
                            advanceAmount: Math.min(parseFloat(e.target.value) || 0, totalAmount)
                          }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {bookingForm.advanceAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-sm text-yellow-800">Remaining Amount</span>
                      <span className="font-medium text-yellow-800">
                        {formatCurrency(remainingAmount, 'INR')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-800">Payment Status</span>
                    <span className={`font-medium ${
                      bookingForm.advanceAmount >= totalAmount ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {bookingForm.advanceAmount >= totalAmount ? 'Fully Paid' : 'Partially Paid'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
                     <Button
             variant="ghost"
             onClick={step === 1 ? handleClose : handlePrevious}
             disabled={loading}
           >
            {step === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="flex space-x-3">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleCreateBooking}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
