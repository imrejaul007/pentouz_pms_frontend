import { api } from './api';

export interface RevenueMetrics {
  totalRevenue: number;
  revPAR: number;
  adr: number;
  occupancyRate: number;
  rateOptimizationImpact: number;
  competitiveIndex: number;
  demandCaptureRate: number;
  priceElasticity: number;
}

export interface CompetitorRate {
  hotelName: string;
  roomType: string;
  currentRate: number;
  availability: number;
  lastUpdated: Date;
  source: string;
}

export interface RateShopping {
  competitors: CompetitorRate[];
  marketPosition: 'leader' | 'competitive' | 'follower';
  priceGap: number;
  recommendations: Array<{
    action: string;
    impact: string;
    urgency: 'low' | 'medium' | 'high';
  }>;
}

export interface DemandForecast {
  date: string;
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
  predictedOccupancy: number;
  confidence: number;
  factors: string[];
  recommendedRateChange: number;
  potentialRevenue: number;
}

export interface PerformanceMetrics {
  currentVsTarget: number;
  targetRevenue: number;
  marketShare: number;
  rateOptimization: number;
  revenueGrowth: number;
}

export interface DashboardMetricsResponse {
  metrics: RevenueMetrics;
  performanceMetrics: PerformanceMetrics;
  rateShopping: RateShopping;
  demandForecast: DemandForecast[];
  periodInfo: {
    startDate: Date;
    endDate: Date;
    totalBookings: number;
    totalRoomNights: number;
    dayCount: number;
  };
}

export interface RoomTypeRate {
  id: string;
  roomType: string;
  baseRate: number;
  currentRate: number;
  demandMultiplier: number;
  occupancyThreshold: number;
  minRate: number;
  maxRate: number;
  isActive: boolean;
  lastUpdated: Date;
}

class RevenueManagementService {
  private baseURL = '/revenue-management';

  // Get dashboard metrics with real data
  async getDashboardMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardMetricsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`${this.baseURL}/dashboard/metrics?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get pricing rules
  async getPricingRules(): Promise<any[]> {
    const response = await api.get(`${this.baseURL}/pricing-rules`);
    return response.data.data;
  }

  // Create pricing rule
  async createPricingRule(ruleData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/pricing-rules`, ruleData);
    return response.data.data;
  }

  // Update pricing rule
  async updatePricingRule(id: string, ruleData: any): Promise<any> {
    const response = await api.put(`${this.baseURL}/pricing-rules/${id}`, ruleData);
    return response.data.data;
  }

  // Delete pricing rule
  async deletePricingRule(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/pricing-rules/${id}`);
  }

  // Update room type rate
  async updateRoomTypeRate(id: string, rateData: Partial<RoomTypeRate>): Promise<any> {
    const response = await api.put(`${this.baseURL}/room-type-rates/${id}`, rateData);
    return response.data;
  }

  // Bulk update room type rates
  async bulkUpdateRoomTypeRates(updates: Array<{id: string} & Partial<RoomTypeRate>>): Promise<any> {
    const response = await api.post(`${this.baseURL}/room-type-rates/bulk-update`, { updates });
    return response.data;
  }

  // Get demand forecast
  async getDemandForecast(params?: {
    startDate?: string;
    endDate?: string;
    roomTypeId?: string;
  }): Promise<DemandForecast[]> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.roomTypeId) queryParams.append('roomTypeId', params.roomTypeId);

    const response = await api.get(`${this.baseURL}/demand-forecast?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get competitor rates
  async getCompetitorRates(params?: {
    date?: string;
    competitorId?: string;
  }): Promise<CompetitorRate[]> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.competitorId) queryParams.append('competitorId', params.competitorId);

    const response = await api.get(`${this.baseURL}/competitor-rates?${queryParams.toString()}`);
    return response.data.data;
  }

  // Add competitor rate
  async addCompetitorRate(rateData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/competitor-rates`, rateData);
    return response.data.data;
  }

  // Update competitor rates
  async updateCompetitorRates(competitorId: string, rates: any[]): Promise<any> {
    const response = await api.put(`${this.baseURL}/competitor-rates`, {
      competitorId,
      rates
    });
    return response.data.data;
  }

  // Get revenue analytics
  async getRevenueAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    roomTypeId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.roomTypeId) queryParams.append('roomTypeId', params.roomTypeId);
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);

    const response = await api.get(`${this.baseURL}/analytics?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get revenue summary
  async getRevenueSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`${this.baseURL}/analytics/summary?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get optimization recommendations
  async getOptimizationRecommendations(): Promise<any> {
    const response = await api.get(`${this.baseURL}/optimization/recommendations`);
    return response.data.data;
  }

  // Calculate dynamic rate
  async calculateDynamicRate(params: {
    roomTypeId: string;
    checkInDate: string;
    checkOutDate?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('roomTypeId', params.roomTypeId);
    queryParams.append('checkInDate', params.checkInDate);
    if (params.checkOutDate) queryParams.append('checkOutDate', params.checkOutDate);

    const response = await api.get(`${this.baseURL}/dynamic-rate?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get packages
  async getPackages(): Promise<any[]> {
    const response = await api.get(`${this.baseURL}/packages`);
    return response.data.data;
  }

  // Create package
  async createPackage(packageData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/packages`, packageData);
    return response.data.data;
  }

  // Update package
  async updatePackage(id: string, packageData: any): Promise<any> {
    const response = await api.put(`${this.baseURL}/packages/${id}`, packageData);
    return response.data.data;
  }

  // Get corporate rates
  async getCorporateRates(): Promise<any[]> {
    const response = await api.get(`${this.baseURL}/corporate-rates`);
    return response.data.data;
  }

  // Create corporate rate
  async createCorporateRate(rateData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/corporate-rates`, rateData);
    return response.data.data;
  }
}

export default new RevenueManagementService();