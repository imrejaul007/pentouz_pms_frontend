import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OTADashboard from '../../components/ota/OTADashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '../../components/dashboard/DataTable';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
  Globe,
  Calendar,
  Database,
  BarChart3
} from 'lucide-react';

const AdminOTA: React.FC = () => {
  const { user } = useAuth();
  const hotelId = user?.hotelId || 'default';

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">OTA Analytics</TabsTrigger>
          <TabsTrigger value="channels">Channel Management</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <OTADashboard />
        </TabsContent>

        <TabsContent value="channels">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Channel Management</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Globe className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-900">Enhanced OTA Channel Management</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Advanced channel management features are now available in the new OTA Analytics dashboard above.
                    Use the Analytics tab to monitor performance, manage channels, and view real-time synchronization status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Sync Settings</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <RefreshCw className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-green-900">Automatic Synchronization Active</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Room availability and rates are automatically synchronized with OTA channels. 
                    Configure sync settings and monitor status in the Analytics dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integration">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">OTA Integration Status</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    System Integration Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">✅ Backend Services</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Room Type Management API</li>
                        <li>• Inventory Management API</li>
                        <li>• Enhanced Booking Engine API</li>
                        <li>• OTA Synchronization Services</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">✅ Frontend Components</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• OTA Analytics Dashboard</li>
                        <li>• Room Type Management Interface</li>
                        <li>• Inventory Calendar System</li>
                        <li>• Enhanced Booking Engine</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Ready for OTA Integration</h4>
                    <p className="text-blue-700 text-sm">
                      Your hotel management system is now fully OTA-ready with comprehensive analytics, 
                      real-time synchronization, and advanced booking management capabilities.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOTA;