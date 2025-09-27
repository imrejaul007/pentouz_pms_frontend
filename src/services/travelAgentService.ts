import { api } from './api';

// Types
export interface TravelAgent {
  _id: string;
  userId: string;
  agentCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  businessDetails: {
    licenseNumber?: string;
    gstNumber?: string;
    establishedYear?: number;
    businessType?: 'domestic' | 'international' | 'both';
  };
  commissionStructure: {
    defaultRate: number;
    roomTypeRates?: Array<{
      roomTypeId: string;
      commissionRate: number;
    }>;
    seasonalRates?: Array<{
      season: string;
      commissionRate: number;
      validFrom: Date;
      validTo: Date;
    }>;
  };
  bookingLimits?: {
    maxBookingsPerDay: number;
    maxRoomsPerBooking: number;
    maxAdvanceBookingDays: number;
  };
  paymentTerms?: {
    creditLimit: number;
    paymentDueDays: number;
    preferredPaymentMethod: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  performanceMetrics: {
    totalBookings: number;
    totalRevenue: number;
    totalCommissionEarned: number;
    averageBookingValue: number;
    lastBookingDate?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelAgentBooking {
  _id: string;
  travelAgentId: string;
  hotelId: string;
  guestDetails: {
    primaryGuest: {
      name: string;
      email: string;
      phone: string;
    };
    totalGuests: number;
    totalRooms: number;
  };
  bookingDetails: {
    checkIn: Date;
    checkOut: Date;
    nights: number;
    roomTypes: Array<{
      roomTypeId: string;
      quantity: number;
      ratePerNight: number;
      specialRate?: number;
    }>;
  };
  pricing: {
    subtotal: number;
    taxes: number;
    fees: number;
    discounts: number;
    totalAmount: number;
    specialRateDiscount?: number;
  };
  commission: {
    rate: number;
    amount: number;
    bonusRate?: number;
    bonusAmount?: number;
    paymentStatus: 'pending' | 'paid' | 'processing' | 'cancelled';
    paidDate?: Date;
  };
  paymentDetails: {
    method: string;
    status: string;
    transactionId?: string;
  };
  bookingStatus: string;
  confirmationNumber: string;
  specialConditions?: {
    earlyCheckin?: boolean;
    lateCheckout?: boolean;
    roomUpgrade?: boolean;
    specialRequests?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelAgentRate {
  _id: string;
  travelAgentId: string;
  roomTypeId: string;
  hotelId: string;
  rateType: 'special_rate' | 'discount_percentage' | 'commission_bonus';
  specialRate?: number;
  discountPercentage?: number;
  commissionBonus?: number;
  validFrom: Date;
  validTo: Date;
  minimumNights: number;
  maximumNights: number;
  blackoutDates?: Date[];
  conditions?: {
    advanceBookingDays?: number;
    cancellationPolicy?: string;
    paymentTerms?: string;
  };
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TravelDashboardOverview {
  overview: {
    totalAgents: number;
    activeAgents: number;
    pendingApprovals: number;
    totalBookings: number;
    agentGrowth: number;
    revenueGrowth: number;
  };
  revenue: {
    totalRevenue: number;
    averageBookingValue: number;
    totalBookings: number;
  };
  commission: {
    totalCommission: number;
    pendingCommission: number;
    paidCommission: number;
    commissionRate: number;
  };
  topPerformers: Array<{
    _id: string;
    totalBookings: number;
    totalRevenue: number;
    totalCommission: number;
  }>;
  recentBookings: TravelAgentBooking[];
  monthlyTrends: Array<{
    _id: number;
    bookings: number;
    revenue: number;
    commission: number;
  }>;
  period: string;
  generatedAt: string;
}

// API Service
class TravelAgentService {
  // Travel Agent Management
  async registerTravelAgent(data: Partial<TravelAgent>): Promise<TravelAgent> {
    const response = await api.post('/travel-agents', data);
    return response.data.travelAgent;
  }

  async getAllTravelAgents(filters?: {
    status?: string;
    search?: string;
    sortBy?: string;
  }): Promise<{ travelAgents: TravelAgent[]; total: number }> {
    const response = await api.get('/travel-agents', { params: filters });
    return response.data.data;
  }

  async getTravelAgentById(id: string): Promise<TravelAgent> {
    const response = await api.get(`/travel-agents/${id}`);
    return response.data.travelAgent;
  }

  async getMyTravelAgentProfile(): Promise<TravelAgent> {
    const response = await api.get('/travel-agents/me');
    return response.data.data.travelAgent;
  }

  async updateTravelAgent(id: string, data: Partial<TravelAgent>): Promise<TravelAgent> {
    const response = await api.put(`/travel-agents/${id}`, data);
    return response.data.travelAgent;
  }

  async updateTravelAgentStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<TravelAgent> {
    const response = await api.patch(`/travel-agents/${id}/status`, { status, reason });
    return response.data.travelAgent;
  }

  async getTravelAgentPerformance(id: string): Promise<any> {
    const response = await api.get(`/travel-agents/${id}/performance`);
    return response.data.performance;
  }

  async validateAgentCode(code: string): Promise<{ valid: boolean; agent?: TravelAgent }> {
    const response = await api.get(`/travel-agents/validate-code/${code}`);
    return response.data;
  }

  // Travel Agent Bookings
  async createTravelAgentBooking(data: Partial<TravelAgentBooking>): Promise<TravelAgentBooking> {
    const response = await api.post('/travel-agents/bookings', data);
    return response.data.booking;
  }

  async getMyBookings(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ bookings: TravelAgentBooking[]; total: number }> {
    const response = await api.get('/travel-agents/me/bookings', { params: filters });
    return response.data.data; // Extract the nested data object
  }

  async getTravelAgentBookings(
    agentId: string,
    filters?: any
  ): Promise<{ bookings: TravelAgentBooking[]; total: number }> {
    const response = await api.get(`/travel-agents/${agentId}/bookings`, { params: filters });
    return response.data;
  }

  async updateBookingCommissionStatus(
    bookingId: string,
    status: string,
    paymentReference?: string
  ): Promise<TravelAgentBooking> {
    const response = await api.patch(`/travel-agents/bookings/${bookingId}/commission`, {
      paymentStatus: status,
      paymentReference
    });
    return response.data.booking;
  }

  // Travel Agent Rates
  async createTravelAgentRate(data: Partial<TravelAgentRate>): Promise<TravelAgentRate> {
    const response = await api.post('/travel-agents/rates', data);
    return response.data.rate;
  }

  async getTravelAgentRates(
    agentId: string,
    filters?: any
  ): Promise<{ rates: TravelAgentRate[]; total: number }> {
    const response = await api.get(`/travel-agents/${agentId}/rates`, { params: filters });
    return response.data;
  }

  async updateTravelAgentRate(
    rateId: string,
    data: Partial<TravelAgentRate>
  ): Promise<TravelAgentRate> {
    const response = await api.put(`/travel-agents/rates/${rateId}`, data);
    return response.data.rate;
  }

  async deleteTravelAgentRate(rateId: string): Promise<void> {
    await api.delete(`/travel-agents/rates/${rateId}`);
  }

  // Admin Travel Dashboard
  async getTravelDashboardOverview(): Promise<TravelDashboardOverview> {
    const response = await api.get('/admin/travel-dashboard');
    return response.data.data;
  }

  async getTravelAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    agentId?: string;
  }): Promise<any> {
    const response = await api.get('/admin/travel-dashboard/analytics', { params });
    return response.data.data;
  }

  async getPendingCommissions(): Promise<{
    commissions: Array<{
      agentId: string;
      agentName: string;
      totalAmount: number;
      bookings: number;
      oldestPending: Date;
    }>;
    totalAmount: number;
  }> {
    const response = await api.get('/admin/travel-dashboard/pending-commissions');
    return response.data;
  }

  async getTravelAgentRatesOverview(): Promise<any> {
    const response = await api.get('/admin/travel-dashboard/rates');
    return response.data.rates;
  }

  async exportTravelData(params: {
    type: 'bookings' | 'commissions' | 'agents' | 'rates';
    format: 'csv' | 'excel' | 'pdf';
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await api.get('/admin/travel-dashboard/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  // Phase 2 Methods: Core Travel Agent Pages
  async createSingleBooking(data: Partial<TravelAgentBooking>): Promise<TravelAgentBooking> {
    const response = await api.post('/travel-agents/bookings/single', data);
    return response.data.booking;
  }

  async getAgentRates(filters?: {
    roomType?: string;
    season?: string;
    validDate?: string;
  }): Promise<{ rates: TravelAgentRate[]; total: number }> {
    const response = await api.get('/travel-agents/me/rates', { params: filters });
    return response.data;
  }

  async updateAgentProfile(data: Partial<TravelAgent>): Promise<TravelAgent> {
    const response = await api.put('/travel-agents/me', data);
    return response.data.travelAgent;
  }

  async downloadRateSheet(format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    const response = await api.get('/travel-agents/me/rates/download', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }

  async getAvailableRooms(params: {
    checkIn: string;
    checkOut: string;
    guests?: number;
  }): Promise<any[]> {
    const response = await api.get('/travel-agents/available-rooms', { params });
    return response.data.rooms;
  }

  async validateBookingData(data: Partial<TravelAgentBooking>): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const response = await api.post('/travel-agents/bookings/validate', data);
    return response.data;
  }

  async getSeasonalRates(year?: number): Promise<any[]> {
    const response = await api.get('/travel-agents/me/seasonal-rates', {
      params: { year: year || new Date().getFullYear() }
    });
    return response.data.seasonalRates;
  }

  async uploadProfileImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/travel-agents/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.imageUrl;
  }

  async getRoomAvailabilityCalendar(params: {
    roomTypeId: string;
    startDate: string;
    endDate: string;
  }): Promise<Record<string, number>> {
    const response = await api.get('/travel-agents/room-availability', { params });
    return response.data.availability;
  }

  async getCommissionProjection(params: {
    bookingAmount: number;
    roomTypeId: string;
    checkInDate: string;
    nights: number;
  }): Promise<{
    baseCommission: number;
    bonusCommission: number;
    totalCommission: number;
    commissionRate: number;
    bonusRate: number;
  }> {
    const response = await api.post('/travel-agents/commission-projection', params);
    return response.data.projection;
  }

  // Utility Methods
  calculateCommission(
    bookingAmount: number,
    commissionRate: number,
    bonusRate: number = 0
  ): { commission: number; bonus: number; total: number } {
    const commission = (bookingAmount * commissionRate) / 100;
    const bonus = (bookingAmount * bonusRate) / 100;
    return {
      commission,
      bonus,
      total: commission + bonus
    };
  }

  formatAgentCode(code: string): string {
    return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  getCommissionStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      pending: 'yellow',
      processing: 'blue',
      paid: 'green',
      cancelled: 'red'
    };
    return statusColors[status] || 'gray';
  }

  getAgentStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      active: 'green',
      inactive: 'gray',
      suspended: 'red',
      pending_approval: 'yellow'
    };
    return statusColors[status] || 'gray';
  }

  // Multi-Booking Methods
  async createMultiBooking(data: {
    hotelId: string;
    bookingDates: {
      checkIn: Date;
      checkOut: Date;
      nights: number;
    };
    roomBookings: Array<{
      id: string;
      roomTypeId: string;
      roomTypeName: string;
      guestDetails: {
        primaryGuest: {
          name: string;
          email: string;
          phone: string;
        };
        additionalGuests: Array<{
          name: string;
          age: number;
        }>;
        totalGuests: number;
      };
      specialRequests?: string;
      addOns: Array<{
        name: string;
        price: number;
        quantity: number;
      }>;
      ratePerNight: number;
      specialRate?: number;
    }>;
    paymentMethod: string;
    specialInstructions?: string;
    bulkPricing: {
      subtotal: number;
      taxes: number;
      fees: number;
      discounts: number;
      totalAmount: number;
      commissionAmount: number;
      roomBreakdown: Array<{
        roomId: string;
        roomTotal: number;
        commission: number;
      }>;
    };
  }): Promise<{
    confirmationNumber: string;
    multiBookingId: string;
    roomConfirmations: Array<{
      roomId: string;
      confirmationNumber: string;
      status: string;
    }>;
    totalAmount: number;
    commissionAmount: number;
  }> {
    // Transform frontend data to match backend model structure
    const transformedData = {
      hotelId: data.hotelId,
      groupDetails: {
        groupName: `Group Booking - ${new Date().toISOString().split('T')[0]}`, // Generate a group name
        primaryContact: {
          name: data.roomBookings[0]?.guestDetails?.primaryGuest?.name || 'Primary Contact',
          email: data.roomBookings[0]?.guestDetails?.primaryGuest?.email || 'contact@example.com',
          phone: data.roomBookings[0]?.guestDetails?.primaryGuest?.phone || '+1234567890'
        },
        totalGuests: data.roomBookings.reduce((sum, room) => sum + room.guestDetails.totalGuests, 0),
        checkIn: data.bookingDates.checkIn,
        checkOut: data.bookingDates.checkOut,
        nights: data.bookingDates.nights
      },
      bookings: data.roomBookings.map(room => ({
        roomTypeId: room.roomTypeId,
        quantity: 1, // Each room booking is for 1 room
        ratePerNight: room.ratePerNight,
        specialRate: room.specialRate,
        guestDetails: {
          primaryGuest: room.guestDetails.primaryGuest,
          adults: room.guestDetails.totalGuests,
          children: 0 // Default to 0, can be enhanced later
        }
      })),
      paymentDetails: {
        method: data.paymentMethod === 'credit' ? 'credit_card' : 
                data.paymentMethod === 'invoice' ? 'agent_credit' : 
                data.paymentMethod === 'deposit' ? 'bank_transfer' : 'credit_card',
        status: 'pending'
      },
      specialConditions: {
        specialRequests: data.specialInstructions && data.specialInstructions.trim() ? data.specialInstructions.trim() : undefined
      }
    };

    const response = await api.post('/travel-agents/multi-booking', transformedData);
    return response.data;
  }

  async calculateBulkPricing(data: {
    hotelId: string;
    checkIn: Date;
    checkOut: Date;
    rooms: Array<{
      roomTypeId: string;
      guests: number;
      addOns: Array<{
        name: string;
        price: number;
        quantity: number;
      }>;
    }>;
  }): Promise<{
    subtotal: number;
    taxes: number;
    fees: number;
    discounts: number;
    totalAmount: number;
    commissionAmount: number;
    roomBreakdown: Array<{
      roomId: string;
      roomTotal: number;
      commission: number;
    }>;
    discountTiers: Array<{
      minRooms: number;
      discountPercent: number;
      name: string;
      description: string;
    }>;
    appliedDiscounts: string[];
  }> {
    const response = await api.post('/travel-agents/calculate-bulk-pricing', data);
    return response.data.pricing;
  }

  async getMultiBookingDetails(multiBookingId: string): Promise<{
    multiBookingId: string;
    confirmationNumber: string;
    travelAgentId: string;
    hotelId: string;
    bookingDates: {
      checkIn: Date;
      checkOut: Date;
      nights: number;
    };
    roomBookings: Array<{
      roomBookingId: string;
      roomTypeId: string;
      roomTypeName: string;
      guestDetails: {
        primaryGuest: {
          name: string;
          email: string;
          phone: string;
        };
        additionalGuests: Array<{
          name: string;
          age: number;
        }>;
        totalGuests: number;
      };
      specialRequests?: string;
      addOns: Array<{
        name: string;
        price: number;
        quantity: number;
      }>;
      ratePerNight: number;
      specialRate?: number;
      status: 'confirmed' | 'pending' | 'failed' | 'cancelled';
      paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
      confirmationNumber: string;
    }>;
    bulkPricing: {
      subtotal: number;
      taxes: number;
      fees: number;
      discounts: number;
      totalAmount: number;
      commissionAmount: number;
      roomBreakdown: Array<{
        roomId: string;
        roomTotal: number;
        commission: number;
      }>;
    };
    paymentDetails: {
      method: string;
      status: string;
      transactionId?: string;
      paidAmount: number;
      pendingAmount: number;
    };
    specialInstructions?: string;
    status: 'confirmed' | 'pending' | 'partially_confirmed' | 'failed' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
  }> {
    const response = await api.get(`/travel-agents/multi-booking/${multiBookingId}`);
    return response.data.multiBooking;
  }

  async updateMultiBookingStatus(
    multiBookingId: string,
    updates: {
      status?: 'confirmed' | 'pending' | 'partially_confirmed' | 'failed' | 'cancelled';
      paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
      specialInstructions?: string;
      roomUpdates?: Array<{
        roomBookingId: string;
        status?: 'confirmed' | 'pending' | 'failed' | 'cancelled';
        paymentStatus?: 'paid' | 'pending' | 'failed' | 'refunded';
        specialRequests?: string;
      }>;
    }
  ): Promise<{
    success: boolean;
    multiBooking: any;
    updatedRooms: string[];
  }> {
    const response = await api.patch(`/travel-agents/multi-booking/${multiBookingId}`, updates);
    return response.data;
  }

  async getMyMultiBookings(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    hotelId?: string;
    sortBy?: string;
  }): Promise<{
    multiBookings: Array<{
      multiBookingId: string;
      confirmationNumber: string;
      hotelId: string;
      hotelName: string;
      bookingDates: {
        checkIn: Date;
        checkOut: Date;
        nights: number;
      };
      totalRooms: number;
      totalGuests: number;
      totalAmount: number;
      commissionAmount: number;
      status: string;
      paymentStatus: string;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const response = await api.get('/travel-agents/me/multi-bookings', { params: filters });
    return response.data;
  }

  // Utility Methods for Multi-Booking
  calculateMultiBookingCommission(
    roomBookings: Array<{ roomTotal: number }>,
    baseRate: number = 8,
    bulkBonusRate: number = 2
  ): { baseCommission: number; bulkBonus: number; totalCommission: number } {
    const totalAmount = roomBookings.reduce((sum, room) => sum + room.roomTotal, 0);
    const baseCommission = (totalAmount * baseRate) / 100;
    const bulkBonus = roomBookings.length >= 3 ? (totalAmount * bulkBonusRate) / 100 : 0;

    return {
      baseCommission,
      bulkBonus,
      totalCommission: baseCommission + bulkBonus
    };
  }

  getBulkDiscountTier(roomCount: number): {
    discountPercent: number;
    tierName: string;
    description: string;
  } | null {
    const tiers = [
      { minRooms: 3, discountPercent: 5, tierName: 'Group Discount', description: '5% off for 3+ rooms' },
      { minRooms: 5, discountPercent: 8, tierName: 'Large Group', description: '8% off for 5+ rooms' },
      { minRooms: 10, discountPercent: 12, tierName: 'Corporate Rate', description: '12% off for 10+ rooms' },
      { minRooms: 20, discountPercent: 15, tierName: 'Conference Rate', description: '15% off for 20+ rooms' }
    ];

    const applicableTiers = tiers.filter(tier => roomCount >= tier.minRooms);
    return applicableTiers.length > 0 ? applicableTiers[applicableTiers.length - 1] : null;
  }

  validateMultiBookingData(data: {
    roomBookings: Array<{
      guestDetails: {
        primaryGuest: {
          name: string;
          email: string;
          phone: string;
        };
        totalGuests: number;
      };
      roomTypeId: string;
    }>;
    bookingDates: {
      checkIn: Date;
      checkOut: Date;
    };
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate booking dates
    if (data.bookingDates.checkIn >= data.bookingDates.checkOut) {
      errors.push('Check-out date must be after check-in date');
    }

    if (data.bookingDates.checkIn < new Date()) {
      errors.push('Check-in date cannot be in the past');
    }

    // Validate room bookings
    if (data.roomBookings.length === 0) {
      errors.push('At least one room booking is required');
    }

    data.roomBookings.forEach((room, index) => {
      if (!room.roomTypeId) {
        errors.push(`Room ${index + 1}: Room type is required`);
      }

      if (!room.guestDetails.primaryGuest.name.trim()) {
        errors.push(`Room ${index + 1}: Primary guest name is required`);
      }

      if (!room.guestDetails.primaryGuest.email.trim()) {
        errors.push(`Room ${index + 1}: Primary guest email is required`);
      } else if (!/\S+@\S+\.\S+/.test(room.guestDetails.primaryGuest.email)) {
        errors.push(`Room ${index + 1}: Valid email address is required`);
      }

      if (!room.guestDetails.primaryGuest.phone.trim()) {
        errors.push(`Room ${index + 1}: Primary guest phone is required`);
      }

      if (room.guestDetails.totalGuests < 1) {
        errors.push(`Room ${index + 1}: At least one guest is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const travelAgentService = new TravelAgentService();