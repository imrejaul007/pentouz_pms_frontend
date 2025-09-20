import { api } from './api';

export interface AvailabilityCheck {
  checkInDate: string;
  checkOutDate: string;
  roomType?: string; // Legacy
  roomTypeId?: string; // New OTA-ready
  guestCount?: number;
  hotelId: string;
}

export interface AvailabilityResult {
  available: boolean;
  availableRooms: number;
  rooms: any[];
  message?: string;
}

export interface AvailabilityResultV2 {
  available: boolean;
  availableRooms: number;
  totalRooms: number;
  bookedRooms: number;
  blockedRooms: number;
  roomType: {
    _id: string;
    name: string;
    code: string;
    basePrice: number;
  };
  dateRange: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  inventory: Array<{
    date: string;
    availableRooms: number;
    baseRate: number;
    sellingRate: number;
    restrictions?: {
      stopSellFlag?: boolean;
      closedToArrival?: boolean;
      closedToDeparture?: boolean;
      minimumStay?: number;
      maximumStay?: number;
    };
  }>;
}

export interface AvailabilityWithRates {
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  availableRoomTypes: Array<{
    roomType: string;
    available: boolean;
    availableRooms: number;
    rooms: any[];
    bestRate: {
      baseRate: number;
      finalRate: number;
      discounts: any[];
      taxes: any[];
    };
    allRates: any[];
  }>;
}

export interface CalendarDay {
  date: string;
  [roomTypeCode: string]: {
    totalRooms: number;
    availableRooms: number;
    soldRooms: number;
    blockedRooms: number;
    baseRate: number;
    sellingRate: number;
    stopSellFlag: boolean;
    closedToArrival: boolean;
    closedToDeparture: boolean;
    minimumStay?: number;
    maximumStay?: number;
    occupancyRate: string;
  } | string;
}

