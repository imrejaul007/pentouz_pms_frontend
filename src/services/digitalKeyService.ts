import { api } from './api';

export interface DigitalKey {
  _id: string;
  userId: string;
  bookingId: {
    _id: string;
    bookingNumber: string;
    checkIn: string;
    checkOut: string;
  };
  roomId: {
    _id: string;
    number: string;
    type: string;
    floor: string;
  };
  hotelId: {
    _id: string;
    name: string;
    address: string;
  };
  keyCode: string;
  qrCode: string;
  status: 'active' | 'expired' | 'revoked' | 'used';
  type: 'primary' | 'temporary' | 'emergency';
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  lastUsedAt?: string;
  sharedWith: SharedKey[];
  accessLogs: AccessLog[];
  securitySettings: SecuritySettings;
  metadata: {
    generatedBy?: string;
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      location?: string;
    };
    notes?: string;
  };
  isExpired: boolean;
  isValid: boolean;
  canBeUsed: boolean;
  canBeShared: boolean;
  remainingUses: number | 'unlimited';
  createdAt: string;
  updatedAt: string;
}

export interface SharedKey {
  userId?: string;
  email: string;
  name: string;
  sharedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface AccessLog {
  timestamp: string;
  action: 'generated' | 'accessed' | 'shared' | 'revoked' | 'expired';
  userId?: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
  metadata?: any;
}

export interface SecuritySettings {
  requirePin: boolean;
  pin?: string;
  allowSharing: boolean;
  maxSharedUsers: number;
  requireApproval: boolean;
}

export interface DigitalKeysResponse {
  keys: DigitalKey[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface KeyStats {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  sharedKeys: number;
  totalUses: number;
  recentActivity: Array<{
    keyId: string;
    action: string;
    timestamp: string;
    deviceInfo?: any;
  }>;
}

export interface AdminAnalytics {
  overview: {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    revokedKeys: number;
    totalUses: number;
    uniqueUsers: number;
  };
  breakdowns: {
    byType: Array<{
      _id: string;
      count: number;
    }>;
    byHotel: Array<{
      _id: string;
      hotelName: string;
      count: number;
    }>;
  };
  trends: {
    usage: Array<{
      _id: {
        year: number;
        month: number;
        day: number;
      };
      count: number;
    }>;
    timeRange: string;
  };
  activity: {
    recent: Array<{
      keyId: string;
      action: string;
      timestamp: string;
      user: {
        name: string;
        email: string;
      };
      hotel: string;
      deviceInfo?: any;
    }>;
    topUsers: Array<{
      _id: string;
      name: string;
      email: string;
      keyCount: number;
      totalUses: number;
    }>;
  };
}

export interface GenerateKeyRequest {
  bookingId: string;
  type?: 'primary' | 'temporary' | 'emergency';
  maxUses?: number;
  securitySettings?: {
    requirePin?: boolean;
    pin?: string;
    allowSharing?: boolean;
    maxSharedUsers?: number;
    requireApproval?: boolean;
  };
}

export interface ShareKeyRequest {
  email: string;
  name: string;
  expiresAt?: string;
}

export interface ValidateKeyRequest {
  pin?: string;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}

class DigitalKeyService {
  async getKeys(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<DigitalKeysResponse> {
    const response = await api.get('/digital-keys', { params });
    return response.data.data;
  }

  async getSharedKeys(params?: {
    page?: number;
    limit?: number;
  }): Promise<DigitalKeysResponse> {
    const response = await api.get('/digital-keys/shared', { params });
    return response.data.data;
  }

  async generateKey(request: GenerateKeyRequest): Promise<{ message: string; data: DigitalKey }> {
    const response = await api.post('/digital-keys/generate', request);
    return response.data;
  }

  async getKey(keyId: string): Promise<DigitalKey> {
    const response = await api.get(`/digital-keys/${keyId}`);
    return response.data.data;
  }

  async validateKey(keyCode: string, request: ValidateKeyRequest): Promise<{
    message: string;
    data: {
      keyId: string;
      roomNumber: string;
      hotelName: string;
      remainingUses: number | 'unlimited';
      validUntil: string;
    };
  }> {
    const response = await api.post(`/digital-keys/validate/${keyCode}`, request);
    return response.data;
  }

  async shareKey(keyId: string, request: ShareKeyRequest): Promise<{
    message: string;
    data: {
      keyId: string;
      sharedWith: ShareKeyRequest;
    };
  }> {
    const response = await api.post(`/digital-keys/${keyId}/share`, request);
    return response.data;
  }

  async revokeShare(keyId: string, userIdOrEmail: string): Promise<{ message: string }> {
    const response = await api.delete(`/digital-keys/${keyId}/share/${userIdOrEmail}`);
    return response.data;
  }

  async getKeyLogs(keyId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AccessLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await api.get(`/digital-keys/${keyId}/logs`, { params });
    return response.data.data;
  }

  async revokeKey(keyId: string): Promise<{ message: string }> {
    const response = await api.delete(`/digital-keys/${keyId}`);
    return response.data;
  }

  async getStats(): Promise<KeyStats> {
    const response = await api.get('/digital-keys/stats/overview');
    return response.data.data;
  }

  // Admin-specific methods
  async getAdminKeys(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    hotel?: string;
    search?: string;
  }): Promise<DigitalKeysResponse> {
    const response = await api.get('/digital-keys/admin', { params });
    return response.data.data;
  }

  async getAdminAnalytics(timeRange: string = '30d'): Promise<AdminAnalytics> {
    const response = await api.get(`/digital-keys/admin/analytics`, {
      params: { timeRange }
    });
    return response.data.data;
  }

  async getAdminActivityLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    timeRange?: string;
  }): Promise<{
    logs: AccessLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await api.get('/digital-keys/admin/activity-logs', { params });
    return response.data.data;
  }

