import { api } from './api';

export interface ExtraPerson {
  personId?: string;
  name: string;
  type: 'adult' | 'child';
  age?: number;
  isActive?: boolean;
}

export interface ExtraPersonCharge {
  personId: string;
  baseCharge: number;
  totalCharge: number;
  currency: string;
  description: string;
  appliedAt: string;
}

export interface SettlementAdjustment {
  type: string;
  amount: number;
  description: string;
  appliedAt: string;
  appliedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
}

export interface SettlementData {
  status: string;
  finalAmount: number;
  outstandingBalance: number;
  refundAmount: number;
  adjustments: SettlementAdjustment[];
  lastUpdated: string;
}

export interface PricingRule {
  _id: string;
  name: string;
  description: string;
  chargeType: 'fixed' | 'percentage_of_room_rate' | 'per_night';
  amount: number;
  guestType: 'adult' | 'child';
  applicableRoomTypes: string[];
  ageRange?: {
    min: number;
    max: number;
  };
  priority: number;
  isActive: boolean;
}

export interface DynamicPricingRequest {
  extraPersons: Array<{
    name: string;
    type: 'adult' | 'child';
    age?: number;
  }>;
  baseBookingData: {
    roomType: string;
    baseRoomRate: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    source: string;
    guestDetails: {
      adults: number;
      children: number;
    };
  };
  guestProfile?: {
    loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    isVIP?: boolean;
  };
  useDynamicPricing?: boolean;
}

export interface DynamicPricingResponse {
  success: boolean;
  pricingBreakdown: {
    chargeBreakdown: Array<{
      personId: string;
      personName: string;
      personType: string;
      age?: number;
      baseCharge: number;
      totalCharge: number;
      currency: string;
    }>;
    totalFinalAmount: number;
    totalSavings?: number;
    appliedStrategies?: string[];
  };
  totalExtraPersonCharge: number;
  currency: string;
  calculationMethod: string;
}

class BookingEditingService {
  // Extra Person Management
  async addExtraPersonToBooking(
    bookingId: string,
    personData: {
      name: string;
      type: 'adult' | 'child';
      age?: number;
      autoCalculateCharges?: boolean;
    }
  ) {
    const response = await api.post(`/bookings/${bookingId}/extra-persons`, personData);
    return response.data;
  }

  async removeExtraPersonFromBooking(bookingId: string, personId: string) {
    const response = await api.delete(`/bookings/${bookingId}/extra-persons/${personId}`);
    return response.data;
  }

  async calculateExtraPersonCharges(bookingId: string) {
    const response = await api.post(`/bookings/${bookingId}/extra-persons/calculate-charges`);
    return response.data;
  }

  // Settlement Management
  async getBookingSettlement(bookingId: string) {
    const response = await api.get(`/bookings/${bookingId}/settlement`);
    return response.data;
  }

  async addSettlementAdjustment(
    bookingId: string,
    adjustmentData: {
      type: string;
      amount: number;
      description: string;
    }
  ) {
    const response = await api.post(`/bookings/${bookingId}/settlement/adjustment`, adjustmentData);
    return response.data;
  }

  async processSettlementPayment(
    bookingId: string,
    paymentData: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  ) {
    const response = await api.post(`/bookings/${bookingId}/settlement/payment`, paymentData);
    return response.data;
  }

  // Pricing Rules Management
  async getPricingRules() {
    const response = await api.get('/extra-person-pricing/rules');
    return response.data;
  }

  async createPricingRule(ruleData: Omit<PricingRule, '_id' | 'createdBy' | 'updatedBy'>) {
    const response = await api.post('/extra-person-pricing/rules', ruleData);
    return response.data;
  }

  async updatePricingRule(ruleId: string, updateData: Partial<PricingRule>) {
    const response = await api.put(`/extra-person-pricing/rules/${ruleId}`, updateData);
    return response.data;
  }

  // Dynamic Pricing
  async calculateDynamicPricing(pricingData: DynamicPricingRequest): Promise<DynamicPricingResponse> {
    const response = await api.post('/extra-person-pricing/calculate', pricingData);
    return response.data;
  }

  async getPricingPreview(previewData: DynamicPricingRequest) {
    const response = await api.post('/extra-person-pricing/preview', previewData);
    return response.data;
  }

  async getAvailablePricingStrategies() {
    const response = await api.get('/extra-person-pricing/strategies');
    return response.data;
  }

  // Settlement Analytics
  async getSettlements(filters?: {
    status?: string;
    escalationLevel?: number;
    dueDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`/settlements?${params.toString()}`);
    return response.data;
  }

  async getOverdueSettlements(gracePeriod = 0) {
    const response = await api.get(`/settlements/overdue?gracePeriod=${gracePeriod}`);
    return response.data;
  }

  async getSettlementAnalytics(dateRange?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

    const response = await api.get(`/settlements/analytics?${params.toString()}`);
    return response.data;
  }

  async createSettlementFromBooking(
    bookingId: string,
    settlementData: {
      dueDate?: string;
      notes?: string;
      assignedTo?: string;
    }
  ) {
    const response = await api.post('/settlements', {
      bookingId,
      ...settlementData
    });
    return response.data;
  }

  async getSettlementDetails(settlementId: string) {
    const response = await api.get(`/settlements/${settlementId}`);
    return response.data;
  }

