import { ApiResponse } from '../types/dashboard';
import { api } from './api';

export interface MaintenanceTask {
  _id: string;
  title: string;
  description: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'cleaning' | 'carpentry' | 'painting' | 'appliance' | 'safety' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  assignedToUserId?: {
    _id: string;
    name: string;
  };
  reportedBy: {
    _id: string;
    name: string;
  };
  roomId?: {
    _id: string;
    roomNumber: string;
    type: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedDate?: string;
  isOverdue?: boolean;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  avgDuration: number;
  overdueCount: number;
  byType?: any;
  overdueTasks?: number;
  upcomingRecurring?: number;
  overdueDetails?: MaintenanceTask[];
  upcomingDetails?: MaintenanceTask[];
}

class MaintenanceService {
  private baseURL = '/maintenance';

  // Get maintenance tasks with filters
  async getTasks(params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    priority?: string;
    overdue?: boolean;
  } = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.overdue) queryParams.append('overdue', 'true');

    const endpoint = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${this.baseURL}${endpoint}`);
    return response.data;
  }

  // Get maintenance statistics
  async getStats() {
    const response = await api.get(`${this.baseURL}/stats`);
    return response.data;
  }

  // Get overdue tasks
  async getOverdueTasks() {
    const response = await api.get(`${this.baseURL}/overdue`);
    return response.data;
  }

  // Get task by ID
  async getTask(id: string) {
    const response = await api.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // Create new maintenance task
  async createTask(taskData: {
    title: string;
    description?: string;
    type: string;
    priority: string;
    roomId?: string;
    dueDate?: string;
    estimatedDuration?: number;
    estimatedCost?: number;
    category?: string;
    roomOutOfOrder?: boolean;
  }) {
    const response = await api.post(`${this.baseURL}`, taskData);
    return response.data;
  }

  // Update task
  async updateTask(id: string, updates: {
    status?: string;
    assignedTo?: string;
    scheduledDate?: string;
    actualDuration?: number;
    actualCost?: number;
    completionNotes?: string;
    priority?: string;
  }) {
    console.log('🔧 Updating maintenance task:', { id, updates });
    try {
      const response = await api.patch(`${this.baseURL}/${id}`, updates);
      console.log('✅ Task update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Task update failed:', {
        id,
        updates,
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  // Assign task
  async assignTask(id: string, data: {
    assignedTo: string;
    scheduledDate?: string;
    notes?: string;
  }) {
    const response = await api.post(`${this.baseURL}/${id}/assign`, data);
    return response.data;
  }

  // Get tasks for staff dashboard (grouped by status)
  async getTasksGrouped() {
    console.log('🔍 Fetching grouped maintenance tasks...');
    try {
      const [allUrgent, pending, inProgress, completed] = await Promise.all([
        this.getTasks({ priority: 'emergency', limit: 50 }), // Get more to filter properly
        this.getTasks({ status: 'pending', limit: 10 }),
        this.getTasks({ status: 'in_progress', limit: 10 }),
        this.getTasks({ status: 'completed', limit: 10 }),
      ]);

      // Filter urgent tasks to only show those that are still pending (not started)
      const urgent = (allUrgent.data.tasks || []).filter(task =>
        task.status === 'pending' && (task.priority === 'emergency' || task.priority === 'urgent')
      );

      // Debug logging
      console.log('✅ Maintenance tasks fetched and filtered:', {
        urgent: urgent.length,
        pending: pending.data.tasks?.length || 0,
        inProgress: inProgress.data.tasks?.length || 0,
        completed: completed.data.tasks?.length || 0,
        urgentFiltered: `${urgent.length} out of ${allUrgent.data.tasks?.length || 0} emergency tasks`
      });

      return {
        urgent: urgent.slice(0, 10), // Limit to 10 after filtering
        pending: pending.data.tasks || [],
        inProgress: inProgress.data.tasks || [],
        completed: completed.data.tasks || [],
      };
    } catch (error) {
      console.error('❌ Failed to fetch grouped maintenance tasks:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  // Start task (change status to in_progress)
  async startTask(id: string) {
    return this.updateTask(id, { status: 'in_progress' });
  }

  // Complete task
  async completeTask(id: string, completionData?: {
    actualDuration?: number;
    actualCost?: number;
    completionNotes?: string;
  }) {
    return this.updateTask(id, {
      status: 'completed',
      ...completionData,
    });
  }
}

export const maintenanceService = new MaintenanceService();