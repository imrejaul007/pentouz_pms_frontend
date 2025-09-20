import { api } from './api';
import { User } from '../types/auth';

interface UpdateProfileData {
  name?: string;
  phone?: string;
  preferences?: {
    bedType?: string;
    floor?: string;
    smokingAllowed?: boolean;
    other?: string;
  };
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class UserService {
  async updateProfile(data: UpdateProfileData): Promise<{ status: string; user: User }> {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordData): Promise<{ status: string; message: string }> {
    const response = await api.patch('/auth/change-password', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data.user;
  }
}

export const userService = new UserService();
