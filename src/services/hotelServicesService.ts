import { api } from './api';

export interface HotelService {
  _id: string;
  name: string;
  description: string;
  type: 'dining' | 'spa' | 'gym' | 'transport' | 'entertainment' | 'business' | 'wellness' | 'recreation';
  price: number;
  currency: string;
  duration?: number;
  capacity?: number;
  isActive: boolean;
  images: string[];
  amenities: string[];
  operatingHours?: {
    open: string;
    close: string;
  };
  location?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  specialInstructions?: string;
  tags: string[];
  featured: boolean;
  rating: {
    average: number;
    count: number;
  };
  hotelId?: {
    _id: string;
    name: string;
    address?: string;
  };
  formattedPrice?: string;
  durationDisplay?: string;
  operatingHoursDisplay?: string;
}

export interface ServiceType {
  value: string;
  label: string;
  icon: string;
}

export interface ServiceBooking {
  _id: string;
  userId: string;
  serviceId: HotelService;
  hotelId: {
    _id: string;
    name: string;
    address?: string;
  };
  bookingDate: string;
  numberOfPeople: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  specialRequests?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  notes?: string;
  rating?: {
    score: number;
    review: string;
    reviewedAt: string;
  };
  reminderSent: boolean;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
  formattedAmount?: string;
  bookingDateDisplay?: string;
  timeUntilBooking?: string;
  statusColor?: string;
}

export interface AvailabilityCheck {
  available: boolean;
  reason?: string;
  availableCapacity?: number;
}

export interface ServiceBookingRequest {
  bookingDate: string;
  numberOfPeople: number;
  specialRequests?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface ServiceBookingsResponse {
  bookings: ServiceBooking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class HotelServicesService {
  /**
   * Get all hotel services
   */
  async getServices(params?: {
    type?: string;
    search?: string;
    featured?: boolean;
  }): Promise<HotelService[]> {
    const response = await api.get('/hotel-services', { params });
    return response.data.data;
  }

  /**
   * Get specific hotel service details
   */
  async getService(serviceId: string): Promise<HotelService> {
    const response = await api.get(`/hotel-services/${serviceId}`);
    return response.data.data;
  }

  /**
   * Get service details (alias for getService for consistency)
   */
  async getServiceDetails(serviceId: string): Promise<HotelService> {
    return this.getService(serviceId);
  }

  /**
   * Check service availability
   */
  async checkAvailability(
    serviceId: string,
    date: string,
    people: number
  ): Promise<AvailabilityCheck> {
    const response = await api.get(`/hotel-services/${serviceId}/availability`, {
      params: { date, people }
    });
    return response.data.data;
  }

  /**
   * Book a hotel service
   */
  async bookService(
    serviceId: string,
    bookingData: ServiceBookingRequest
  ): Promise<{ message: string; booking: ServiceBooking }> {
    const response = await api.post(`/hotel-services/${serviceId}/bookings`, bookingData);
    return response.data.data;
  }

  /**
   * Get user's service bookings
   */
  async getUserBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ServiceBookingsResponse> {
    const response = await api.get('/hotel-services/bookings', { params });
    return response.data.data;
  }

  /**
   * Get specific service booking details
   */
  async getBooking(bookingId: string): Promise<ServiceBooking> {
    const response = await api.get(`/hotel-services/bookings/${bookingId}`);
    return response.data.data;
  }

  /**
   * Cancel a service booking
   */
  async cancelBooking(
    bookingId: string,
    cancelData: CancelBookingRequest
  ): Promise<{ message: string; booking: ServiceBooking }> {
    const response = await api.post(`/hotel-services/bookings/${bookingId}/cancel`, cancelData);
    return response.data.data;
  }

  /**
   * Get all service types
   */
  async getServiceTypes(): Promise<ServiceType[]> {
    const response = await api.get('/hotel-services/types');
    return response.data.data;
  }

  /**
   * Get featured services
   */
  async getFeaturedServices(): Promise<HotelService[]> {
    const response = await api.get('/hotel-services/featured');
    return response.data.data;
  }

  /**
   * Get services by type
   */
  async getServicesByType(type: string): Promise<HotelService[]> {
    return this.getServices({ type });
  }

  /**
   * Search services
   */
  async searchServices(searchTerm: string): Promise<HotelService[]> {
    return this.getServices({ search: searchTerm });
  }

  /**
   * Get service type display info
   */
  getServiceTypeInfo(type: string): {
    label: string;
    color: string;
    icon: string;
    description: string;
  } {
    switch (type) {
      case 'dining':
        return {
          label: 'Dining & Restaurants',
          color: 'text-orange-600 bg-orange-100',
          icon: '🍽️',
          description: 'Restaurants, bars, and dining experiences'
        };
      case 'spa':
        return {
          label: 'Spa & Wellness',
          color: 'text-pink-600 bg-pink-100',
          icon: '💆',
          description: 'Spa treatments and wellness services'
        };
      case 'gym':
        return {
          label: 'Fitness & Gym',
          color: 'text-blue-600 bg-blue-100',
          icon: '💪',
          description: 'Fitness facilities and personal training'
        };
      case 'transport':
        return {
          label: 'Transportation',
          color: 'text-green-600 bg-green-100',
          icon: '🚗',
          description: 'Airport transfers and local transport'
        };
      case 'entertainment':
        return {
          label: 'Entertainment',
          color: 'text-purple-600 bg-purple-100',
          icon: '🎭',
          description: 'Shows, events, and entertainment'
        };
      case 'business':
        return {
          label: 'Business Services',
          color: 'text-gray-600 bg-gray-100',
          icon: '💼',
          description: 'Meeting rooms and business facilities'
        };
      case 'wellness':
        return {
          label: 'Wellness & Health',
          color: 'text-teal-600 bg-teal-100',
          icon: '🧘',
          description: 'Health and wellness programs'
        };
      case 'recreation':
        return {
          label: 'Recreation',
          color: 'text-indigo-600 bg-indigo-100',
          icon: '🏊',
          description: 'Swimming pools and recreational activities'
        };
      default:
        return {
          label: 'Service',
          color: 'text-gray-600 bg-gray-100',
          icon: '🔧',
          description: 'Hotel service'
        };
    }
  }

  /**
   * Get booking status display info
   */
  getBookingStatusInfo(status: string): {
    label: string;
    color: string;
    description: string;
  } {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'text-yellow-600 bg-yellow-100',
          description: 'Awaiting confirmation'
        };
      case 'confirmed':
        return {
          label: 'Confirmed',
          color: 'text-blue-600 bg-blue-100',
          description: 'Booking confirmed'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-600 bg-green-100',
          description: 'Service completed'
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-red-600 bg-red-100',
          description: 'Booking cancelled'
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600 bg-gray-100',
          description: 'Unknown status'
        };
    }
  }

