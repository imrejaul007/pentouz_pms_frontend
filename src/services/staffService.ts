import { api } from './api';

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'staff' | 'admin';
  isActive: boolean;
  hotelId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  lastLogin?: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'staff' | 'admin';
}

export interface UpdateStaffData {
  name?: string;
  phone?: string;
  role?: 'staff' | 'admin';
  isActive?: boolean;
}

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'staff' | 'admin';
  isActive?: boolean;
}

export interface StaffResponse {
  staff: StaffMember[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class StaffService {
  // Get all staff members with filtering and pagination
  async getStaffMembers(params: StaffQueryParams = {}): Promise<StaffResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    // For staff management, always filter by role unless explicitly specified
    // This ensures we only get staff and admin users, never guests
    if (params.role) {
      queryParams.append('role', params.role);
    } else {
      // When no specific role is requested, the backend will default to staff/admin only
      // But we can be explicit to ensure we're getting staff management data
    }

    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await api.get(`/admin/users?${queryParams.toString()}`);

    // Filter out any guest users that might have slipped through (extra safety)
    const staffUsers = response.data.data.users.filter((user: StaffMember) =>
      user.role === 'staff' || user.role === 'admin'
    );

    return {
      staff: staffUsers,
      pagination: response.data.data.pagination // Keep original pagination from backend
    };
  }

  // Get a specific staff member by ID
  async getStaffMember(id: string): Promise<StaffMember> {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data.user;
  }

  // Create a new staff member
  async createStaffMember(data: CreateStaffData): Promise<StaffMember> {
    const response = await api.post('/admin/users', data);
    return response.data.data.user;
  }

  // Update a staff member
  async updateStaffMember(id: string, data: UpdateStaffData): Promise<StaffMember> {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data.data.user;
  }

  // Delete a staff member
  async deleteStaffMember(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  }

  // Get staff statistics
  async getStaffStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    regularStaff: number;
  }> {
    const response = await api.get('/admin/users');

    // Filter to only include staff and admin users, exclude guests
    const staff = response.data.data.users.filter((user: StaffMember) =>
      user.role === 'staff' || user.role === 'admin'
    );

    return {
      total: staff.length,
      active: staff.filter((s: StaffMember) => s.isActive).length,
      inactive: staff.filter((s: StaffMember) => !s.isActive).length,
      admins: staff.filter((s: StaffMember) => s.role === 'admin').length,
      regularStaff: staff.filter((s: StaffMember) => s.role === 'staff').length,
    };
  }

  // Bulk operations
  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<void> {
    await Promise.all(
      ids.map(id => this.updateStaffMember(id, { isActive }))
    );
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map(id => this.deleteStaffMember(id))
    );
  }
}

export const staffService = new StaffService();
