import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Calendar, Download, RefreshCw, AlertTriangle, Receipt, Wifi, WifiOff } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { staffDashboardService, StaffTodayData, StaffActivityData } from '../../services/staffDashboardService';
import { useRealTime } from '../../services/realTimeService';
import { reportsService, CheckoutInventoryData } from '../../services/reportsService';
import { formatCurrency } from '../../utils/formatters';

export default function StaffReports() {
  const [todayData, setTodayData] = useState<StaffTodayData | null>(null);
  const [activityData, setActivityData] = useState<StaffActivityData | null>(null);
  const [checkoutInventoryData, setCheckoutInventoryData] = useState<CheckoutInventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time connection
  const { connectionState, connect, disconnect, on, off, isConnected } = useRealTime();

  useEffect(() => {
    fetchTodayData();
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
    
    const handleCheckoutInventoryUpdate = (data: any) => {
      console.log('Real-time checkout inventory update:', data);
      fetchCheckoutInventoryData();
    };
    
    const handleReportsUpdate = (data: any) => {
      console.log('Real-time reports update:', data);
      fetchTodayData();
    };
    
    on('checkout-inventory:created', handleCheckoutInventoryUpdate);
    on('checkout-inventory:completed', handleCheckoutInventoryUpdate);
    on('checkout-inventory:payment_processed', handleCheckoutInventoryUpdate);
    on('reports:updated', handleReportsUpdate);
    
    return () => {
      off('checkout-inventory:created', handleCheckoutInventoryUpdate);
      off('checkout-inventory:completed', handleCheckoutInventoryUpdate);
      off('checkout-inventory:payment_processed', handleCheckoutInventoryUpdate);
      off('reports:updated', handleReportsUpdate);
    };
  }, [isConnected, on, off]);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [todayResponse, activityResponse] = await Promise.all([
        staffDashboardService.getTodayOverview(),
        staffDashboardService.getRecentActivity()
      ]);
      console.log('Staff Reports Debug - Today Response:', todayResponse);
      console.log('Staff Reports Debug - Activity Response:', activityResponse);
      setTodayData(todayResponse.data.today);
      setActivityData(activityResponse.data);
      
      // Also fetch checkout inventory data
      await fetchCheckoutInventoryData();
    } catch (err) {
      console.error('Failed to fetch today data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckoutInventoryData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
      
      const checkoutResponse = await reportsService.getCheckoutInventoryReport({
        startDate: startOfDay,
        endDate: endOfDay,
        groupBy: 'day'
      });
      
      console.log('Checkout Inventory Report:', checkoutResponse);
      setCheckoutInventoryData(checkoutResponse);
    } catch (err) {
      console.error('Failed to fetch checkout inventory data:', err);
      // Don't set error for checkout data, as other data might still be valid
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !todayData || !activityData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load report data</h3>
          <Button onClick={fetchTodayData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to format time
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">View performance metrics and generate reports</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Real-time connection status */}
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
          
          <Button
            onClick={fetchTodayData}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/v1/test/create-checked-in-booking', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                const data = await response.json();
                if (data.status === 'success') {
                  const steps = data.data.nextSteps.join('\n');
                  alert(`✅ ${data.message}\n\n📋 Next Steps:\n${steps}\n\n🏨 Created:\n- Room ${data.data.roomNumber} (${data.data.roomType || 'Double'})\n- Guest: ${data.data.guest}\n- Booking: ${data.data.bookingNumber}\n- Status: ${data.data.status}`);
                  fetchTodayData(); // Refresh the data
                } else {
                  alert('❌ Error: ' + data.message);
                }
              } catch (error) {
                alert('Error creating test booking: ' + error.message);
              }
            }}
            variant="secondary"
            className="flex items-center"
          >
            Create Test Booking
          </Button>
          <Button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/v1/test/debug-checkins', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                const data = await response.json();
                console.log('Check-in Debug:', data);
                alert(`Check-ins Debug:\nCount: ${data.data.todayCheckInsCount}\nBookings: ${data.data.actualTodayBookings.length}\n\nCheck console for details`);
              } catch (error) {
                alert('Debug error: ' + error.message);
              }
            }}
            variant="outline"
            size="sm"
          >
            Debug Check-ins
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{todayData.checkIns}</div>
                  <div className="text-sm text-gray-600">Check-ins</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{todayData.checkOuts}</div>
                  <div className="text-sm text-gray-600">Check-outs</div>
                  {todayData.checkOuts === 0 && (
                    <div className="text-xs text-red-500 mt-1">
                      ⚠️ No checked-in bookings available for checkout
                    </div>
                  )}
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{todayData.pendingHousekeeping + todayData.pendingMaintenance}</div>
                  <div className="text-sm text-gray-600">Pending Tasks</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{todayData.pendingGuestServices}</div>
                  <div className="text-sm text-gray-600">Guest Services</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Occupancy Rate</p>
                  <p className="text-sm text-gray-600">Current</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{todayData.occupancyRate}%</div>
                  <Badge variant="outline" className="text-green-700">
                    {todayData.occupancyRate >= 70 ? 'High' : todayData.occupancyRate >= 40 ? 'Good' : 'Low'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Pending Tasks</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {todayData.pendingHousekeeping + todayData.pendingMaintenance}
                  </div>
                  <Badge variant="outline" className="text-blue-700">
                    {(todayData.pendingHousekeeping + todayData.pendingMaintenance) <= 5 ? 'Low' : 
                     (todayData.pendingHousekeeping + todayData.pendingMaintenance) <= 15 ? 'Normal' : 'High'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Guest Services</p>
                  <p className="text-sm text-gray-600">Active requests</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{todayData.pendingGuestServices}</div>
                  <Badge variant="outline" className="text-purple-700">
                    {todayData.pendingGuestServices <= 3 ? 'Low' : 
                     todayData.pendingGuestServices <= 8 ? 'Normal' : 'High'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Inventory Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-orange-600" />
              Checkout Inventory Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkoutInventoryData ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Checkouts</p>
                      <p className="text-sm text-gray-600">Today</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{checkoutInventoryData.summary.totalCheckouts}</div>
                      <Badge variant="outline" className="text-orange-700">
                        {checkoutInventoryData.summary.totalCheckouts >= 5 ? 'High' : 
                         checkoutInventoryData.summary.totalCheckouts >= 2 ? 'Normal' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Value</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(checkoutInventoryData.summary.totalValue)}</div>
                      <Badge variant="outline" className="text-green-700">Revenue</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Average Value</p>
                      <p className="text-sm text-gray-600">Per checkout</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(checkoutInventoryData.summary.averageValue)}</div>
                      <Badge variant="outline" className="text-blue-700">
                        {checkoutInventoryData.summary.averageValue >= 500 ? 'High' : 
                         checkoutInventoryData.summary.averageValue >= 200 ? 'Normal' : 'Low'}
                      </Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No checkout data available today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
              Quick Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Daily Task Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Housekeeping Summary
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Maintenance Log
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Guest Services Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Checkout Inventory Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Check-ins */}
              {activityData?.checkIns?.slice(0, 2).map((checkin) => (
                <div key={checkin._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium">Check-in: Room {checkin.rooms?.[0]?.roomId?.roomNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Guest: {checkin.userId?.name || 'N/A'}</p>
                    <p className="text-xs text-green-600">{formatTimeAgo(checkin.checkIn)}</p>
                  </div>
                  <Badge variant="outline" className="text-green-700">Completed</Badge>
                </div>
              )) || []}
              
              {/* Recent Check-outs */}
              {activityData?.checkOuts?.slice(0, 2).map((checkout) => (
                <div key={checkout._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium">Check-out: Room {checkout.roomId?.roomNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Guest: {checkout.bookingId?.userId?.name || 'N/A'}</p>
                    <p className="text-xs text-blue-600">{formatTimeAgo(checkout.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="text-blue-700">Completed</Badge>
                </div>
              )) || []}
              
              {/* Recent Guest Services */}
              {activityData?.guestServices?.slice(0, 2).map((service) => (
                <div key={service._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  service.status === 'completed' ? 'bg-green-50 border-green-200' : 
                  service.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div>
                    <p className="font-medium">{service.title} - Room {service.bookingId?.rooms?.[0]?.roomId?.roomNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Requested by {service.userId?.name || 'N/A'}</p>
                    <p className={`text-xs ${
                      service.status === 'completed' ? 'text-green-600' : 
                      service.status === 'in_progress' ? 'text-yellow-600' : 
                      'text-gray-600'
                    }`}>{formatTimeAgo(service.createdAt)}</p>
                  </div>
                  <Badge variant={service.status === 'completed' ? 'outline' : 'secondary'} 
                         className={service.status === 'completed' ? 'text-green-700' : 
                                   service.status === 'in_progress' ? 'text-yellow-700' : 
                                   'text-gray-700'}>
                    {service.status === 'completed' ? 'Completed' : 
                     service.status === 'in_progress' ? 'In Progress' : 
                     'Pending'}
                  </Badge>
                </div>
              )) || []}
              
              {/* Show message if no recent activities */}
              {(!activityData?.checkIns?.length && 
                !activityData?.checkOuts?.length && 
                !activityData?.guestServices?.length) && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-8 w-8 mb-3 text-gray-400" />
                  <p>No recent activities found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
