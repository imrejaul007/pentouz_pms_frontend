import { api } from './api';

export interface Review {
  _id: string;
  hotelId: string;
  userId: {
    _id: string;
    name: string;
  };
  bookingId?: string;
  rating: number;
  title: string;
  content: string;
  categories?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
  };
  isVerified: boolean;
  isPublished: boolean;
  response?: {
    content: string;
    respondedBy: {
      _id: string;
      name: string;
      role: string;
    };
    respondedAt: string;
  };
  helpfulVotes: number;
  reportedCount: number;
  images?: string[];
  visitType?: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
  stayDate?: string;
  guestName: string;
  roomType?: string;
  source: string;
  language: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  categoryAverages: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
  };
}

export interface CreateReviewData {
  hotelId: string;
  bookingId?: string;
  rating: number;
  title: string;
  content: string;
  categories?: {
    cleanliness?: number;
    service?: number;
    location?: number;
    value?: number;
    amenities?: number;
  };
  visitType?: string;
  stayDate?: string;
  images?: string[];
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ReviewsService {
  // Get reviews for a specific hotel
  async getHotelReviews(
    hotelId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
    }
  ): Promise<ReviewsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const response = await api.get(`/reviews/hotel/${hotelId}?${queryParams.toString()}`);
    return response.data.data;
  }

  // Get hotel rating summary
  async getHotelRatingSummary(hotelId: string): Promise<ReviewSummary> {
    const response = await api.get(`/reviews/hotel/${hotelId}/summary`);
    return response.data.data;
  }

  // Create a new review
  async createReview(reviewData: CreateReviewData): Promise<Review> {
    const response = await api.post('/reviews', reviewData);
    return response.data.data.review;
  }

  // Get a specific review
  async getReview(reviewId: string): Promise<Review> {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data.data.review;
  }

  // Add response to review (staff/admin only)
  async addResponse(reviewId: string, content: string): Promise<Review> {
    const response = await api.post(`/reviews/${reviewId}/response`, { content });
    return response.data.data.review;
  }

  // Mark review as helpful
  async markHelpful(reviewId: string): Promise<{ helpfulVotes: number }> {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data.data;
  }

  // Report review
  async reportReview(reviewId: string, reason?: string): Promise<void> {
    await api.post(`/reviews/${reviewId}/report`, { reason });
  }

  // Get current user's reviews
  async getUserReviews(params?: { page?: number; limit?: number }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/reviews/user/my-reviews?${queryParams.toString()}`);
    return response.data.data;
  }

  // Moderate review (admin only)
  async moderateReview(
    reviewId: string,
    status: 'approved' | 'rejected' | 'pending',
    notes?: string
  ): Promise<Review> {
    const response = await api.patch(`/reviews/${reviewId}/moderate`, { status, notes });
    return response.data.data.review;
  }

  // Get pending reviews (admin only)
  async getPendingReviews(params?: { page?: number; limit?: number }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/reviews/pending?${queryParams.toString()}`);
    return response.data.data;
  }
}

export default new ReviewsService();