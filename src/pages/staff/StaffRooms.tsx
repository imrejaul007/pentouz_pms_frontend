import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Home, Clock, CheckCircle, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { staffDashboardService, RoomStatusData, StaffActivityData } from '../../services/staffDashboardService';
import { useRealTime } from '../../services/realTimeService';
import { toast } from 'react-hot-toast';

export default function StaffRooms() {
  const [roomData, setRoomData] = useState<RoomStatusData | null>(null);
  const [activityData, setActivityData] = useState<StaffActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time connection
  const { connectionState, connect, disconnect, on, off, isConnected } = useRealTime();

  useEffect(() => {
    fetchRoomData();
  }, []);

  // Real-time connection setup
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!isConnected) return;
    
    const handleRoomStatusChanged = (data: any) => {
      console.log('Real-time room status changed:', data);
      fetchRoomData();
      toast.success(`Room ${data.roomNumber} status updated to ${data.status}`);
    };
    
    const handleBookingCheckedIn = (data: any) => {
      console.log('Real-time guest checked in:', data);
      fetchRoomData();
      toast.success(`Guest checked in to Room ${data.roomNumber || 'N/A'}`);
    };
    
    const handleBookingCheckedOut = (data: any) => {
      console.log('Real-time guest checked out:', data);
      fetchRoomData();
      toast.success(`Guest checked out from Room ${data.roomNumber || 'N/A'}`);
    };
    
    const handleRoomAttentionRequired = (data: any) => {
      console.log('Real-time room needs attention:', data);
      fetchRoomData();
      toast.error(`Room ${data.roomNumber} needs attention: ${data.reason}`);
    };
    
    const handleRoomUpdate = (data: any) => {
      console.log('Real-time room update:', data);
      fetchRoomData();
    };
    
    on('room:status_changed', handleRoomStatusChanged);
    on('booking:checked_in', handleBookingCheckedIn);
    on('booking:checked_out', handleBookingCheckedOut);
    on('room:attention_required', handleRoomAttentionRequired);
    on('room:updated', handleRoomUpdate);
    on('occupancy:changed', handleRoomUpdate);
    
    return () => {
      off('room:status_changed', handleRoomStatusChanged);
      off('booking:checked_in', handleBookingCheckedIn);
      off('booking:checked_out', handleBookingCheckedOut);
      off('room:attention_required', handleRoomAttentionRequired);
      off('room:updated', handleRoomUpdate);
      off('occupancy:changed', handleRoomUpdate);
    };
  }, [isConnected, on, off]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomResponse, activityResponse] = await Promise.all([
        staffDashboardService.getRoomStatus(),
        staffDashboardService.getRecentActivity()
      ]);
      setRoomData(roomResponse.data);
      setActivityData(activityResponse.data);
      console.log('Room data fetched:', roomResponse.data);
      console.log('Activity data fetched:', activityResponse.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
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

  if (error || !roomData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load room data</h3>
          <Button onClick={fetchRoomData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { summary, needsAttention } = roomData;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Room Status Overview</h1>
            <p className="text-gray-600 text-sm sm:text-base">Monitor and manage room statuses</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? (
                <><Wifi className="w-3 h-3 mr-1" /> Live Updates</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
              )}
            </div>
            <Button onClick={fetchRoomData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Room Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2 text-blue-600" />
              Room Status Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.occupied}</div>
                <div className="text-sm text-gray-600">Occupied</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.vacant_clean}</div>
                <div className="text-sm text-gray-600">Vacant & Clean</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{summary.vacant_dirty}</div>
                <div className="text-sm text-gray-600">Needs Cleaning</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.maintenance}</div>
                <div className="text-sm text-gray-600">Maintenance</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{summary.out_of_order}</div>
                <div className="text-sm text-gray-600">Out of Order</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rooms Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Rooms Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {needsAttention.length > 0 ? (
                needsAttention.map((room) => (
                  <div key={room._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">Room {room.roomNumber}</p>
                      <p className="text-sm text-gray-600">{room.status}</p>
                    </div>
                    <Badge variant="destructive">Attention</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No rooms need attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Check-ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Recent Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData?.checkIns && activityData.checkIns.length > 0 ? (
                activityData.checkIns.map((checkIn) => (
                  <div key={checkIn._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium">{checkIn.bookingNumber}</p>
                      <p className="text-sm text-gray-600">
                        {checkIn.userId?.name || 'Guest'} - Room {checkIn.rooms?.map(r => r.roomId?.roomNumber).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Check-in: {new Date(checkIn.checkIn).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Checked In
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No recent check-ins to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Check-outs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Upcoming Check-outs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityData?.checkOuts && activityData.checkOuts.length > 0 ? (
                activityData.checkOuts.map((checkOut) => (
                  <div key={checkOut._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">{checkOut.bookingNumber}</p>
                      <p className="text-sm text-gray-600">
                        {checkOut.userId?.name || 'Guest'} - Room {checkOut.rooms?.map(r => r.roomId?.roomNumber).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Check-out: {new Date(checkOut.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-orange-100 text-orange-800">
                      {checkOut.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No upcoming check-outs to display</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
