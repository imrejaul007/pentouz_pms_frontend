import { api } from './api';
import { withRateLimit } from '../utils/requestThrottle';
import { 
  ApiResponse,
  RealTimeDashboard,
  KPIData,
  OccupancyData,
  RevenueData,
  StaffPerformanceData,
  GuestSatisfactionData,
  OperationsData,
  MarketingData,
  AlertsData,
  SystemHealthData,
  ReportData,
  DashboardFilters
} from '../types/dashboard';

class DashboardService {
  private baseUrl = '/admin-dashboard';

  /**
   * Get available hotels (for testing and hotel selection)
   */
  async getHotels(): Promise<any> {
    try {
      // Since there's no hotels endpoint, we'll provide the seeded hotel
      return {
        status: 'success',
        data: [
          {
            _id: '68c7ab1242a357d06adbb2aa',
            name: 'THE PENTOUZ',
            description: 'A luxury hotel in the heart of the city'
          }
        ]
      };
    } catch (error) {
      console.warn('Hotels endpoint not available, using seeded hotel data');
      return {
        status: 'success',
        data: [
          {
            _id: '68c7ab1242a357d06adbb2aa',
            name: 'THE PENTOUZ',
            description: 'A luxury hotel in the heart of the city'
          }
        ]
      };
    }
  }

  /**
   * Get real-time dashboard overview data
   */
  async getRealTimeData(hotelId?: string): Promise<ApiResponse<RealTimeDashboard>> {
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);

