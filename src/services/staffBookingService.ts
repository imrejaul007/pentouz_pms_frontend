import { api } from './api';

export interface StaffUpcomingBooking {
  _id: string;
  bookingNumber: string;
  userId: {
    name: string;
    email: string;
    phone?: string;
  };
  checkIn: string;
  checkOut: string;
  nights: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  totalAmount: number;
  currency: string;
  rooms?: Array<{
    roomId: {
      _id: string;
      roomNumber: string;
      type: string;
      baseRate: number;
      currentRate: number;
    };
    rate: number;
  }>;
  guestDetails?: {
    adults: number;
    children: number;
    specialRequests?: string;
  };
  hotelId: {
    name: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StaffUpcomingStats {
  todayArrivals: number;
  tomorrowArrivals: number;
  totalUpcoming: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
  stats?: StaffUpcomingStats;
}

class StaffBookingService {
  async getUpcomingBookings(filters: { days?: number; page?: number; limit?: number } = {}): Promise<ApiResponse<StaffUpcomingBooking[]>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/bookings/upcoming?${params.toString()}`);
    return response.data;
  }

  async getBookingById(id: string): Promise<ApiResponse<{ booking: StaffUpcomingBooking }>> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  }
}

export const staffBookingService = new StaffBookingService();