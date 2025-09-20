import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { Booking } from '../../types/booking';
import { 
  Calendar, 
  CreditCard, 
  MapPin, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Users,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { RoomServiceWidget } from '../../components/guest/RoomServiceWidget';
import toast from 'react-hot-toast';

interface BookingStats {
  totalBookings: number;
  upcomingBookings: number;
  totalSpent: number;
  loyaltyPoints: number;
  recentBookings: Booking[];
}

export default function GuestDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Real-time connections removed for performance optimization

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings({ limit: 5 });
      const bookings = Array.isArray(response.data?.bookings) ? response.data.bookings : 
                      Array.isArray(response.data) ? response.data : [];
      
      // Calculate stats from bookings
      const totalBookings = bookings.length;
      const upcomingBookings = bookings.filter(b => 
        ['confirmed', 'pending', 'checked_in'].includes(b.status) && 
        (new Date(b.checkIn) > new Date() || 
         (new Date(b.checkIn) <= new Date() && new Date(b.checkOut) > new Date()))
      ).length;
      const totalSpent = bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((total, booking) => total + booking.totalAmount, 0);

      setStats({
        totalBookings,
        upcomingBookings,
        totalSpent,
        loyaltyPoints: user?.loyalty?.points || 0,
        recentBookings: bookings.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({
        totalBookings: 0,
        upcomingBookings: 0,
        totalSpent: 0,
        loyaltyPoints: user?.loyalty?.points || 0,
        recentBookings: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-white rounded-none sm:rounded-xl sm:mx-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Manage your bookings and explore your loyalty benefits
              </p>
            </div>
            {/* Connection status removed - using regular API calls */}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-blue-500 bg-gradient-to-br from-white to-blue-50">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex-shrink-0 shadow-md">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">Total Bookings</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.totalBookings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-green-500 bg-gradient-to-br from-white to-green-50">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex-shrink-0 shadow-md">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Upcoming</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.upcomingBookings}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-yellow-500 bg-gradient-to-br from-white to-yellow-50">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex-shrink-0 shadow-md">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900 truncate">
                {formatCurrency(stats.totalSpent)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 lg:p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 border-l-4 border-purple-500 bg-gradient-to-br from-white to-purple-50">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex-shrink-0 shadow-md">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-purple-700 truncate">Loyalty Points</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900">{stats.loyaltyPoints}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Bookings</h2>
            <button 
              onClick={() => window.location.href = '/guest/bookings'}
              className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
            >
              View All
            </button>
          </div>

          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <p className="text-gray-500">No bookings yet</p>
              <button 
                onClick={() => window.location.href = '/rooms'}
                className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                Browse Rooms
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentBookings.map((booking) => (
                <div key={booking._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{booking.hotelId?.name || 'Hotel'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">#{booking.bookingNumber}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(booking.totalAmount, booking.currency)}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : booking.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Loyalty Program */}
        <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-yellow-50">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Loyalty Status</h2>
          
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-3 sm:mb-4">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 capitalize mb-1">
              {user?.loyalty?.tier || 'Bronze'} Member
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">{stats.loyaltyPoints} points</p>
          </div>

          {/* Loyalty Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progress to next tier</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.min(stats.loyaltyPoints % 1000, 1000)}/1000
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.loyaltyPoints % 1000) / 1000 * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Your Benefits</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Member-only rates and discounts
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Priority customer support
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Earn points on every stay
              </li>
              {(user?.loyalty?.tier === 'silver' || user?.loyalty?.tier === 'gold' || user?.loyalty?.tier === 'platinum') && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Complimentary room upgrades
                </li>
              )}
              {(user?.loyalty?.tier === 'gold' || user?.loyalty?.tier === 'platinum') && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Late checkout privileges
                </li>
              )}
              {user?.loyalty?.tier === 'platinum' && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Exclusive platinum benefits
                </li>
              )}
            </ul>
          </div>
        </Card>
      </div>

      {/* Room Service Section - Only show if user has an active booking */}
      {stats.upcomingBookings > 0 && (
        <div className="mt-8">
          <RoomServiceWidget 
            guestId={user?._id}
            bookingId={stats.recentBookings.find(b => 
              ['confirmed', 'pending', 'checked_in'].includes(b.status) && 
              new Date(b.checkOut) > new Date()
            )?._id}
            onRequestService={(serviceType, items) => {
              console.log('Service requested:', serviceType, items);
              // Handle service request here - could integrate with booking system
            }}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8">
        <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/rooms'}
              className="group flex items-center justify-center p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl hover:from-yellow-100 hover:to-yellow-200 hover:border-yellow-300 hover:scale-105 active:scale-95 transition-all duration-200 min-h-[3.5rem] touch-manipulation shadow-md"
            >
              <Calendar className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-yellow-700 text-sm sm:text-base">Book a Room</span>
            </button>
            <button
              onClick={() => window.location.href = '/guest/bookings'}
              className="group flex items-center justify-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:scale-105 active:scale-95 transition-all duration-200 min-h-[3.5rem] touch-manipulation shadow-md"
            >
              <CreditCard className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-blue-700 text-sm sm:text-base">My Bookings</span>
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="group flex items-center justify-center p-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 hover:border-green-300 hover:scale-105 active:scale-95 transition-all duration-200 min-h-[3.5rem] touch-manipulation shadow-md"
            >
              <Users className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-green-700 text-sm sm:text-base">Contact Support</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}