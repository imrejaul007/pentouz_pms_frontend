import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { staffDashboardService, StaffInventoryData, StaffTodayData } from '../../services/staffDashboardService';
import toast from 'react-hot-toast';

export default function StaffInventory() {
  const [inventoryData, setInventoryData] = useState<StaffInventoryData | null>(null);
  const [todayData, setTodayData] = useState<StaffTodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchInventoryData();
  }, []);



  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [inventoryResponse, todayResponse] = await Promise.all([
        staffDashboardService.getInventorySummary(),
        staffDashboardService.getTodayOverview()
      ]);
      setInventoryData(inventoryResponse.data);
      setTodayData(todayResponse.data.today);
      console.log('Inventory data fetched:', inventoryResponse.data);
      console.log('Today data fetched:', todayResponse.data.today);
    } catch (err) {
      console.error('Failed to fetch inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectRoom = async (roomId: string, roomNumber: string) => {
    try {
      await staffDashboardService.markRoomInspected(roomId);
      toast.success(`Room ${roomNumber} marked as inspected!`);
      // Refresh the data to update the UI
      fetchInventoryData();
    } catch (err) {
      console.error('Failed to mark room as inspected:', err);
      toast.error('Failed to mark room as inspected');
    }
  };

  const handleOrderItem = async (itemId: string, itemName: string) => {
    try {
      await staffDashboardService.orderInventoryItem(itemId);
      toast.success(`Order placed for ${itemName}! Stock will be replenished.`);
      // Refresh the data to update the UI
      fetchInventoryData();
    } catch (err) {
      console.error('Failed to order item:', err);
      toast.error('Failed to place order');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !inventoryData || !todayData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load inventory data</h3>
          <Button onClick={fetchInventoryData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { lowStockAlert, inspectionsDue } = inventoryData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Monitor and manage hotel inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchInventoryData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockAlert.items.length > 0 ? (
                lowStockAlert.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Current: {item.currentStock} | Threshold: {item.threshold}
                      </p>
                      <p className="text-xs text-red-600">Category: {item.category}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleOrderItem(item._id, item.name)}
                    >
                      Order
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No low stock alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspections Due */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Inspections Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspectionsDue.rooms.length > 0 ? (
                inspectionsDue.rooms.map((room, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">Room {room.roomNumber}</p>
                      <p className="text-sm text-gray-600">
                        {room.daysPastDue} days past due
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleInspectRoom(room._id, room.roomNumber)}
                    >
                      Inspect
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No inspections due</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lowStockAlert.count === 0 ? '100%' : '85%'}
                </div>
                <div className="text-sm text-gray-600">Well Stocked</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {lowStockAlert.count}
                </div>
                <div className="text-sm text-gray-600">Low Stock Items</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {inspectionsDue.count}
                </div>
                <div className="text-sm text-gray-600">Inspections Due</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{todayData.pendingOrders}</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