  /**
   * Format price with currency
   */
  formatPrice(price: number, currency: string = 'INR'): string {
    return `${currency} ${price.toLocaleString()}`;
  }

  /**
   * Format duration in hours and minutes
   */
  formatDuration(minutes: number): string {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  /**
   * Format operating hours
   */
  formatOperatingHours(hours?: { open: string; close: string }): string {
    if (!hours?.open || !hours?.close) {
      return 'Contact for hours';
    }
    return `${hours.open} - ${hours.close}`;
  }

  /**
   * Calculate time until booking
   */
  getTimeUntilBooking(bookingDate: string): string {
    const now = new Date();
    const booking = new Date(bookingDate);
    const diff = booking.getTime() - now.getTime();
    
    if (diff <= 0) return 'Past';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if booking can be cancelled
   */
  canCancelBooking(booking: ServiceBooking): boolean {
    return booking.status === 'pending' || booking.status === 'confirmed';
  }

  /**
   * Check if booking is upcoming
   */
  isUpcomingBooking(booking: ServiceBooking): boolean {
    const now = new Date();
    const bookingDate = new Date(booking.bookingDate);
    return bookingDate > now && booking.status !== 'cancelled';
  }

  // Admin Methods for Service Management

  /**
   * Get all services for admin management (with pagination)
   */
  async getAdminServices(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    status?: string;
  }): Promise<{
    services: HotelService[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await api.get('/admin/hotel-services', { params });
    return response.data.data;
  }

  /**
   * Create a new hotel service (Admin only)
   */
  async createService(serviceData: FormData): Promise<HotelService> {
    const response = await api.post('/admin/hotel-services', serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  /**
   * Update a hotel service (Admin only)
   */
  async updateService(serviceId: string, serviceData: FormData): Promise<HotelService> {
    const response = await api.put(`/admin/hotel-services/${serviceId}`, serviceData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  /**
   * Delete a hotel service (Admin only)
   */
  async deleteService(serviceId: string): Promise<void> {
    await api.delete(`/admin/hotel-services/${serviceId}`);
  }

  /**
   * Toggle service active status (Admin only)
   */
  async toggleServiceStatus(serviceId: string): Promise<HotelService> {
    const response = await api.patch(`/admin/hotel-services/${serviceId}/toggle-status`);
    return response.data.data;
  }

  /**
   * Delete a specific service image (Admin only)
   */
  async deleteServiceImage(serviceId: string, imageIndex: number): Promise<HotelService> {
    const response = await api.delete(`/admin/hotel-services/${serviceId}/images/${imageIndex}`);
    return response.data.data;
  }

  /**
   * Perform bulk operations on services (Admin only)
   */
  async bulkOperations(operation: string, serviceIds: string[]): Promise<void> {
    await api.post('/admin/hotel-services/bulk-operations', {
      operation,
      serviceIds
    });
  }

  /**
   * Convert service data to FormData for API submission
   */
  convertToFormData(serviceData: any, images?: File[]): FormData {
    const formData = new FormData();

    // Add basic fields
    Object.keys(serviceData).forEach(key => {
      const value = serviceData[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[]`, item);
          });
        } else if (typeof value === 'object' && key === 'operatingHours') {
          formData.append('operatingHoursOpen', value.open || '');
          formData.append('operatingHoursClose', value.close || '');
        } else if (typeof value === 'object' && key === 'contactInfo') {
          if (value.phone) formData.append('contactPhone', value.phone);
          if (value.email) formData.append('contactEmail', value.email);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add image files
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }

    return formData;
  }
}

export const hotelServicesService = new HotelServicesService();