  async addPaymentToSettlement(
    settlementId: string,
    paymentData: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }
  ) {
    const response = await api.post(`/settlements/${settlementId}/payment`, paymentData);
    return response.data;
  }

  async escalateSettlement(settlementId: string, reason: string) {
    const response = await api.post(`/settlements/${settlementId}/escalate`, { reason });
    return response.data;
  }

  async addCommunicationToSettlement(
    settlementId: string,
    communicationData: {
      type: 'email' | 'sms' | 'phone_call' | 'letter' | 'in_person';
      subject?: string;
      message: string;
      direction?: 'outbound' | 'inbound';
    }
  ) {
    const response = await api.post(`/settlements/${settlementId}/communication`, communicationData);
    return response.data;
  }

  async addDisputeToSettlement(
    settlementId: string,
    disputeData: {
      type: 'charge_dispute' | 'service_complaint' | 'billing_error' | 'damage_claim' | 'other';
      amount?: number;
      description: string;
      raisedBy: 'guest' | 'hotel';
    }
  ) {
    const response = await api.post(`/settlements/${settlementId}/dispute`, disputeData);
    return response.data;
  }

  async resolveDispute(
    settlementId: string,
    disputeId: string,
    resolution: string
  ) {
    const response = await api.post(`/settlements/${settlementId}/dispute/${disputeId}/resolve`, {
      resolution
    });
    return response.data;
  }

  // Stripe Payment Integration
  async createExtraPersonPaymentIntent(
    bookingId: string,
    extraPersonCharges: Array<{
      personId: string;
      amount: number;
      description: string;
    }>,
    currency = 'INR'
  ) {
    const response = await api.post('/payments/extra-person-charges/intent', {
      bookingId,
      extraPersonCharges,
      currency
    });
    return response.data;
  }

  async createSettlementPaymentIntent(
    settlementId: string,
    amount: number,
    currency = 'INR',
    description?: string
  ) {
    const response = await api.post('/payments/settlement/intent', {
      settlementId,
      amount,
      currency,
      description
    });
    return response.data;
  }

  async confirmPayment(paymentIntentId: string) {
    const response = await api.post('/payments/confirm', {
      paymentIntentId
    });
    return response.data;
  }

  // Supplementary Invoice Generation
  async generateSupplementaryInvoice(
    bookingId: string,
    extraPersonCharges: Array<{
      personId: string;
      personName?: string;
      description: string;
      baseCharge: number;
      totalCharge: number;
      addedAt?: string;
    }>
  ) {
    const response = await api.post('/invoices/supplementary/extra-person-charges', {
      bookingId,
      extraPersonCharges
    });
    return response.data;
  }

  async generateSettlementInvoice(
    settlementId: string,
    adjustments: Array<{
      description: string;
      amount: number;
      type: string;
      appliedAt?: string;
    }>
  ) {
    const response = await api.post('/invoices/supplementary/settlement', {
      settlementId,
      adjustments
    });
    return response.data;
  }

  async addExtraChargesToInvoice(
    invoiceId: string,
    extraPersonCharges: Array<{
      personId: string;
      personName?: string;
      description: string;
      baseCharge: number;
      totalCharge: number;
      addedAt?: string;
    }>
  ) {
    const response = await api.put(`/invoices/${invoiceId}/add-extra-charges`, {
      extraPersonCharges
    });
    return response.data;
  }

  // Settlement Notification Management
  async sendSettlementReminder(
    settlementId: string,
    reminderType: 'payment_reminder' | 'final_notice' | 'courtesy_reminder' = 'payment_reminder'
  ) {
    const response = await api.post('/settlement-notifications/send-reminder', {
      settlementId,
      reminderType
    });
    return response.data;
  }

  async sendBulkSettlementReminders(
    settlementIds: string[],
    reminderType: 'payment_reminder' | 'final_notice' | 'courtesy_reminder' = 'payment_reminder'
  ) {
    const response = await api.post('/settlement-notifications/bulk-remind', {
      settlementIds,
      reminderType
    });
    return response.data;
  }

  async getSettlementNotificationStats() {
    const response = await api.get('/settlement-notifications/stats');
    return response.data;
  }

  async processOverdueSettlements() {
    const response = await api.post('/settlement-notifications/process-overdue');
    return response.data;
  }

  async processDueTodaySettlements() {
    const response = await api.post('/settlement-notifications/process-due-today');
    return response.data;
  }

  async processEscalations() {
    const response = await api.post('/settlement-notifications/process-escalations');
    return response.data;
  }

  // Utility methods
  async validateBookingForEditing(bookingId: string) {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response.data.booking;

      // Check if booking can be edited
      const editableStatuses = ['confirmed', 'checked_in', 'checked_out'];
      const canEdit = editableStatuses.includes(booking.status);

      return {
        canEdit,
        reason: canEdit ? null : `Booking status '${booking.status}' does not allow editing`,
        booking
      };
    } catch (error: any) {
      return {
        canEdit: false,
        reason: error.response?.data?.message || 'Booking not found',
        booking: null
      };
    }
  }

  async getBookingEditHistory(bookingId: string) {
    // This would get the modification history from the booking
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response.data.booking;

      return {
        modifications: booking.modifications || [],
        extraPersonHistory: booking.extraPersons?.map((person: any) => ({
          ...person,
          addedAt: person.addedAt,
          addedBy: person.addedBy
        })) || [],
        settlementHistory: booking.settlementTracking?.settlementHistory || []
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get booking edit history');
    }
  }
}

export const bookingEditingService = new BookingEditingService();