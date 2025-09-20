import { api } from './api';
import { Room, Booking, BookingFilters, CreateBookingRequest } from '../types/booking';
import { ensureAuthenticated } from '../utils/auth';

interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

class BookingService {
  async getRooms(filters: BookingFilters & { page?: number; limit?: number } = {}): Promise<ApiResponse<{ rooms: Room[] }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/rooms?${params.toString()}`);
    return response.data;
  }

  async getRoomById(id: string): Promise<ApiResponse<{ room: Room }>> {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  }

  async createBooking(bookingData: CreateBookingRequest): Promise<ApiResponse<{ booking: Booking }>> {
    // Generate a strong idempotency key with booking details
    const generateIdempotencyKey = (): string => {
      const timestamp = Date.now();
      const randomUUID = crypto.randomUUID();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user._id || user.id || 'anonymous';
      
      // Create a hash from key booking details to make each booking attempt unique
      const bookingDetails = `${bookingData.checkIn}-${bookingData.checkOut}-${bookingData.roomType || 'default'}-${bookingData.roomIds?.join(',') || 'none'}`;
      const detailsHash = btoa(bookingDetails).substring(0, 8); // Simple base64 hash, first 8 chars
      
      return `booking-${userId}-${timestamp}-${detailsHash}-${randomUUID}`;
    };

    // Get the current hotel ID from the bookings route (accessible to all authenticated users)
    let hotelId = bookingData.hotelId;
    if (!hotelId) {
      try {
        const hotelResponse = await api.get('/bookings/current-hotel');
        hotelId = hotelResponse.data.data.hotelId;
        console.log('Hotel ID from API:', hotelId);
      } catch (error) {
        console.warn('Could not get hotel ID from bookings route:', error);
        hotelId = null;
      }
    }
    
    // Always use default hotel ID if no hotelId is set (for guest users)
    if (!hotelId) {
      console.log('Using default hotel ID for guest user');
      hotelId = '68cd01414419c17b5f6b4c12'; // Default hotel ID
    }
    
    console.log('Final hotel ID being used:', hotelId);

    // Ensure we have the required fields for the backend API
    const enhancedBookingData = {
      ...bookingData,
      // Add required fields if missing
      hotelId: hotelId,
      idempotencyKey: bookingData.idempotencyKey || generateIdempotencyKey(),
      // Ensure roomIds is an array if roomId is provided as a string
      roomIds: bookingData.roomIds || (bookingData.roomId ? [bookingData.roomId] : undefined),
      // Set default currency if not provided
      currency: bookingData.currency || 'INR',
      // Ensure guestDetails has required fields
      guestDetails: {
        adults: 1,
        children: 0,
        ...bookingData.guestDetails
      }
    };

    console.log('Enhanced booking data:', enhancedBookingData);
    
    const response = await api.post('/bookings', enhancedBookingData);
    return response.data;
  }

  async getBookings(filters: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<{ bookings: Booking[] }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings?${params.toString()}`);
    return response.data;
  }

  async getBookingById(id: string): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.patch(`/bookings/${id}`, updates);
    return response.data;
  }

  async cancelBooking(id: string, reason?: string): Promise<ApiResponse<{ booking: Booking }>> {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  }

  // Get user's bookings (for guests)
  async getUserBookings(filters: { status?: string; page?: number; limit?: number } = {}): Promise<ApiResponse<Booking[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings?${params.toString()}`);
    return response.data;
  }

  // Check room availability
  async checkAvailability(roomIds: string[], checkIn: string, checkOut: string): Promise<ApiResponse<{ available: boolean; conflicting?: Booking[] }>> {
    const response = await api.post('/bookings/check-availability', {
      roomIds,
      checkIn,
      checkOut
    });
    return response.data;
  }

  // Get booking analytics (for dashboard)
  async getBookingStats(period: string = '30d'): Promise<ApiResponse<{
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    averageStay: number;
    statusBreakdown: Record<string, number>;
  }>> {
    const response = await api.get(`/bookings/stats?period=${period}`);
    return response.data;
  }

  // Get bookings for a specific room
  async getRoomBookings(roomId: string, filters: {
    status?: string;
    timeFilter?: 'past' | 'future' | 'current' | 'all';
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings/room/${roomId}?${params.toString()}`);
    return response.data;
  }

  // Booking modification requests
  async createModificationRequest(
    bookingId: string,
    modificationType: 'date_change' | 'room_upgrade' | 'guest_count' | 'early_checkin' | 'late_checkout' | 'cancellation',
    requestedChanges: Record<string, any>,
    reason: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<ApiResponse<any>> {
    const response = await api.post(`/bookings/${bookingId}/modification-request`, {
      modificationType,
      requestedChanges,
      reason,
      priority
    });
    return response.data;
  }

  async getModificationRequests(bookingId: string): Promise<ApiResponse<{ modifications: any[] }>> {
    const response = await api.get(`/bookings/${bookingId}/modification-requests`);
    return response.data;
  }

  // Admin only - review modification requests
  async reviewModificationRequest(
    bookingId: string,
    requestId: string,
    action: 'approve' | 'reject',
    reviewNotes?: string,
    approvedChanges?: Record<string, any>
  ): Promise<ApiResponse<any>> {
    const response = await api.patch(`/bookings/${bookingId}/modification-requests/${requestId}/review`, {
      action,
      reviewNotes,
      approvedChanges
    });
    return response.data;
  }

  // Booking Conversation methods
  async createConversation(
    bookingId: string,
    subject: string,
    initialMessage: string,
    category: string = 'general_inquiry',
    priority: string = 'normal',
    attachments: any[] = []
  ): Promise<ApiResponse<any>> {
    const response = await api.post('/booking-conversations', {
      bookingId,
      subject,
      initialMessage,
      category,
      priority,
      attachments
    });
    return response.data;
  }

  async getConversations(filters: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    priority?: string;
    bookingId?: string;
  } = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/booking-conversations?${params.toString()}`);
    return response.data;
  }

  async getConversation(conversationId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/booking-conversations/${conversationId}`);
    return response.data;
  }

  async addMessageToConversation(
    conversationId: string,
    content: string,
    messageType: string = 'text',
    attachments: any[] = [],
    relatedData: Record<string, any> = {}
  ): Promise<ApiResponse<any>> {
    const response = await api.post(`/booking-conversations/${conversationId}/messages`, {
      content,
      messageType,
      attachments,
      relatedData
    });
    return response.data;
  }

  async markConversationAsRead(
    conversationId: string,
    messageIds?: string[]
  ): Promise<ApiResponse<any>> {
    const response = await api.patch(`/booking-conversations/${conversationId}/read`, {
      messageIds
    });
    return response.data;
  }

  async assignConversation(
    conversationId: string,
    staffUserId: string
  ): Promise<ApiResponse<any>> {
    const response = await api.patch(`/booking-conversations/${conversationId}/assign`, {
      staffUserId
    });
    return response.data;
  }

  async updateConversationStatus(
    conversationId: string,
    status: 'active' | 'resolved' | 'closed' | 'escalated',
    reason?: string
  ): Promise<ApiResponse<any>> {
    const response = await api.patch(`/booking-conversations/${conversationId}/status`, {
      status,
      reason
    });
    return response.data;
  }

  async getConversationStats(hotelId?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/booking-conversations/stats?${params.toString()}`);
    return response.data;
  }
}

export const bookingService = new BookingService();