export interface OccupancyData {
  occupancyRate: number;
  totalRoomNights: number;
  occupiedRoomNights: number;
  averageDailyRate: number;
  revenuePAR: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface AlternativeRoom {
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  amenities: string[];
  baseRate: number;
  rates: any[];
}

export interface SearchFilters {
  checkInDate: string;
  checkOutDate: string;
  guestCount?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string;
  floor?: number;
  roomType?: string;
  hotelId: string;
}

export interface SearchResults {
  rooms: Array<{
    _id: string;
    roomNumber: string;
    type: string;
    floor: number;
    amenities: string[];
    bestRate: {
      baseRate: number;
      finalRate: number;
      discounts: any[];
      taxes: any[];
    };
  }>;
  totalFound: number;
  checkInDate: string;
  checkOutDate: string;
  filters: SearchFilters;
}

class AvailabilityService {
  /**
   * Check availability using V2 OTA-ready system
   */
  async checkAvailabilityV2(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    roomsRequested: number;
  }): Promise<AvailabilityResultV2> {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: params.checkIn,
        checkOutDate: params.checkOut,
        roomTypeId: params.roomTypeId,
        guestCount: params.roomsRequested.toString(),
        hotelId: params.hotelId
      });

      const response = await api.get(`/availability?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking availability V2:', error);
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  }

  /**
   * Legacy availability checking (backward compatibility)
   */
  async checkAvailability(params: AvailabilityCheck): Promise<AvailabilityResult> {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        hotelId: params.hotelId
      });

      if (params.roomType) queryParams.append('roomType', params.roomType);
      if (params.roomTypeId) queryParams.append('roomTypeId', params.roomTypeId);
      if (params.guestCount) queryParams.append('guestCount', params.guestCount.toString());

      const response = await api.get(`/availability?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking availability:', error);
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  }

  /**
   * Get availability calendar for a month
   */
  async getAvailabilityCalendar(params: {
    year: number;
    month: number;
    roomType?: string;
    hotelId: string;
  }): Promise<{ [date: string]: CalendarDay }> {
    try {
      const queryParams = new URLSearchParams({
        year: params.year.toString(),
        month: params.month.toString(),
        hotelId: params.hotelId
      });

      if (params.roomType) queryParams.append('roomType', params.roomType);

      const response = await api.get(`/availability/calendar?${queryParams.toString()}`);
      return response.data.data.calendar;
    } catch (error: any) {
      console.error('Error fetching availability calendar:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch availability calendar');
    }
  }

  /**
   * Get room status for specific date range
   */
  async getRoomStatus(params: {
    roomId: string;
    startDate: string;
    endDate: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        roomId: params.roomId,
        startDate: params.startDate,
        endDate: params.endDate
      });

      const response = await api.get(`/availability/room-status?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching room status:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch room status');
    }
  }

  /**
   * Block rooms for maintenance or other reasons
   */
  async blockRooms(params: {
    roomIds: string[];
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<any> {
    try {
      const response = await api.post('/availability/block-rooms', params);
      return response.data.data;
    } catch (error: any) {
      console.error('Error blocking rooms:', error);
      throw new Error(error.response?.data?.message || 'Failed to block rooms');
    }
  }

  /**
   * Unblock rooms
   */
  async unblockRooms(params: {
    roomIds: string[];
    startDate: string;
    endDate: string;
  }): Promise<any> {
    try {
      const response = await api.post('/availability/unblock-rooms', params);
      return response.data.data;
    } catch (error: any) {
      console.error('Error unblocking rooms:', error);
      throw new Error(error.response?.data?.message || 'Failed to unblock rooms');
    }
  }

  /**
   * Calculate occupancy rate
   */
  async getOccupancyRate(params: {
    startDate: string;
    endDate: string;
    hotelId: string;
  }): Promise<OccupancyData> {
    try {
      const queryParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        hotelId: params.hotelId
      });

      const response = await api.get(`/availability/occupancy?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching occupancy rate:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch occupancy rate');
    }
  }

  /**
   * Find alternative rooms
   */
  async findAlternatives(params: {
    checkIn: string;
    checkOut: string;
    roomType: string;
    guestCount?: number;
  }): Promise<AlternativeRoom[]> {
    try {
      const queryParams = new URLSearchParams({
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        roomType: params.roomType
      });

      if (params.guestCount) queryParams.append('guestCount', params.guestCount.toString());

      const response = await api.get(`/availability/alternatives?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error finding alternative rooms:', error);
      throw new Error(error.response?.data?.message || 'Failed to find alternative rooms');
    }
  }

  /**
   * Check for overbooking
   */
  async checkOverbooking(params: {
    date: string;
    roomType?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams({
        date: params.date
      });

      if (params.roomType) queryParams.append('roomType', params.roomType);

      const response = await api.get(`/availability/overbooking?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error checking overbooking:', error);
      throw new Error(error.response?.data?.message || 'Failed to check overbooking');
    }
  }

  /**
   * Get comprehensive availability with rates
   */
  async getAvailabilityWithRates(params: {
    checkInDate: string;
    checkOutDate: string;
    guestCount?: number;
    hotelId: string;
  }): Promise<AvailabilityWithRates> {
    try {
      const queryParams = new URLSearchParams({
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        hotelId: params.hotelId
      });

      if (params.guestCount) queryParams.append('guestCount', params.guestCount.toString());

      const response = await api.get(`/availability/with-rates?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching availability with rates:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch availability with rates');
    }
  }

  /**
   * Search rooms with advanced filters
   */
  async searchRooms(filters: SearchFilters): Promise<SearchResults> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/availability/search?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching rooms:', error);
      throw new Error(error.response?.data?.message || 'Failed to search rooms');
    }
  }

  /**
   * Utility method to resolve legacy room type to room type ID
   */
  async resolveLegacyRoomType(hotelId: string, legacyType: string): Promise<string | null> {
    try {
      // Use the room type service to resolve legacy type
      const response = await api.get(`/room-types/legacy/${hotelId}/${legacyType}`);
      return response.data.data._id;
    } catch (error) {
      console.warn(`Could not resolve legacy room type ${legacyType}:`, error);
      return null;
    }
  }

  /**
   * Smart availability checking that handles both legacy and V2
   */
  async checkAvailabilitySmart(params: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
    roomType?: string; // Legacy
    roomTypeId?: string; // New
    guestCount?: number;
  }): Promise<AvailabilityResult | AvailabilityResultV2> {
    try {
      let finalRoomTypeId = params.roomTypeId;

      // If we have legacy roomType but no roomTypeId, try to resolve it
      if (!finalRoomTypeId && params.roomType) {
        finalRoomTypeId = await this.resolveLegacyRoomType(params.hotelId, params.roomType);
      }

      // Use V2 if we have roomTypeId
      if (finalRoomTypeId) {
        return await this.checkAvailabilityV2({
          hotelId: params.hotelId,
          roomTypeId: finalRoomTypeId,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          roomsRequested: params.guestCount || 1
        });
      } else {
        // Fallback to legacy system
        return await this.checkAvailability({
          hotelId: params.hotelId,
          checkInDate: params.checkIn,
          checkOutDate: params.checkOut,
          roomType: params.roomType,
          guestCount: params.guestCount
        });
      }
    } catch (error: any) {
      console.error('Error in smart availability check:', error);
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  }

  /**
   * Get availability summary for dashboard
   */
  async getAvailabilitySummary(params: {
    hotelId: string;
    startDate: string;
    endDate: string;
    roomTypeId?: string;
  }): Promise<{
    totalRoomNights: number;
    availableRoomNights: number;
    bookedRoomNights: number;
    blockedRoomNights: number;
    occupancyRate: number;
    averageRate: number;
    revenue: number;
  }> {
    try {
      const queryParams = new URLSearchParams({
        hotelId: params.hotelId,
        startDate: params.startDate,
        endDate: params.endDate
      });

      if (params.roomTypeId) queryParams.append('roomTypeId', params.roomTypeId);

      const response = await api.get(`/availability/summary?${queryParams.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching availability summary:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch availability summary');
    }
  }
}

export const availabilityService = new AvailabilityService();
export default availabilityService;