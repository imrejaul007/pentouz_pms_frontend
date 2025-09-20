import { ApiResponse } from '../types/api';

export interface MaintenanceTask {
  _id: string;
  title: string;
  description: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'cleaning' | 'carpentry' | 'painting' | 'appliance' | 'safety' | 'other';
  category: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  roomId: { _id: string; roomNumber: string; type: string };
  assignedToUserId?: { _id: string; name: string; email: string };
  estimatedDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  notes?: string;
  hotelId: string;
  createdAt: string;
  updatedAt: string;
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
}

export interface Material {
  name: string;
  quantity: number;
  unitCost?: number;
  supplier?: string;
}

export interface CreateMaintenanceTaskData {
  title: string;
  description: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'cleaning' | 'carpentry' | 'painting' | 'appliance' | 'safety' | 'other';
  category: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  roomId?: string;
  assignedToUserId?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  notes?: string;
  materials?: Material[];
  hotelId?: string;
}

export interface MaintenanceFilters {
  status?: string;
  type?: string;
  priority?: string;
  roomId?: string;
  assignedToUserId?: string;
  page?: number;
  limit?: number;
}

class AdminMaintenanceService {
  private baseURL = '/api/v1/maintenance';
  private hotelIdCache: string | null = null;
  private hotelIdCacheExpiry: number = 0;
  
  private async fetchWithAuth<T>(endpoint: string, options: RequestInit & { baseURL?: string } = {}): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const baseURL = options.baseURL || this.baseURL;
    const { baseURL: _, ...fetchOptions } = options;

