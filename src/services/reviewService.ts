import { api } from './api';

export interface CreateReviewRequest {
  hotelId: string;
  bookingId?: string;
  rating: number;
  title: string;
  content: string;
  categories?: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  visitType?: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
  stayDate?: string;
  images?: string[];
}

export interface Review {
  _id: string;
  hotelId: {
    _id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      state: string;
    };
  };
  userId: {
    _id: string;
    name: string;
  };
  bookingId?: {
    _id: string;
    bookingNumber: string;
    checkIn: string;
    checkOut: string;
  };
  rating: number;
  title: string;
  content: string;
  categories?: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  isVerified: boolean;
  isPublished: boolean;
  helpfulVotes: number;
  reportedCount: number;
  images: string[];
  visitType?: string;
  stayDate?: string;
  guestName?: string;
  roomType?: string;
  source: string;
  language: string;
  moderationStatus: string;
  response?: {
    content: string;
    respondedBy: {
      _id: string;
      name: string;
      role: string;
    };
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HotelReviewsResponse {
  reviews: Review[];
  summary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      [key: number]: number;
    };
    categoryAverages: {
      cleanliness: number;
      service: number;
      location: number;
      value: number;
      amenities: number;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ReviewService {
  async createReview(data: CreateReviewRequest): Promise<{ status: string; data: { review: Review } }> {
    const response = await api.post('/reviews', data);
    return response.data;
  }

  async getHotelReviews(
    hotelId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
    }
  ): Promise<HotelReviewsResponse> {
    const response = await api.get(`/reviews/hotel/${hotelId}`, { params });
    return response.data.data;
  }

  async getHotelRatingSummary(hotelId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
    categoryAverages: {
      cleanliness: number;
      service: number;
      location: number;
      value: number;
      amenities: number;
    };
  }> {
    const response = await api.get(`/reviews/hotel/${hotelId}/summary`);
    return response.data.data;
  }

  async getReview(reviewId: string): Promise<{ status: string; data: { review: Review } }> {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  }

  async markReviewHelpful(reviewId: string): Promise<{ status: string; message: string; data: { helpfulVotes: number } }> {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  }

  async reportReview(reviewId: string, reason: string): Promise<{ status: string; message: string }> {
    const response = await api.post(`/reviews/${reviewId}/report`, { reason });
    return response.data;
  }

  async addResponse(reviewId: string, content: string): Promise<{ status: string; message: string; data: { review: Review } }> {
    const response = await api.post(`/reviews/${reviewId}/response`, { content });
    return response.data;
  }

  async moderateReview(
    reviewId: string,
    status: 'approved' | 'rejected' | 'pending',
    notes?: string
  ): Promise<{ status: string; message: string; data: { review: Review } }> {
    const response = await api.patch(`/reviews/${reviewId}/moderate`, { status, notes });
    return response.data;
  }

  async getPendingReviews(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await api.get('/reviews/pending', { params });
    return response.data.data;
  }
}

export const reviewService = new ReviewService();
