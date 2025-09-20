import { api } from './api';

export interface Room {
  _id: string;
  hotelId: string;
  roomNumber: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  baseRate: number;
  currentRate: number;
  status: 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order' | 'reserved';
  computedStatus?: 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order' | 'reserved';
  floor: number;
  capacity: number;
  amenities: string[];
  images: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  currentBooking?: {
    bookingId: string;
    checkIn: string;
    checkOut: string;
    status: string;
  };
}

export interface RoomMetrics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  outOfOrderRooms: number;
  dirtyRooms: number;
  occupancyRate: number;
  availabilityRate: number;
}

export interface RoomsResponse {
  rooms: Room[];
  metrics: RoomMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class RoomsService {
  private baseUrl = '/rooms';

  async getRooms(params?: {
    hotelId?: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    floor?: number;
  }): Promise<RoomsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`${this.baseUrl}?${searchParams.toString()}`);
    return response.data.data; // The API returns { status: 'success', data: {...} }
  }

  async getAdminRooms(params?: {
    hotelId?: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    floor?: number;
  }): Promise<RoomsResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`${this.baseUrl}?${searchParams.toString()}`, {
      headers: {
        'X-Admin-Request': 'true'
      }
    });

    return response.data.data; // The API returns { status: 'success', data: {...} }
  }

  async getRoomById(id: string): Promise<Room> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const response = await api.patch(`${this.baseUrl}/${id}`, updates);
    return response.data.data;
  }

  async updateRoomStatus(id: string, status: Room['status']): Promise<Room> {
    const response = await api.patch(`${this.baseUrl}/${id}`, { status });
    return response.data.data;
  }

  async bulkUpdateStatus(roomIds: string[], status: Room['status']): Promise<Room[]> {
    // Since there's no bulk endpoint, update rooms one by one
    const promises = roomIds.map(id => this.updateRoomStatus(id, status));
    return Promise.all(promises);
  }

  async getRoomMetrics(hotelId: string): Promise<RoomMetrics> {
    const response = await api.get(`${this.baseUrl}/metrics?hotelId=${hotelId}`);
    return response.data.data; // The API returns { status: 'success', data: {...} }
  }
}

export const roomsService = new RoomsService();