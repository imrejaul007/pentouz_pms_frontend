import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Season {
  _id?: string;
  seasonId?: string;
  name: string;
  description?: string;
  type: 'peak' | 'high' | 'shoulder' | 'low' | 'off' | 'custom';
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'yearly' | 'monthly' | 'weekly';
    interval: number;
  };
  rateAdjustments: Array<{
    roomType: string;
    adjustmentType: 'percentage' | 'fixed' | 'absolute';
    adjustmentValue: number;
    currency?: string;
  }>;
  applicableRatePlans?: string[];
  restrictions?: {
    minLength?: number;
    maxLength?: number;
    closedToArrival?: string[];
    closedToDeparture?: string[];
    dayOfWeekRestrictions?: {
      [key: string]: boolean;
    };
  };
  bookingWindow?: {
    minAdvanceBooking?: number;
    maxAdvanceBooking?: number;
  };
  priority?: number;
  tags?: string[];
  color?: string;
  isActive?: boolean;
}

export interface SpecialPeriod {
  _id?: string;
  periodId?: string;
  name: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'yearly' | 'monthly' | 'weekly';
    interval: number;
    endRecurrence?: string;
  };
  rateOverrides: Array<{
    roomType: string;
    overrideType: 'percentage' | 'fixed' | 'absolute' | 'block';
    overrideValue: number;
    currency?: string;
  }>;
  restrictions?: {
    bookingRestriction?: string;
    minLength?: number;
    maxLength?: number;
    mustStayThrough?: boolean;
  };
  applicableRatePlans?: string[];
  eventDetails?: {
    eventName?: string;
    venue?: string;
    organizer?: string;
    expectedAttendees?: number;
    impactRadius?: number;
  };
  demand?: {
    level?: string;
    expectedOccupancy?: number;
    competitorImpact?: string;
  };
  priority?: number;
  tags?: string[];
  color?: string;
  alerts?: {
    emailNotification?: boolean;
    daysBeforeAlert?: number;
    recipients?: string[];
  };
  isActive?: boolean;
}

export interface SeasonalAdjustment {
  totalAdjustment: number;
  appliedAdjustments: Array<{
    type: 'season' | 'special_period';
    name: string;
    adjustmentType?: string;
    overrideType?: string;
    adjustmentValue?: number;
    overrideValue?: number;
    calculatedAmount: number;
    priority: number;
    periodType?: string;
  }>;
  hasSeasonalPricing: boolean;
  hasSpecialPeriodPricing: boolean;
  date: string;
}

export interface BookingAvailability {
  allowed: boolean;
  reason?: string;
  blockingPeriod?: {
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    restriction: string;
  };
  warning?: string;
}

export interface PricingCalendarEntry {
  date: string;
  adjustment: SeasonalAdjustment;
  bookingAllowed: boolean;
  restrictions?: any;
}

export interface SeasonalAnalytics {
  totalSeasons: number;
  totalSpecialPeriods: number;
  seasonsByType: { [key: string]: number };
  specialPeriodsByType: { [key: string]: number };
  averageAdjustment: number;
  peakDates: any[];
  blackoutDates: Array<{
    name: string;
    startDate: string;
    endDate: string;
  }>;
}

class SeasonalPricingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  // Season Management
  async createSeason(seasonData: Season) {
    const response = await axios.post(
      `${API_BASE_URL}/seasonal-pricing/seasons`,
      seasonData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getSeasons(params?: { year?: number; type?: string; isActive?: boolean }) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/seasons`,
      {
        ...this.getAuthHeaders(),
        params
      }
    );
    return response.data;
  }

  async getSeasonById(id: string) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/seasons/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async updateSeason(id: string, updateData: Partial<Season>) {
    const response = await axios.put(
      `${API_BASE_URL}/seasonal-pricing/seasons/${id}`,
      updateData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async deleteSeason(id: string) {
    const response = await axios.delete(
      `${API_BASE_URL}/seasonal-pricing/seasons/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  // Special Period Management
  async createSpecialPeriod(periodData: SpecialPeriod) {
    const response = await axios.post(
      `${API_BASE_URL}/seasonal-pricing/special-periods`,
      periodData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async getSpecialPeriods(params?: { year?: number; type?: string; isActive?: boolean }) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/special-periods`,
      {
        ...this.getAuthHeaders(),
        params
      }
    );
    return response.data;
  }

  async getSpecialPeriodById(id: string) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/special-periods/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async updateSpecialPeriod(id: string, updateData: Partial<SpecialPeriod>) {
    const response = await axios.put(
      `${API_BASE_URL}/seasonal-pricing/special-periods/${id}`,
      updateData,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async deleteSpecialPeriod(id: string) {
    const response = await axios.delete(
      `${API_BASE_URL}/seasonal-pricing/special-periods/${id}`,
      this.getAuthHeaders()
    );
    return response.data;
  }

  async bulkCreateSpecialPeriods(periods: SpecialPeriod[]) {
    const response = await axios.post(
      `${API_BASE_URL}/seasonal-pricing/special-periods/bulk`,
      { periods },
      this.getAuthHeaders()
    );
    return response.data;
  }

  // Pricing Calculations
  async getSeasonalAdjustment(roomType: string, date: string, ratePlanId?: string): Promise<{ data: SeasonalAdjustment }> {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/adjustment`,
      {
        ...this.getAuthHeaders(),
        params: { roomType, date, ratePlanId }
      }
    );
    return response.data;
  }

  async checkBookingAvailability(arrivalDate: string, departureDate: string, roomType: string): Promise<{ data: BookingAvailability }> {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/availability`,
      {
        ...this.getAuthHeaders(),
        params: { arrivalDate, departureDate, roomType }
      }
    );
    return response.data;
  }

  async getPricingCalendar(startDate: string, endDate: string, roomType: string = 'all'): Promise<{ data: PricingCalendarEntry[] }> {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/calendar`,
      {
        ...this.getAuthHeaders(),
        params: { startDate, endDate, roomType }
      }
    );
    return response.data;
  }

  // Date Range Queries
  async getSeasonsByDateRange(startDate: string, endDate: string, includeInactive: boolean = false) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/seasons/date-range`,
      {
        ...this.getAuthHeaders(),
        params: { startDate, endDate, includeInactive }
      }
    );
    return response.data;
  }

  async getSpecialPeriodsByDateRange(startDate: string, endDate: string, includeInactive: boolean = false) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/special-periods/date-range`,
      {
        ...this.getAuthHeaders(),
        params: { startDate, endDate, includeInactive }
      }
    );
    return response.data;
  }

  // Analytics
  async getSeasonalAnalytics(startDate: string, endDate: string): Promise<{ data: SeasonalAnalytics }> {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/analytics`,
      {
        ...this.getAuthHeaders(),
        params: { startDate, endDate }
      }
    );
    return response.data;
  }

  // Alerts
  async getUpcomingAlerts(days: number = 30) {
    const response = await axios.get(
      `${API_BASE_URL}/seasonal-pricing/alerts/upcoming`,
      {
        ...this.getAuthHeaders(),
        params: { days }
      }
    );
    return response.data;
  }

  // Utility Methods
  getSeasonTypeColor(type: string): string {
    const colors = {
      peak: '#DC2626',
      high: '#EA580C',
      shoulder: '#D97706',
      low: '#16A34A',
      off: '#059669',
      custom: '#6366F1'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }

  getPeriodTypeColor(type: string): string {
    const colors = {
      holiday: '#DC2626',
      festival: '#7C3AED',
      event: '#2563EB',
      conference: '#059669',
      wedding_season: '#EC4899',
      sports_event: '#EAB308',
      blackout: '#374151',
      maintenance: '#6B7280',
      custom: '#6366F1'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDateRange(startDate: string, endDate: string): { formatted: string; duration: number } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      formatted: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      duration
    };
  }

  isDateInRange(date: string, startDate: string, endDate: string): boolean {
    const checkDate = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return checkDate >= start && checkDate <= end;
  }

  calculateDaysUntilStart(startDate: string): number {
    const now = new Date();
    const start = new Date(startDate);
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  isCurrentlyActive(startDate: string, endDate: string): boolean {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  }
}

export const seasonalPricingService = new SeasonalPricingService();