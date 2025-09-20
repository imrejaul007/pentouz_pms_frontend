import { api } from './api';

export interface FavoriteOffer {
  _id: string;
  userId: string;
  offerId: string;
  notifyOnExpiry: boolean;
  notifyOnUpdate: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  offer: {
    _id: string;
    title: string;
    description: string;
    pointsRequired: number;
    type: string;
    category: string;
    validUntil?: string;
    discountPercentage?: number;
    discountAmount?: number;
  };
}

export interface FavoritesResponse {
  status: string;
  data: {
    favorites: FavoriteOffer[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface FavoriteStats {
  totalFavorites: number;
  categoryBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  avgPointsRequired: number;
  daysSinceFavoriting: number;
}

export interface PopularOffer {
  offerId: string;
  offer: any;
  favoriteCount: number;
  uniqueUsers: number;
  popularityScore: number;
}

export interface RecommendedOffer {
  _id: string;
  title: string;
  description: string;
  pointsRequired: number;
  type: string;
  category: string;
  recommendationScore: number;
  recommendationReason: string;
}

const favoritesService = {
  // Get user's favorite offers
  getFavorites: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: number;
  }): Promise<FavoritesResponse> => {
    const response = await api.get('/loyalty/favorites', { params });
    return response.data;
  },

  // Add offer to favorites
  addToFavorites: async (data: {
    offerId: string;
    notifyOnExpiry?: boolean;
    notifyOnUpdate?: boolean;
    notes?: string;
  }): Promise<{ status: string; data: FavoriteOffer }> => {
    const response = await api.post('/loyalty/favorites', data);
    return response.data;
  },

  // Update favorite settings
  updateFavorite: async (favoriteId: string, data: {
    notifyOnExpiry?: boolean;
    notifyOnUpdate?: boolean;
    notes?: string;
  }): Promise<{ status: string; data: FavoriteOffer }> => {
    const response = await api.put(`/loyalty/favorites/${favoriteId}`, data);
    return response.data;
  },

  // Remove from favorites by favorite ID
  removeFromFavorites: async (favoriteId: string): Promise<{ status: string }> => {
    const response = await api.delete(`/loyalty/favorites/${favoriteId}`);
    return response.data;
  },

  // Remove from favorites by offer ID
  removeOfferFromFavorites: async (offerId: string): Promise<{ status: string }> => {
    const response = await api.delete(`/loyalty/favorites/offer/${offerId}`);
    return response.data;
  },

  // Check if offer is in favorites
  checkIsFavorite: async (offerId: string): Promise<{
    status: string;
    data: {
      isFavorite: boolean;
      favorite: FavoriteOffer | null;
    };
  }> => {
    const response = await api.get(`/loyalty/favorites/check/${offerId}`);
    return response.data;
  },

  // Get personalized recommendations
  getRecommendations: async (params?: {
    limit?: number;
    excludeFavorites?: boolean;
  }): Promise<{
    status: string;
    data: RecommendedOffer[];
  }> => {
    const response = await api.get('/loyalty/favorites/recommendations', { params });
    return response.data;
  },

  // Get popular offers
  getPopularOffers: async (params?: {
    limit?: number;
    category?: string;
    timeframe?: string;
    minFavorites?: number;
  }): Promise<{
    status: string;
    data: PopularOffer[];
  }> => {
    const response = await api.get('/loyalty/favorites/popular', { params });
    return response.data;
  },

  // Get favorites statistics
  getFavoriteStats: async (): Promise<{
    status: string;
    data: FavoriteStats;
  }> => {
    const response = await api.get('/loyalty/favorites/stats');
    return response.data;
  }
};

export default favoritesService;