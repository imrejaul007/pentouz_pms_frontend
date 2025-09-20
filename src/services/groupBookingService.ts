import { api } from './api';

interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
  message?: string;
}

export interface GroupBookingRoom {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  employeeId?: string;
  department?: string;
  roomType: 'single' | 'double' | 'suite' | 'deluxe';
  roomId?: string;
  rate?: number;
  specialRequests?: string;
  bookingId?: string;
  status?: string;
  guestPreferences?: {
    bedType?: string;
    floor?: string;
    smokingAllowed?: boolean;
  };
}

export interface GroupBookingEventDetails {
  eventType?: 'conference' | 'training' | 'meeting' | 'team_building' | 'other';
  eventName?: string;
  eventDescription?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  meetingRoomRequired?: boolean;
  cateringRequired?: boolean;
  transportRequired?: boolean;
}

export interface GroupBookingContactPerson {
  name: string;
  email: string;
  phone: string;
  designation?: string;
}

export interface GroupBookingInvoiceDetails {
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  billingEmail?: string;
  purchaseOrderNumber?: string;
  costCenter?: string;
}

export interface CreateGroupBookingData {
  groupName: string;
  corporateCompanyId: string;
  checkIn: string;
  checkOut: string;
  paymentMethod: 'corporate_credit' | 'direct_billing' | 'advance_payment';
  rooms: GroupBookingRoom[];
  contactPerson: GroupBookingContactPerson;
  eventDetails?: GroupBookingEventDetails;
  invoiceDetails?: GroupBookingInvoiceDetails;
  specialInstructions?: string;
}

export interface GroupBooking extends CreateGroupBookingData {
  _id: string;
  hotelId: string;
  groupCode: string;
  nights: number;
  totalRooms: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'confirmed' | 'partially_confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  corporateCompanyId: {
    _id: string;
    name: string;
    email: string;
    creditLimit: number;
    availableCredit: number;
  };
  metadata: {
    createdBy?: string;
    lastModifiedBy?: string;
    source: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

class GroupBookingService {
  async createGroupBooking(bookingData: CreateGroupBookingData): Promise<ApiResponse<{ groupBooking: GroupBooking }>> {
    const response = await api.post('/corporate/group-bookings', bookingData);
    return response.data;
  }

  async getAllGroupBookings(filters: any = {}): Promise<ApiResponse<{ groupBookings: GroupBooking[] }>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/corporate/group-bookings?${params.toString()}`);
    return response.data;
  }

  async getGroupBooking(id: string): Promise<ApiResponse<{ groupBooking: GroupBooking }>> {
    const response = await api.get(`/corporate/group-bookings/${id}`);
    return response.data;
  }

  async updateGroupBooking(id: string, updateData: Partial<CreateGroupBookingData>): Promise<ApiResponse<{ groupBooking: GroupBooking }>> {
    const response = await api.patch(`/corporate/group-bookings/${id}`, updateData);
    return response.data;
  }

  async deleteGroupBooking(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`/corporate/group-bookings/${id}`);
    return response.data;
  }

  async toggleGroupBookingStatus(id: string, status: string): Promise<ApiResponse<{ groupBooking: GroupBooking }>> {
    const response = await api.patch(`/corporate/group-bookings/${id}/toggle-status`, { status });
    return response.data;
  }

  async confirmGroupBooking(id: string): Promise<ApiResponse<{ message: string; groupBooking: GroupBooking }>> {
    const response = await api.post(`/corporate/group-bookings/${id}/confirm`);
    return response.data;
  }

  async cancelGroupBooking(id: string, reason?: string, roomIndices?: number[]): Promise<ApiResponse<{ message: string; groupBooking: GroupBooking }>> {
    const response = await api.post(`/corporate/group-bookings/${id}/cancel`, { reason, roomIndices });
    return response.data;
  }

  async getUpcomingGroupBookings(days: number = 30): Promise<ApiResponse<{ groupBookings: GroupBooking[] }>> {
    const response = await api.get(`/corporate/group-bookings/upcoming?days=${days}`);
    return response.data;
  }

  async updateGroupBookingRoom(id: string, roomIndex: number, roomData: Partial<GroupBookingRoom>): Promise<ApiResponse<{ groupBooking: GroupBooking }>> {
    const response = await api.patch(`/corporate/group-bookings/${id}/rooms/${roomIndex}`, roomData);
    return response.data;
  }
}

export const groupBookingService = new GroupBookingService();