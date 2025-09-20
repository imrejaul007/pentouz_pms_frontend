import { ApiResponse } from '../types/api';
import { api } from './api';

export interface HousekeepingTask {
  _id: string;
  title: string;
  description: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'deep_clean' | 'checkout_clean';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  roomId: {
    _id: string;
    roomNumber: string;
    type: string;
  };
  assignedToUserId?: string;
  estimatedDuration: number;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  notes?: string;
  supplies?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
}

class HousekeepingService {
  private baseURL = '/housekeeping';

  async getTasks(assignedToUserId?: string): Promise<ApiResponse<{ tasks: HousekeepingTask[] }>> {
    const queryParams = new URLSearchParams();
    if (assignedToUserId) {
      queryParams.append('assignedToUserId', assignedToUserId);
    }

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${this.baseURL}${endpoint}`);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<ApiResponse<{ task: HousekeepingTask }>> {
    const response = await api.patch(`${this.baseURL}/${taskId}`, { status });
    return response.data;
  }

  async completeTask(taskId: string, completionData: {
    status: string;
    completedSteps: string[];
    completedAt: string;
  }): Promise<ApiResponse<{ task: HousekeepingTask }>> {
    const response = await api.patch(`${this.baseURL}/${taskId}`, completionData);
    return response.data;
  }
}

export const housekeepingService = new HousekeepingService();