import { api } from './api';

export interface ProfitabilityMetrics {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenuePerRoom: number;
  costPerRoom: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenuePAR: number;
  previousPeriodComparison: {
    revenue: number;
    profit: number;
    occupancy: number;
  };
}

export interface RoomTypeProfitability {
  roomType: string;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  occupancyRate: number;
  averageRate: number;
  roomCount: number;
}

export interface ForecastData {
  date: string;
  predictedRevenue: number;
  predictedOccupancy: number;
  confidence: number;
  factors: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  potential?: string;
  savings?: string;
  type: string;
}

export interface SmartRecommendations {
  revenueOpportunities: Recommendation[];
  costOptimizations: Recommendation[];
}

export interface ProfitabilityData extends ProfitabilityMetrics {
  roomTypeProfitability: RoomTypeProfitability[];
  forecast: ForecastData[];
  recommendations: SmartRecommendations;
}

class AnalyticsService {
  async getProfitabilityMetrics(period: string = '30d'): Promise<ProfitabilityData> {
    try {
      const url = `/analytics/profitability-metrics?period=${period}`;
      console.log('🔍 Analytics API call:', url);

      const response = await api.get(url);

      console.log('📈 Analytics API response:', {
        status: response.status,
        hasData: !!response.data?.data,
        averageDailyRate: response.data?.data?.averageDailyRate,
        revenuePAR: response.data?.data?.revenuePAR,
        totalRevenue: response.data?.data?.totalRevenue
      });

      return response.data.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch profitability metrics:', error);
      console.log('🔄 Using fallback analytics data');
      // Return fallback data if API fails
      return this.getFallbackProfitabilityData();
    }
  }

  async getRoomTypeAnalytics(period: string = '30d'): Promise<RoomTypeProfitability[]> {
    try {
      const response = await api.get(`/analytics/room-type-profitability?period=${period}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch room type analytics:', error);
      return [];
    }
  }

  private getFallbackProfitabilityData(): ProfitabilityData {
    return {
      totalRevenue: 0,
      totalCosts: 0,
      grossProfit: 0,
      netProfit: 0,
      profitMargin: 0,
      revenuePerRoom: 0,
      costPerRoom: 0,
      occupancyRate: 0,
      averageDailyRate: 0,
      revenuePAR: 0,
      previousPeriodComparison: {
        revenue: 0,
        profit: 0,
        occupancy: 0
      },
      roomTypeProfitability: [],
      forecast: [],
      recommendations: {
        revenueOpportunities: [],
        costOptimizations: []
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;