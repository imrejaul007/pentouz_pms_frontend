import { api } from './api';

export interface GuestServiceRequest {
  _id: string;
  hotelId: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  bookingId: {
    _id: string;
    bookingNumber: string;
  };
  serviceType: 'room_service' | 'housekeeping' | 'maintenance' | 'concierge' | 'transport' | 'spa' | 'laundry' | 'other';
  serviceVariation: string;
  serviceVariations?: string[];
  completedServiceVariations?: string[];
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

interface CreateServiceRequestData {
  bookingId: string;
  serviceType: string;
  serviceVariation?: string;
  serviceVariations: string[];
  title?: string;
  description?: string;
  priority?: string;
  scheduledTime?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  specialInstructions?: string;
}

interface ServiceRequestFilters {
  status?: string;
  serviceType?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class GuestServiceService {
  async createServiceRequest(data: CreateServiceRequestData): Promise<ApiResponse<{ serviceRequest: GuestServiceRequest }>> {
    const response = await api.post('/guest-services', data);
    return response.data;
  }

  async getServiceRequests(filters: ServiceRequestFilters = {}): Promise<ApiResponse<{ serviceRequests: GuestServiceRequest[] }>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/guest-services?${params.toString()}`);
    return response.data;
  }

  async getServiceRequestById(id: string): Promise<ApiResponse<{ serviceRequest: GuestServiceRequest }>> {
    const response = await api.get(`/guest-services/${id}`);
    return response.data;
  }

  async updateServiceRequest(id: string, updates: Partial<GuestServiceRequest>): Promise<ApiResponse<{ serviceRequest: GuestServiceRequest }>> {
    const response = await api.patch(`/guest-services/${id}`, updates);
    return response.data;
  }

  async cancelServiceRequest(id: string, reason?: string): Promise<ApiResponse<{ serviceRequest: GuestServiceRequest }>> {
    const response = await api.patch(`/guest-services/${id}/cancel`, { reason });
    return response.data;
  }
}

export const guestServiceService = new GuestServiceService();