    const response = await api.get(`${this.baseUrl}/real-time?${params.toString()}`);
    return response.data;
  }

  /**
   * Get key performance indicators
   */
  async getKPIs(hotelId?: string, period?: string): Promise<ApiResponse<KPIData>> {
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);
    if (period) params.append('period', period);

    const response = await api.get(`${this.baseUrl}/kpis?${params.toString()}`);
    return response.data;
  }

  /**
   * Get detailed occupancy data with room status
   */
  async getOccupancyData(
    hotelId: string, 
    floor?: string, 
    roomType?: string
  ): Promise<ApiResponse<OccupancyData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (floor) params.append('floor', floor);
    if (roomType) params.append('roomType', roomType);

    const endpoint = `${this.baseUrl}/occupancy`;
    return withRateLimit(endpoint, async () => {
      const response = await api.get(`${endpoint}?${params.toString()}`);
      return response.data;
    });
  }

  /**
   * Get revenue analytics and financial data
   */
  async getRevenueData(
    hotelId: string,
    period?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<RevenueData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const endpoint = `${this.baseUrl}/revenue`;
    return withRateLimit(endpoint, async () => {
      const response = await api.get(`${endpoint}?${params.toString()}`);
      return response.data;
    });
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(
    hotelId: string,
    department?: string,
    staffId?: string
  ): Promise<ApiResponse<StaffPerformanceData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (department) params.append('department', department);
    if (staffId) params.append('staffId', staffId);

    const response = await api.get(`${this.baseUrl}/staff-performance?${params.toString()}`);
    return response.data;
  }

  /**
   * Get guest satisfaction and review analytics
   */
  async getGuestSatisfaction(
    hotelId: string,
    period?: string,
    rating?: number
  ): Promise<ApiResponse<GuestSatisfactionData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (period) params.append('period', period);
    if (rating) params.append('rating', rating.toString());

    const response = await api.get(`${this.baseUrl}/guest-satisfaction?${params.toString()}`);
    return response.data;
  }

  /**
   * Get operations data (housekeeping, maintenance, incidents)
   */
  async getOperationsData(
    hotelId: string,
    category?: string
  ): Promise<ApiResponse<OperationsData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (category) params.append('category', category);

    const response = await api.get(`${this.baseUrl}/operations?${params.toString()}`);
    return response.data;
  }

  /**
   * Get marketing campaign analytics
   */
  async getMarketingData(
    hotelId: string,
    campaignType?: string,
    period?: string
  ): Promise<ApiResponse<MarketingData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (campaignType) params.append('campaignType', campaignType);
    if (period) params.append('period', period);

    const response = await api.get(`${this.baseUrl}/marketing?${params.toString()}`);
    return response.data;
  }

  /**
   * Get system alerts and notifications
   */
  async getAlerts(
    hotelId: string,
    severity?: string,
    category?: string,
    status?: string,
    limit?: number
  ): Promise<ApiResponse<AlertsData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (severity) params.append('severity', severity);
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());

    const response = await api.get(`${this.baseUrl}/alerts?${params.toString()}`);
    return response.data;
  }

  /**
   * Get system health monitoring data
   */
  async getSystemHealth(
    hotelId: string,
    component?: string
  ): Promise<ApiResponse<SystemHealthData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    if (component) params.append('component', component);

    const response = await api.get(`${this.baseUrl}/system-health?${params.toString()}`);
    return response.data;
  }

  /**
   * Generate and get advanced reports
   */
  async getReports(
    hotelId: string,
    reportType: 'financial' | 'operational' | 'guest_analytics' | 'staff_performance' | 'marketing' | 'comprehensive',
    options?: {
      startDate?: string;
      endDate?: string;
      groupBy?: 'day' | 'week' | 'month';
      format?: 'json' | 'csv' | 'excel' | 'pdf';
      includeCharts?: boolean;
      filters?: any;
    }
  ): Promise<ApiResponse<ReportData>> {
    const params = new URLSearchParams();
    params.append('hotelId', hotelId);
    params.append('reportType', reportType);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    // Use the dedicated reports API endpoint
    const response = await api.get(`/reports/revenue?${params.toString()}`);
    
    // Transform the response to match the expected ReportData format
    const reportData: ReportData = {
      reportType: reportType,
      generatedAt: new Date().toISOString(),
      parameters: {
        hotelId,
        startDate: options?.startDate || '',
        endDate: options?.endDate || '',
        groupBy: options?.groupBy || 'day',
        filters: options?.filters || {},
      },
      summary: {
        totalRecords: response.data.data.breakdown?.length || 0,
        dateRange: {
          start: options?.startDate || '',
          end: options?.endDate || '',
        },
        keyMetrics: response.data.data.summary || {},
      },
      data: response.data.data,
      charts: [], // Charts will be generated on frontend
    };

    return {
      status: 'success',
      data: reportData,
    };
  }

  /**
   * Refresh all dashboard data
   */
  async refreshAllData(hotelId?: string): Promise<void> {
    // This could trigger a backend refresh or clear local cache
    // For now, we'll just return a promise that resolves immediately
    return Promise.resolve();
  }

  /**
   * Get dashboard summary for quick overview
   */
  async getDashboardSummary(hotelId?: string): Promise<ApiResponse<{
    kpis: KPIData;
    alerts: { count: number; critical: number };
    occupancy: { rate: number; available: number };
    revenue: { today: number; month: number };
    lastUpdated: string;
  }>> {
    // This could be a lightweight endpoint for header/summary info
    const params = new URLSearchParams();
    if (hotelId) params.append('hotelId', hotelId);

    const response = await api.get(`${this.baseUrl}/summary?${params.toString()}`);
    return response.data;
  }

  /**
   * Export data to various formats
   */
  async exportData(
    endpoint: string,
    format: 'csv' | 'excel' | 'pdf',
    params: Record<string, string> = {}
  ): Promise<Blob> {
    const searchParams = new URLSearchParams(params);
    searchParams.append('format', format);

    const response = await api.get(`${this.baseUrl}/${endpoint}/export?${searchParams.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  }

  /**
   * Get available hotels for admin user
   */
  async getAvailableHotels(): Promise<ApiResponse<{
    _id: string;
    name: string;
    address: {
      city: string;
      country: string;
    };
  }[]>> {
    const response = await api.get('/hotels');
    return response.data;
  }

  /**
   * Update dashboard preferences
   */
  async updateDashboardPreferences(preferences: {
    defaultHotelId?: string;
    refreshInterval?: number;
    defaultDateRange?: string;
    preferredCharts?: string[];
    theme?: 'light' | 'dark';
  }): Promise<ApiResponse<any>> {
    const response = await api.patch('/user/preferences/dashboard', preferences);
    return response.data;
  }

  /**
   * Get dashboard preferences
   */
  async getDashboardPreferences(): Promise<ApiResponse<{
    defaultHotelId?: string;
    refreshInterval?: number;
    defaultDateRange?: string;
    preferredCharts?: string[];
    theme?: 'light' | 'dark';
  }>> {
    const response = await api.get('/user/preferences/dashboard');
    return response.data;
  }

  // New simplified dashboard counts for sidebar
  async getDashboardCounts(): Promise<{
    frontDesk: {
      total: number;
      checkIn: number;
      checkOut: number;
    };
    reservations: {
      total: number;
      confirmed: number;
      pending: number;
      checkedIn: number;
    };
    housekeeping: {
      total: number;
      dirty: number;
      maintenance: number;
      outOfOrder: number;
    };
    guestServices: {
      total: number;
      pending: number;
      inProgress: number;
      vipGuests: number;
      corporate: number;
    };
  }> {
    const response = await api.get('/dashboard/counts');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();