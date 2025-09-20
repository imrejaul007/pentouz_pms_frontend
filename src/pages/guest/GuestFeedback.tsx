import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { reviewService } from '../../services/reviewService';
import { Booking } from '../../types/booking';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface CheckedOutBooking extends Omit<Booking, 'hotelId'> {
  hotelId: {
    _id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      state: string;
    };
  };
}

interface FeedbackForm {
  bookingId: string;
  rating: number;
  title: string;
  content: string;
  categories: {
    cleanliness: number;
    service: number;
    location: number;
    value: number;
    amenities: number;
  };
  visitType: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
}

export default function GuestFeedback() {
  const { user } = useAuth();
  const [checkedOutBookings, setCheckedOutBookings] = useState<CheckedOutBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CheckedOutBooking | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    bookingId: '',
    rating: 5,
    title: '',
    content: '',
    categories: {
      cleanliness: 5,
      service: 5,
      location: 5,
      value: 5,
      amenities: 5
    },
    visitType: 'leisure'
  });

  useEffect(() => {
    if (user) {
      fetchCheckedOutBookings();
    }
  }, [user]);

  const fetchCheckedOutBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings();
      const bookings = Array.isArray(response.data?.bookings) ? response.data.bookings : 
                      Array.isArray(response.data) ? response.data : [];
      
      // Filter for checked out bookings only
      const checkedOut = bookings.filter((booking: any) => 
        booking.status === 'checked_out' || 
        (new Date(booking.checkOut) < new Date() && booking.status !== 'cancelled')
      ) as CheckedOutBooking[];
      
      setCheckedOutBookings(checkedOut);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStartFeedback = (booking: CheckedOutBooking) => {
    setSelectedBooking(booking);
    setFeedbackForm(prev => ({
      ...prev,
      bookingId: booking._id
    }));
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackForm.title.trim() || !feedbackForm.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        hotelId: selectedBooking!.hotelId._id,
        bookingId: feedbackForm.bookingId,
        rating: feedbackForm.rating,
        title: feedbackForm.title,
        content: feedbackForm.content,
        categories: feedbackForm.categories,
        visitType: feedbackForm.visitType,
        stayDate: selectedBooking!.checkOut
      });

      toast.success('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setSelectedBooking(null);
      resetForm();
      fetchCheckedOutBookings(); // Refresh to show updated status
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFeedbackForm({
      bookingId: '',
      rating: 5,
      title: '',
      content: '',
      categories: {
        cleanliness: 5,
        service: 5,
        location: 5,
        value: 5,
        amenities: 5
      },
      visitType: 'leisure'
    });
  };

  const updateCategoryRating = (category: keyof typeof feedbackForm.categories, rating: number) => {
    setFeedbackForm(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Feedback</h1>
          <p className="text-gray-600 mt-1">
            Share your experience for your completed stays
          </p>
        </div>
      </div>

      {checkedOutBookings.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Stays</h3>
          <p className="text-gray-500">
            You don't have any completed stays yet. Once you check out from a booking, 
            you'll be able to leave feedback here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {checkedOutBookings.map((booking) => (
            <Card key={booking._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {booking.hotelId.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{booking.hotelId.address?.city || 'Location'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{booking.guestDetails?.adults || 1} guests</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Booking:</span>
                    <span className="text-sm text-gray-600">{booking.bookingNumber}</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleStartFeedback(booking)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Leave Feedback
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackForm && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Leave Feedback for {selectedBooking.hotelId.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedbackForm(false)}
                >
                  ×
                </Button>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                        className={`p-1 rounded ${
                          feedbackForm.rating >= star 
                            ? 'text-yellow-400' 
                            : 'text-gray-300'
                        } hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {feedbackForm.rating} out of 5
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Title *
                  </label>
                  <Input
                    value={feedbackForm.title}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summarize your experience"
                    maxLength={200}
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Content *
                  </label>
                  <textarea
                    value={feedbackForm.content}
                    onChange={(e) => setFeedbackForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your detailed experience..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                {/* Category Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rate by Category
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(feedbackForm.categories).map(([category, rating]) => (
                      <div key={category} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-600 capitalize">
                          {category}
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => updateCategoryRating(category as keyof typeof feedbackForm.categories, star)}
                              className={`p-1 rounded ${
                                rating >= star 
                                  ? 'text-yellow-400' 
                                  : 'text-gray-300'
                              } hover:text-yellow-400 transition-colors`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type of Visit
                  </label>
                  <select
                    value={feedbackForm.visitType}
                    onChange={(e) => setFeedbackForm(prev => ({ 
                      ...prev, 
                      visitType: e.target.value as FeedbackForm['visitType'] 
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="leisure">Leisure</option>
                    <option value="business">Business</option>
                    <option value="family">Family</option>
                    <option value="couple">Couple</option>
                    <option value="solo">Solo</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFeedbackForm(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Feedback
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
