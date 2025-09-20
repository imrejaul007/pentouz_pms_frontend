import { api } from './api';
import { HousekeepingTask, InventoryItem, RevenueData, OccupancyData, AdminBooking, BookingFilters, BookingStats } from '../types/admin';

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

class AdminService {
  // Housekeeping
  async getHousekeepingTasks(filters: any = {}): Promise<ApiResponse<{ tasks: HousekeepingTask[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/housekeeping?${params.toString()}`);
    return response.data;
  }

  async createHousekeepingTask(taskData: Partial<HousekeepingTask>): Promise<ApiResponse<{ task: HousekeepingTask }>> {
    console.log('Sending task data to API:', taskData);
    const response = await api.post('/housekeeping', taskData);
    return response.data;
  }

  async updateHousekeepingTask(id: string, updates: Partial<HousekeepingTask>): Promise<ApiResponse<{ task: HousekeepingTask }>> {
    const response = await api.patch(`/housekeeping/${id}`, updates);
    return response.data;
  }

  async getHousekeepingStats(): Promise<ApiResponse<{ stats: any[] }>> {
    const response = await api.get('/housekeeping/stats');
    return response.data;
  }

  // Inventory
  async getInventoryItems(filters: any = {}): Promise<ApiResponse<{ items: InventoryItem[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/inventory?${params.toString()}`);
    return response.data;
  }

