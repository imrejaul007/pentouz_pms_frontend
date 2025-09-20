import { api } from './api';

export interface RoomTypeAllotment {
  _id: string;
  hotelId: string;
  roomTypeId: {
    _id: string;
    name: string;
    code: string;
  };
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  channels: Array<{
    channelId: string;
    channelName: string;
    isActive: boolean;
    priority: number;
    commission: number;
    markup: number;
    restrictions: {
      minimumStay: number;
      maximumStay: number;
      closedToArrival: boolean;
      closedToDeparture: boolean;
      stopSell: boolean;
    };
  }>;
  defaultSettings: {
    totalInventory: number;
    defaultAllocationMethod: 'percentage' | 'fixed' | 'dynamic';
    overbookingAllowed: boolean;
    overbookingLimit: number;
    releaseWindow: number;
    autoRelease: boolean;
  };
  dailyAllotments: Array<{
    date: string;
    totalInventory: number;
    channelAllotments: Array<{
      channelId: string;
      allocated: number;
      sold: number;
      available: number;
      blocked: number;
      overbooking: number;
      rate: number;
      lastUpdated: string;
    }>;
    freeStock: number;
    totalSold: number;
    occupancyRate: number;
    notes?: string;
    isHoliday: boolean;
    isBlackout: boolean;
  }>;
  performanceMetrics?: Array<{
    period: {
      startDate: string;
      endDate: string;
    };
    channelMetrics: Array<{
      channelId: string;
      totalAllocated: number;
      totalSold: number;
      totalRevenue: number;
      averageRate: number;
      conversionRate: number;
      utilizationRate: number;
      leadTime: number;
      cancellationRate: number;
      noShowRate: number;
      revenuePerAvailableRoom: number;
    }>;
    overallMetrics: {
      totalInventory: number;
      totalSold: number;
      totalRevenue: number;
      averageOccupancyRate: number;
      revenuePerAvailableRoom: number;
      averageDailyRate: number;
    };
  }>;
  analytics?: {
    lastCalculated: string;
    nextCalculation: string;
    calculationFrequency: 'hourly' | 'daily' | 'weekly';
    alerts: Array<{
      type: 'low_occupancy' | 'high_occupancy' | 'channel_underperforming' | 'inventory_imbalance' | 'overbooking_risk';
      threshold: number;
      isActive: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    }>;
    recommendations: Array<{
      type: 'increase_allocation' | 'decrease_allocation' | 'adjust_rates' | 'modify_restrictions' | 'update_rules';
      channelId: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      impact: string;
      confidence: number;
      createdAt: string;
    }>;
  };
  overallOccupancyRate?: number;
  createdBy: string;
  updatedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AllotmentFilter {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'suspended';
  roomTypeId?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAllotmentData {
  name: string;
  description?: string;
  roomTypeId: string;
  hotelId: string;
  channels?: Array<{
    channelId: string;
    channelName: string;
    isActive: boolean;
    priority: number;
    commission: number;
    markup: number;
    restrictions?: {
      minimumStay: number;
      maximumStay: number;
      closedToArrival?: boolean;
      closedToDeparture?: boolean;
      stopSell?: boolean;
    };
  }>;
  defaultSettings: {
    totalInventory: number;
    defaultAllocationMethod?: 'percentage' | 'fixed' | 'dynamic';
    overbookingAllowed?: boolean;
    overbookingLimit?: number;
    releaseWindow?: number;
    autoRelease?: boolean;
  };
}

export interface UpdateAllotmentData extends Partial<CreateAllotmentData> {
  id: string;
}

export interface DashboardData {
  totalAllotments: number;
  totalRoomTypes: number;
  totalChannels: number;
  averageOccupancyRate: number;
  totalRevenue: number;
  topPerformingChannel?: {
    channelId: string;
    channelName: string;
    totalRevenue: number;
    totalSold: number;
    utilizationRate: number;
  };
  lowUtilizationChannels: Array<{
    channelId: string;
    channelName: string;
    utilizationRate: number;
    totalAllocated: number;
  }>;
  recentRecommendations: Array<{
    type: string;
    channelId: string;
    priority: string;
    impact: string;
    confidence: number;
    createdAt: string;
  }>;
}

export interface AllotmentCalendarData {
  date: string;
  roomTypeId: string;
  roomTypeName: string;
  totalRooms: number;
  availableRooms: number;
  occupancyRate: number;
  status: 'available' | 'blocked' | 'sold_out';
}

export interface ChannelAllocation {
  channelId: string;
  date: string;
  allocated?: number;
  sold?: number;
  blocked?: number;
}

export interface BookingData {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  channelId: string;
  rooms?: number;
}

export interface ReleaseData extends BookingData {
  rooms: number;
}

class AllotmentService {
  async getAllotments(params: AllotmentFilter = {}): Promise<{
    allotments: RoomTypeAllotment[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }> {
    console.log('🔍 [AllotmentService] Fetching allotments with params:', params);
    const response = await api.get('/allotments', { params });
    console.log('✅ [AllotmentService] Allotments fetched successfully:', response.data);
    return response.data.data;
  }

  async getAllotment(id: string): Promise<RoomTypeAllotment> {
    try {
      console.log('🔍 [AllotmentService] Fetching allotment:', id);
      const response = await api.get(`/allotments/${id}`);
      console.log('✅ [AllotmentService] Allotment fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error fetching allotment:', error);
      throw error;
    }
  }

  async createAllotment(data: CreateAllotmentData): Promise<RoomTypeAllotment> {
    try {
      console.log('🔨 [AllotmentService] Creating allotment:', data);
      const response = await api.post('/allotments', data);
      console.log('✅ [AllotmentService] Allotment created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error creating allotment:', error);
      throw error;
    }
  }

  async updateAllotment(id: string, data: UpdateAllotmentData): Promise<RoomTypeAllotment> {
    try {
      console.log('🔧 [AllotmentService] Updating allotment:', id, data);
      const response = await api.put(`/allotments/${id}`, data);
      console.log('✅ [AllotmentService] Allotment updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error updating allotment:', error);
      throw error;
    }
  }

  async deleteAllotment(id: string): Promise<void> {
    try {
      console.log('🗑️ [AllotmentService] Deleting allotment:', id);
      await api.delete(`/allotments/${id}`);
      console.log('✅ [AllotmentService] Allotment deleted successfully');
    } catch (error) {
      console.error('❌ [AllotmentService] Error deleting allotment:', error);
      throw error;
    }
  }

  async getDashboard(params?: { startDate?: string; endDate?: string; roomTypeId?: string }): Promise<DashboardData> {
    console.log('📊 [AllotmentService] Fetching dashboard data with params:', params);
    const response = await api.get('/allotments/dashboard', { params });
    console.log('✅ [AllotmentService] Dashboard data fetched successfully:', response.data);
    return response.data;
  }

  async bulkUpdateAllotments(updates: Array<{
    id: string;
    data: UpdateAllotmentData;
  }>): Promise<RoomTypeAllotment[]> {
    try {
      console.log('🔧 [AllotmentService] Bulk updating allotments:', updates);
      const response = await api.put('/allotments/bulk-update', { updates });
      console.log('✅ [AllotmentService] Allotments bulk updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error bulk updating allotments:', error);
      throw error;
    }
  }

  async getCalendarData(params: {
    roomTypeId?: string;
    startDate: string;
    endDate: string;
  }): Promise<AllotmentCalendarData[]> {
    try {
      console.log('📅 [AllotmentService] Fetching calendar data with params:', params);
      const response = await api.get('/allotments/calendar', { params });
      console.log('✅ [AllotmentService] Calendar data fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error fetching calendar data:', error);
      throw error;
    }
  }

  async updateChannelAllocation(allotmentId: string, data: ChannelAllocation): Promise<void> {
    try {
      console.log('🔧 [AllotmentService] Updating channel allocation:', allotmentId, data);
      await api.post(`/allotments/${allotmentId}/update-allocation`, data);
      console.log('✅ [AllotmentService] Channel allocation updated successfully');
    } catch (error) {
      console.error('❌ [AllotmentService] Error updating channel allocation:', error);
      throw error;
    }
  }

  async applyAllocationRule(allotmentId: string, ruleId: string, dateRange: {
    startDate: string;
    endDate: string;
  }): Promise<void> {
    try {
      console.log('🎯 [AllotmentService] Applying allocation rule:', allotmentId, ruleId, dateRange);
      await api.post(`/allotments/${allotmentId}/apply-rule`, {
        ruleId,
        ...dateRange
      });
      console.log('✅ [AllotmentService] Allocation rule applied successfully');
    } catch (error) {
      console.error('❌ [AllotmentService] Error applying allocation rule:', error);
      throw error;
    }
  }

  async optimizeAllocations(allotmentId: string): Promise<any> {
    try {
      console.log('🚀 [AllotmentService] Optimizing allocations for:', allotmentId);
      const response = await api.post(`/allotments/${allotmentId}/optimize`);
      console.log('✅ [AllotmentService] Allocations optimized successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error optimizing allocations:', error);
      throw error;
    }
  }

  async processBooking(data: BookingData): Promise<void> {
    try {
      console.log('📝 [AllotmentService] Processing booking:', data);
      await api.post('/allotments/bookings/process', data);
      console.log('✅ [AllotmentService] Booking processed successfully');
    } catch (error) {
      console.error('❌ [AllotmentService] Error processing booking:', error);
      throw error;
    }
  }

  async releaseRooms(data: ReleaseData): Promise<void> {
    try {
      console.log('🔄 [AllotmentService] Releasing rooms:', data);
      await api.post('/allotments/bookings/release', data);
      console.log('✅ [AllotmentService] Rooms released successfully');
    } catch (error) {
      console.error('❌ [AllotmentService] Error releasing rooms:', error);
      throw error;
    }
  }

  async getAvailability(params: {
    roomTypeId: string;
    startDate: string;
    endDate: string;
    channelId?: string;
  }): Promise<any> {
    try {
      console.log('🔍 [AllotmentService] Checking availability:', params);
      const response = await api.get('/allotments/availability', { params });
      console.log('✅ [AllotmentService] Availability checked successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error checking availability:', error);
      throw error;
    }
  }

  async getAnalytics(allotmentId: string, params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any> {
    try {
      console.log('📈 [AllotmentService] Fetching analytics for:', allotmentId, params);
      const response = await api.get(`/allotments/${allotmentId}/analytics`, { params });
      console.log('✅ [AllotmentService] Analytics fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error fetching analytics:', error);
      throw error;
    }
  }

  async getChannelPerformance(allotmentId: string): Promise<any> {
    try {
      console.log('📊 [AllotmentService] Fetching channel performance for:', allotmentId);
      const response = await api.get(`/allotments/${allotmentId}/channel-performance`);
      console.log('✅ [AllotmentService] Channel performance fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error fetching channel performance:', error);
      throw error;
    }
  }

  async getRecommendations(allotmentId: string): Promise<any> {
    try {
      console.log('💡 [AllotmentService] Fetching recommendations for:', allotmentId);
      const response = await api.get(`/allotments/${allotmentId}/recommendations`);
      console.log('✅ [AllotmentService] Recommendations fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error fetching recommendations:', error);
      throw error;
    }
  }

  async exportAllotment(allotmentId: string, params?: {
    format?: 'json' | 'csv';
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      console.log('📤 [AllotmentService] Exporting allotment:', allotmentId, params);
      const response = await api.get(`/allotments/${allotmentId}/export`, { params });
      console.log('✅ [AllotmentService] Allotment exported successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [AllotmentService] Error exporting allotment:', error);
      throw error;
    }
  }
}

export default new AllotmentService();