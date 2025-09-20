import { ApiResponse } from '../types/api';
import { api } from './api';

export interface RoomInventoryItem {
  _id: string;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  quantity: number;
  status: 'available' | 'missing' | 'damaged' | 'needs_cleaning';
  lastReplaced?: string;
  lastCleaned?: string;
}

export interface TemplateInventoryItem {
  _id?: string;
  name: string;
  category: string;
  description?: string;
  unitPrice?: number;
  standardQuantity?: number;
  checkInstructions?: string;
  expectedCondition?: string;
}

export interface InventoryTemplate {
  _id?: string;
  roomType: 'single' | 'double' | 'deluxe' | 'suite';
  fixedInventory: TemplateInventoryItem[];
  dailyInventory: TemplateInventoryItem[];
  estimatedCheckDuration?: number;
  isActive?: boolean;
  createdBy?: string;
  lastUpdatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyCheckData {
  _id: string;
  roomNumber: string;
  type: string;
  floor: string;
  checkStatus: 'pending' | 'completed' | 'overdue';
  lastChecked: string | null;
  fixedInventory: RoomInventoryItem[];
  dailyInventory: RoomInventoryItem[];
  assignedStaff?: string;
  estimatedDuration: number;
}

export interface DailyCheckResult {
  roomId: string;
  checkedBy: string;
  checkedAt: string;
  items: Array<{
    itemId: string;
    action: 'replace' | 'add' | 'laundry' | 'reuse';
    quantity: number;
    notes?: string;
  }>;
  totalCost: number;
  status: 'completed';
}

interface DailyCheckFilters {
  filter?: 'all' | 'pending' | 'completed' | 'overdue';
  floor?: string;
  type?: string;
  assignedStaff?: string;
  page?: number;
  limit?: number;
}

class DailyRoutineCheckService {
  private baseURL = '/daily-routine-check';

  /**
   * Get rooms that need daily routine check
   */
  async getRoomsForDailyCheck(filters: DailyCheckFilters = {}): Promise<ApiResponse<{ rooms: DailyCheckData[] }>> {
    const queryParams = new URLSearchParams();
    
    if (filters.filter) queryParams.append('filter', filters.filter);
    if (filters.floor) queryParams.append('floor', filters.floor);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.assignedStaff) queryParams.append('assignedStaff', filters.assignedStaff);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());

    const response = await api.get(`${this.baseURL}/rooms?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get detailed inventory for a specific room
   */
  async getRoomInventory(roomId: string): Promise<ApiResponse<DailyCheckData>> {
    const response = await api.get(`${this.baseURL}/rooms/${roomId}/inventory`);
    return response.data;
  }

  /**
   * Complete daily routine check for a room
   */
  async completeDailyCheck(roomId: string, checkData: { cart: any[] }): Promise<ApiResponse<DailyCheckResult>> {
    const response = await api.post(`${this.baseURL}/rooms/${roomId}/complete`, checkData);
    return response.data;
  }

  /**
   * Get daily check history for a room
   */
  async getRoomCheckHistory(roomId: string, page: number = 1, limit: number = 10): Promise<ApiResponse<{ checks: DailyCheckResult[] }>> {
    const response = await api.get(`${this.baseURL}/rooms/${roomId}/history?page=${page}&limit=${limit}`);
    return response.data;
  }

  /**
   * Get daily check summary for staff dashboard
   */
  async getDailyCheckSummary(): Promise<ApiResponse<{
    totalRooms: number;
    pendingChecks: number;
    completedToday: number;
    overdueChecks: number;
    estimatedTimeRemaining: number;
  }>> {
    const response = await api.get(`${this.baseURL}/summary`);
    return response.data;
  }

  /**
   * Assign daily checks to staff members
   */
  async assignDailyChecks(assignments: Array<{ roomId: string; staffId: string }>): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post(`${this.baseURL}/assign`, { assignments });
    return response.data;
  }

  /**
   * Get staff member's assigned rooms for today
   */
  async getMyAssignedRooms(): Promise<ApiResponse<{ rooms: DailyCheckData[] }>> {
    const response = await api.get(`${this.baseURL}/my-assignments`);
    return response.data;
  }

  /**
   * Mark room as checked without detailed inventory
   */
  async markRoomAsChecked(roomId: string, notes?: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.post(`${this.baseURL}/rooms/${roomId}/mark-checked`, { notes });
    return response.data;
  }

  /**
   * Get inventory templates for different room types
   */
  async getInventoryTemplates(): Promise<ApiResponse<{
    templates: InventoryTemplate[];
  }>> {
    const response = await api.get(`${this.baseURL}/templates`);
    return response.data;
  }

  /**
   * Create new inventory template for a room type
   */
  async createInventoryTemplate(template: Omit<InventoryTemplate, '_id' | 'isActive' | 'createdBy' | 'lastUpdatedBy' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ message: string; template: InventoryTemplate }>> {
    const response = await api.post(`${this.baseURL}/templates`, template);
    return response.data;
  }

  /**
   * Update inventory template for a room type
   */
  async updateInventoryTemplate(roomType: string, template: Partial<Pick<InventoryTemplate, 'fixedInventory' | 'dailyInventory' | 'estimatedCheckDuration'>>): Promise<ApiResponse<{ message: string; template: InventoryTemplate }>> {
    const response = await api.put(`${this.baseURL}/templates/${roomType}`, template);
    return response.data;
  }

  /**
   * Delete inventory template for a room type
   */
  async deleteInventoryTemplate(roomType: string): Promise<ApiResponse<{ message: string }>> {
    const response = await api.delete(`${this.baseURL}/templates/${roomType}`);
    return response.data;
  }

  /**
   * Get daily check statistics for reporting
   */
  async getDailyCheckStats(startDate: string, endDate: string): Promise<ApiResponse<{
    totalChecks: number;
    totalItemsReplaced: number;
    totalItemsAdded: number;
    totalItemsToLaundry: number;
    totalItemsReused: number;
    totalCost: number;
    averageCheckDuration: number;
    roomsByStatus: Record<string, number>;
  }>> {
    const response = await api.get(`${this.baseURL}/stats?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }
}

export const dailyRoutineCheckService = new DailyRoutineCheckService();