    const response = await fetch(`${baseURL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private roomsCache: Array<{ _id: string; roomNumber: string; type: string; floor?: string }> = [];

  async getTasks(filters: MaintenanceFilters = {}): Promise<ApiResponse<{ tasks: MaintenanceTask[]; pagination: any }>> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    // Fetch available rooms to create a lookup cache if needed
    if (this.roomsCache.length === 0) {
      try {
        const userHotelId = await this.getUserHotelId();
        const roomsResponse = await this.getAvailableRooms(userHotelId);
        this.roomsCache = roomsResponse.data;
      } catch (error) {
        console.warn('Could not fetch rooms for mapping:', error);
        this.roomsCache = []; // Set empty array to prevent repeated failures
      }
    }
    
    const response = await this.fetchWithAuth(`/${endpoint}`);
    
    // Transform backend data to match frontend interface
    if (response.data && response.data.tasks) {
      response.data.tasks = response.data.tasks.map((task: any) => {
        // Map room ID to room details from cache
        let roomDetails = null;
        if (task.roomId) {
          if (typeof task.roomId === 'string') {
            // If roomId is just a string ID, look it up in cache
            const cachedRoom = this.roomsCache.find(room => room._id === task.roomId);
            if (cachedRoom) {
              roomDetails = {
                _id: cachedRoom._id,
                roomNumber: cachedRoom.roomNumber,
                type: cachedRoom.type
              };
            } else {
              // If not in cache, create a fallback with just the ID
              roomDetails = {
                _id: task.roomId,
                roomNumber: `Room ${task.roomId.slice(-4)}`, // Use last 4 chars of ID as fallback
                type: 'Unknown'
              };
            }
          } else if (task.roomId && typeof task.roomId === 'object') {
            // If roomId is an object, use its data or enhance with cache
            const cachedRoom = this.roomsCache.find(room => room._id === task.roomId._id);

            roomDetails = {
              _id: task.roomId._id,
              roomNumber: task.roomId.roomNumber || task.roomId.number || cachedRoom?.roomNumber || `Room ${task.roomId._id?.slice(-4) || 'Unknown'}`,
              type: task.roomId.type || cachedRoom?.type || 'Unknown'
            };
          }
        }

        const transformedTask = {
          ...task,
          // Maintain backend field names
          type: task.type || 'other',
          category: task.category || 'corrective',
          assignedToUserId: task.assignedTo ? {
            _id: task.assignedTo._id,
            name: task.assignedTo.name,
            email: task.assignedTo.email || ''
          } : undefined,
          roomId: roomDetails,
          // Ensure required fields have default values
          title: task.title || 'Untitled Task',
          description: task.description || 'No description provided',
          priority: task.priority || 'medium',
          status: task.status || 'pending',
          estimatedDuration: task.estimatedDuration || 60
        };
        return transformedTask;
      });
    }
    
    return response;
  }

  async getTaskById(taskId: string): Promise<ApiResponse<MaintenanceTask>> {
    return this.fetchWithAuth(`/${taskId}`);
  }

  private async getUserHotelId(): Promise<string> {
    // Check cache first (cache for 10 minutes)
    const now = Date.now();
    if (this.hotelIdCache && now < this.hotelIdCacheExpiry) {
      return this.hotelIdCache;
    }

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Try different possible field names for hotelId
        const hotelId = payload.hotelId || payload.hotel || payload.hotelData?.id || payload.hotelData?._id;

        if (hotelId) {
          // Cache the hotelId for 10 minutes
          this.hotelIdCache = hotelId;
          this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
          return hotelId;
        }
      } catch (error) {
        console.warn('Could not parse token for hotelId:', error);
      }
    }
    
    // Try to get hotelId from user profile API
    try {
      const response = await this.fetchWithAuth('/auth/me', { baseURL: '/api/v1' });
      const userData = response.data?.user;

      if (userData?.hotelId) {
        this.hotelIdCache = userData.hotelId;
        this.hotelIdCacheExpiry = now + 10 * 60 * 1000;
        return userData.hotelId;
      }
    } catch (error) {
      console.warn('Could not get hotelId from user profile:', error);
    }

    // TODO: Replace with proper hotel ID endpoint when available
    throw new Error('Unable to determine hotel ID for this user');
  }

  async createTask(taskData: CreateMaintenanceTaskData): Promise<ApiResponse<MaintenanceTask>> {
    // Get hotelId from cache or token
    const userHotelId = await this.getUserHotelId();

    // Validate required fields before sending
    if (!taskData.title || !taskData.type || !taskData.priority) {
      throw new Error('Missing required fields: title, type, and priority are required');
    }

    // Transform frontend data to match backend interface
    const backendData = {
      ...taskData,
      hotelId: userHotelId, // Always include hotelId in request body
      assignedTo: taskData.assignedToUserId, // Frontend uses 'assignedToUserId', backend expects 'assignedTo'
      // Ensure required fields have valid values
      title: String(taskData.title).trim(),
      type: taskData.type,
      priority: taskData.priority,
      category: taskData.category || 'corrective', // Ensure category has a valid default
      estimatedDuration: Number(taskData.estimatedDuration) || 60,
      estimatedCost: Number(taskData.estimatedCost) || 0,
    };

    // Remove frontend-specific fields and undefined values
    delete backendData.assignedToUserId;

    // Clean up undefined or empty string values for optional fields
    if (!backendData.roomId) delete backendData.roomId;
    if (!backendData.assignedTo) delete backendData.assignedTo;
    if (!backendData.description) delete backendData.description;
    if (!backendData.notes) delete backendData.notes;
    
    return this.fetchWithAuth('/', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });
  }

  async updateTask(taskId: string, updates: Partial<MaintenanceTask>): Promise<ApiResponse<MaintenanceTask>> {
    // Transform frontend data to match backend interface
    const backendUpdates: any = { ...updates };

    if (updates.assignedToUserId) {
      backendUpdates.assignedTo = updates.assignedToUserId;
      delete backendUpdates.assignedToUserId;
    }

    return this.fetchWithAuth(`/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(backendUpdates),
    });
  }

  async assignTask(taskId: string, assignedToUserId: string, notes?: string): Promise<ApiResponse<MaintenanceTask>> {
    return this.fetchWithAuth(`/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedToUserId, notes }),
    });
  }

  async getStats(hotelId?: string): Promise<ApiResponse<MaintenanceStats>> {
    // Use provided hotelId or get from cache/token
    const targetHotelId = hotelId || await this.getUserHotelId();

    const queryParams = new URLSearchParams();
    queryParams.append('hotelId', targetHotelId);
    const endpoint = `/stats?${queryParams.toString()}`;
    return this.fetchWithAuth(endpoint);
  }

  async getOverdueTasks(hotelId?: string): Promise<ApiResponse<MaintenanceTask[]>> {
    // Use provided hotelId or fetch dynamically
    const targetHotelId = hotelId || await this.getUserHotelId();
    
    const queryParams = new URLSearchParams();
    if (targetHotelId) {
      queryParams.append('hotelId', targetHotelId);
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/overdue?${queryString}` : '/overdue';
    return this.fetchWithAuth(endpoint);
  }

  async getUpcomingRecurring(): Promise<ApiResponse<MaintenanceTask[]>> {
    return this.fetchWithAuth('/recurring/upcoming');
  }

  // Get available staff members for assignment
  async getAvailableStaff(hotelId?: string): Promise<ApiResponse<Array<{ _id: string; name: string; email: string; department?: string }>>> {
    // Use provided hotelId or get from cache/token
    const targetHotelId = hotelId || await this.getUserHotelId();

    const queryParams = new URLSearchParams();
    queryParams.append('hotelId', targetHotelId);
    const endpoint = `/available-staff?${queryParams.toString()}`;
    return this.fetchWithAuth(endpoint);
  }

  // Get available rooms
  async getAvailableRooms(hotelId?: string): Promise<ApiResponse<Array<{ _id: string; roomNumber: string; type: string; floor?: string }>>> {
    // Use provided hotelId or get from cache/token
    const targetHotelId = hotelId || await this.getUserHotelId();

    const queryParams = new URLSearchParams();
    queryParams.append('hotelId', targetHotelId);
    const endpoint = `/available-rooms?${queryParams.toString()}`;
    return this.fetchWithAuth(endpoint);
  }

  // Bulk operations
  async bulkUpdateStatus(taskIds: string[], status: string): Promise<ApiResponse<{ updated: number }>> {
    return this.fetchWithAuth('/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify({ taskIds, status }),
    });
  }

  async bulkAssign(taskIds: string[], assignedToUserId: string): Promise<ApiResponse<{ updated: number }>> {
    return this.fetchWithAuth('/bulk/assign', {
      method: 'PATCH',
      body: JSON.stringify({ taskIds, assignedToUserId }),
    });
  }
}

export const adminMaintenanceService = new AdminMaintenanceService();