  async createInventoryItem(itemData: Partial<InventoryItem>): Promise<ApiResponse<{ item: InventoryItem }>> {
    const response = await api.post('/inventory', itemData);
    return response.data;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<ApiResponse<{ item: InventoryItem }>> {
    const response = await api.patch(`/inventory/${id}`, updates);
    return response.data;
  }

  async createSupplyRequest(itemId: string, quantity: number, reason?: string): Promise<any> {
    const response = await api.post('/inventory/request', { itemId, quantity, reason });
    return response.data;
  }

  async processSupplyRequest(itemId: string, requestId: string, status: string): Promise<any> {
    const response = await api.patch(`/inventory/request/${itemId}/${requestId}`, { status });
    return response.data;
  }

  // Reports
  async getRevenueReport(filters: {
    startDate: string;
    endDate: string;
    groupBy?: string;
    hotelId?: string;
  }): Promise<ApiResponse<{ summary: any; breakdown: RevenueData[]; period: any }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/reports/revenue?${params.toString()}`);
    return response.data;
  }

  async getOccupancyReport(filters: {
    startDate: string;
    endDate: string;
    hotelId?: string;
  }): Promise<ApiResponse<{ summary: OccupancyData; occupancyByType: any; period: any }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/reports/occupancy?${params.toString()}`);
    return response.data;
  }

  async getBookingsReport(filters: any = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/reports/bookings?${params.toString()}`);
    return response.data;
  }

  // OTA Integration
  async syncBookingCom(hotelId: string): Promise<any> {
    const response = await api.post('/ota/bookingcom/sync', { hotelId });
    return response.data;
  }

  async getOTASyncStatus(hotelId: string): Promise<any> {
    const response = await api.get(`/ota/bookingcom/status/${hotelId}`);
    return response.data;
  }

  async getOTASyncHistory(filters: any = {}): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/ota/sync-history?${params.toString()}`);
    return response.data;
  }

  async getOTAConfig(hotelId: string): Promise<any> {
    const response = await api.get(`/ota/config/${hotelId}`);
    return response.data;
  }

  async updateOTAConfig(hotelId: string, provider: string, config: any): Promise<any> {
    const response = await api.patch(`/ota/config/${hotelId}`, { provider, config });
    return response.data;
  }

  async getOTAStats(hotelId: string): Promise<any> {
    const response = await api.get(`/ota/stats/${hotelId}`);
    return response.data;
  }

  async setupOTADemo(hotelId: string): Promise<any> {
    const response = await api.post(`/ota/setup/${hotelId}`);
    return response.data;
  }

  // Booking Management
  async getBookings(filters: BookingFilters = {}): Promise<ApiResponse<{ bookings: AdminBooking[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    try {
      // Try admin endpoint first, fallback to regular endpoint if it fails
      try {
        console.log('🔍 ADMIN DEBUG - Trying admin endpoint');
        const response = await api.get(`/admin/bookings?${params.toString()}`);
        console.log('🔍 ADMIN DEBUG - Admin endpoint success:', response.data);
        return response.data;
      } catch (adminError: any) {
        console.log('🔍 ADMIN DEBUG - Admin endpoint failed:', adminError.response?.status, adminError.message);
        console.log('🔍 ADMIN DEBUG - Falling back to regular endpoint');
        
        // Fallback to regular endpoint
        const response = await api.get(`/bookings?${params.toString()}`);
        console.log('🔍 ADMIN DEBUG - Regular endpoint success:', response.data);
        return response.data;
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Wait a bit and retry once for rate limit errors
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResponse = await api.get(`/bookings?${params.toString()}`);
        return retryResponse.data;
      }
      throw error;
    }
  }

  async getBookingById(id: string): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  }

  async updateBooking(id: string, updates: Partial<AdminBooking>): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.patch(`/bookings/${id}`, updates);
    return response.data;
  }

  async cancelBooking(id: string, reason?: string): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason });
    return response.data;
  }

  async checkInBooking(id: string, paymentDetails?: {
    paymentMethods: Array<{
      method: 'cash' | 'card' | 'upi' | 'online_portal' | 'corporate';
      amount: number;
      reference?: string;
      notes?: string;
    }>;
  }): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.patch(`/bookings/${id}/check-in`, { paymentDetails });
    return response.data;
  }

  async checkOutBooking(id: string): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.patch(`/bookings/${id}/check-out`);
    return response.data;
  }

  async createBooking(bookingData: {
    hotelId: string;
    userId: string;
    roomIds: string[];
    checkIn: string;
    checkOut: string;
    guestDetails: {
      adults: number;
      children: number;
      specialRequests?: string;
    };
    totalAmount: number;
    currency?: string;
    paymentStatus?: 'pending' | 'paid';
    status?: 'pending' | 'confirmed';
    roomType?: 'single' | 'double' | 'suite' | 'deluxe'; // Room type preference for room-type bookings
  }): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const payload = {
      ...bookingData,
      idempotencyKey: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currency: bookingData.currency || 'INR',
      paymentStatus: bookingData.paymentStatus || 'pending',
      status: bookingData.status || 'pending'
    };
    
    const response = await api.post('/bookings', payload);
    return response.data;
  }

  async assignRoomsToBooking(bookingId: string, assignmentData: {
    roomAssignments: { roomType: string; roomNumber: string; }[];
  }): Promise<ApiResponse<{ booking: AdminBooking }>> {
    const response = await api.patch(`/bookings/${bookingId}/assign-rooms`, assignmentData);
    return response.data;
  }

  async getAvailableRooms(hotelId: string, checkIn?: string, checkOut?: string): Promise<ApiResponse<{ rooms: any[] }>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    params.append('limit', '100'); // Get up to 100 rooms instead of default 10
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    
    const url = `/rooms?${params.toString()}`;
    console.log('Admin service - getAvailableRooms URL:', url);
    console.log('Admin service - Full URL:', `${api.defaults.baseURL}${url}`);
    console.log('Admin service - Headers:', { 'x-admin-request': 'true' });
    
    try {
      console.log('Making API request...');
      const response = await api.get(url, {
        headers: {
          'x-admin-request': 'true'
        }
      });
      console.log('API response received:', response);
      console.log('Response data:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API request failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      if (error.response?.status === 429) {
        console.log('Rate limit exceeded, retrying...');
        // Wait a bit and retry once for rate limit errors
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryResponse = await api.get(url, {
          headers: {
            'x-admin-request': 'true'
          }
        });
        console.log('Retry response:', retryResponse);
        return retryResponse.data;
      }
      throw error;
    }
  }

  async getUsers(filters: { search?: string; role?: string } = {}): Promise<ApiResponse<{ users: any[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  }

  async getBookingStats(filters: { startDate?: string; endDate?: string; hotelId?: string } = {}): Promise<ApiResponse<{ stats: BookingStats }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/reports/bookings/stats?${params.toString()}`);
    return response.data;
  }

  // Hotel Management
  async getHotels(filters: any = {}): Promise<ApiResponse<{ hotels: any[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/admin/hotels?${params.toString()}`);
    return response.data;
  }

  // User Management
  async createUser(userData: {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
    preferences?: any;
  }): Promise<ApiResponse<{ user: any }>> {
    const response = await api.post('/admin/users', userData);
    return response.data;
  }

  async updateUser(id: string, updates: any): Promise<ApiResponse<{ user: any }>> {
    const response = await api.patch(`/admin/users/${id}`, updates);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  }
}

export const adminService = new AdminService();