  async exportAdminKeys(params?: {
    status?: string;
    type?: string;
    hotel?: string;
    format?: 'csv' | 'excel';
  }): Promise<Blob> {
    const response = await api.get('/digital-keys/admin/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  }

  // Utility functions
  getKeyTypeInfo(type: string): { label: string; color: string; icon: string; description: string } {
    const types = {
      primary: {
        label: 'Primary Key',
        color: 'bg-blue-100 text-blue-800',
        icon: '🔑',
        description: 'Main access key for the room'
      },
      temporary: {
        label: 'Temporary Key',
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⏰',
        description: 'Limited-time access key'
      },
      emergency: {
        label: 'Emergency Key',
        color: 'bg-red-100 text-red-800',
        icon: '🚨',
        description: 'Emergency access key'
      }
    };
    return types[type as keyof typeof types] || types.primary;
  }

  getStatusInfo(status: string): { label: string; color: string; description: string } {
    const statuses = {
      active: {
        label: 'Active',
        color: 'bg-green-100 text-green-800',
        description: 'Key is valid and can be used'
      },
      expired: {
        label: 'Expired',
        color: 'bg-gray-100 text-gray-800',
        description: 'Key has expired'
      },
      revoked: {
        label: 'Revoked',
        color: 'bg-red-100 text-red-800',
        description: 'Key has been revoked'
      },
      used: {
        label: 'Used',
        color: 'bg-purple-100 text-purple-800',
        description: 'Key has been used up'
      }
    };
    return statuses[status as keyof typeof statuses] || statuses.active;
  }

  getActionInfo(action: string): { label: string; color: string; icon: string } {
    const actions = {
      generated: {
        label: 'Generated',
        color: 'bg-blue-100 text-blue-800',
        icon: '🔑'
      },
      accessed: {
        label: 'Accessed',
        color: 'bg-green-100 text-green-800',
        icon: '🚪'
      },
      shared: {
        label: 'Shared',
        color: 'bg-purple-100 text-purple-800',
        icon: '📤'
      },
      revoked: {
        label: 'Revoked',
        color: 'bg-red-100 text-red-800',
        icon: '❌'
      },
      expired: {
        label: 'Expired',
        color: 'bg-gray-100 text-gray-800',
        icon: '⏰'
      }
    };
    return actions[action as keyof typeof actions] || actions.generated;
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  formatRemainingUses(remainingUses: number | 'unlimited'): string {
    if (remainingUses === 'unlimited') {
      return 'Unlimited';
    }
    return `${remainingUses} use${remainingUses !== 1 ? 's' : ''}`;
  }

  canShareKey(key: DigitalKey): boolean {
    return key.canBeShared && key.status === 'active';
  }

  canRevokeKey(key: DigitalKey): boolean {
    return key.status === 'active' && key.userId === key.userId; // User owns the key
  }

  isKeyExpiringSoon(key: DigitalKey): boolean {
    const now = new Date();
    const validUntil = new Date(key.validUntil);
    const diffInHours = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24 && diffInHours > 0;
  }

  getExpirationStatus(key: DigitalKey): 'valid' | 'expiring' | 'expired' {
    if (key.isExpired) return 'expired';
    if (this.isKeyExpiringSoon(key)) return 'expiring';
    return 'valid';
  }
}

export const digitalKeyService = new DigitalKeyService();
