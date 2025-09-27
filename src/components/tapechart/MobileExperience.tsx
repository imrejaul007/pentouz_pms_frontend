import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/utils/toast';
import {
  Smartphone, Tablet, QrCode, Camera, MapPin, Clock,
  Wifi, Battery, Signal, CheckCircle, User, Bed,
  Settings, Scan, Hand, Zap, Bell, RefreshCw
} from 'lucide-react';

// Mobile Experience Interfaces
interface MobileDevice {
  id: string;
  name: string;
  type: 'smartphone' | 'tablet';
  user: string;
  location: string;
  battery: number;
  signal: number;
  status: 'online' | 'offline' | 'syncing';
  lastSync: string;
  features: {
    qrScanning: boolean;
    photoCapture: boolean;
    offlineMode: boolean;
    voiceCommands: boolean;
  };
}

interface QRScanResult {
  id: string;
  roomNumber: string;
  scanTime: string;
  staff: string;
  action: 'check_status' | 'clean_complete' | 'maintenance_request';
  status: 'success' | 'error';
}

interface TouchGesture {
  id: string;
  gesture: 'swipe_left' | 'swipe_right' | 'tap' | 'long_press';
  action: string;
  description: string;
  enabled: boolean;
}

interface MobileExperienceProps {}

export const MobileExperience: React.FC<MobileExperienceProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('devices');
  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>([]);
  const [qrScans, setQrScans] = useState<QRScanResult[]>([]);
  const [touchGestures, setTouchGestures] = useState<TouchGesture[]>([]);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Generate mock data for mobile features
  useEffect(() => {
    generateMockDevices();
    generateMockQRScans();
    generateMockTouchGestures();
  }, []);

  const generateMockDevices = () => {
    const devices: MobileDevice[] = [
      {
        id: 'dev-001',
        name: 'iPhone 14 Pro',
        type: 'smartphone',
        user: 'Sarah (Housekeeping)',
        location: 'Floor 3',
        battery: 85,
        signal: 92,
        status: 'online',
        lastSync: new Date().toISOString(),
        features: {
          qrScanning: true,
          photoCapture: true,
          offlineMode: true,
          voiceCommands: false
        }
      },
      {
        id: 'dev-002',
        name: 'iPad Air',
        type: 'tablet',
        user: 'Mike (Maintenance)',
        location: 'Floor 1',
        battery: 68,
        signal: 87,
        status: 'syncing',
        lastSync: new Date(Date.now() - 300000).toISOString(),
        features: {
          qrScanning: true,
          photoCapture: true,
          offlineMode: true,
          voiceCommands: true
        }
      },
      {
        id: 'dev-003',
        name: 'Samsung Galaxy',
        type: 'smartphone',
        user: 'Lisa (Front Desk)',
        location: 'Lobby',
        battery: 45,
        signal: 95,
        status: 'online',
        lastSync: new Date(Date.now() - 60000).toISOString(),
        features: {
          qrScanning: true,
          photoCapture: false,
          offlineMode: true,
          voiceCommands: true
        }
      }
    ];
    setMobileDevices(devices);
  };

  const generateMockQRScans = () => {
    const scans: QRScanResult[] = [
      {
        id: 'scan-001',
        roomNumber: '301',
        scanTime: new Date().toISOString(),
        staff: 'Sarah',
        action: 'clean_complete',
        status: 'success'
      },
      {
        id: 'scan-002',
        roomNumber: '205',
        scanTime: new Date(Date.now() - 180000).toISOString(),
        staff: 'Mike',
        action: 'maintenance_request',
        status: 'success'
      },
      {
        id: 'scan-003',
        roomNumber: '112',
        scanTime: new Date(Date.now() - 360000).toISOString(),
        staff: 'Lisa',
        action: 'check_status',
        status: 'error'
      }
    ];
    setQrScans(scans);
  };

  const generateMockTouchGestures = () => {
    const gestures: TouchGesture[] = [
      {
        id: 'gesture-1',
        gesture: 'swipe_right',
        action: 'Mark room as clean',
        description: 'Swipe right on room to mark as cleaned',
        enabled: true
      },
      {
        id: 'gesture-2',
        gesture: 'swipe_left',
        action: 'Report maintenance issue',
        description: 'Swipe left to report maintenance',
        enabled: true
      },
      {
        id: 'gesture-3',
        gesture: 'long_press',
        action: 'Open room details',
        description: 'Long press for detailed room information',
        enabled: true
      },
      {
        id: 'gesture-4',
        gesture: 'tap',
        action: 'Quick check-in/out',
        description: 'Double tap for guest check-in/out',
        enabled: false
      }
    ];
    setTouchGestures(gestures);
  };

  const handleSyncAllDevices = async () => {
    setLoading(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update all devices to syncing status
      setMobileDevices(prev => prev.map(device => ({
        ...device,
        status: 'syncing'
      })));

      // After sync, mark as online
      setTimeout(() => {
        setMobileDevices(prev => prev.map(device => ({
          ...device,
          status: 'online',
          lastSync: new Date().toISOString()
        })));
        toast.success('All mobile devices synchronized successfully');
      }, 1500);

    } catch (error) {
      toast.error('Failed to sync mobile devices');
    } finally {
      setLoading(false);
    }
  };

  const toggleGesture = (gestureId: string) => {
    setTouchGestures(prev => prev.map(gesture =>
      gesture.id === gestureId ? { ...gesture, enabled: !gesture.enabled } : gesture
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'offline': return 'text-red-600 bg-red-50';
      case 'syncing': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return 'text-green-600';
    if (battery > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalBars = (signal: number) => {
    const bars = Math.ceil(signal / 25);
    return Array.from({length: 4}, (_, i) => (
      <div
        key={i}
        className={`w-1 rounded-sm ${i < bars ? 'bg-blue-500' : 'bg-gray-300'}`}
        style={{height: `${(i + 1) * 3}px`}}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 hover:from-cyan-100 hover:to-blue-100 transition-all duration-200"
        >
          <Smartphone className="h-4 w-4 mr-2 text-cyan-600" />
          Mobile Hub
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0"
          >
            Touch
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            Mobile Experience Hub
            <Badge className="bg-gradient-to-r from-green-500 to-cyan-500 text-white">
              Touch Optimized
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Mobile-first workflows with QR code scanning, touch gestures, and offline capabilities
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Tablet className="h-4 w-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scanning
            </TabsTrigger>
            <TabsTrigger value="gestures" className="flex items-center gap-2">
              <Hand className="h-4 w-4" />
              Touch Control
            </TabsTrigger>
            <TabsTrigger value="offline" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Offline Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connected Mobile Devices</h3>
              <Button
                onClick={handleSyncAllDevices}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync All
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              {mobileDevices.map((device) => (
                <Card key={device.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {device.type === 'smartphone' ? (
                            <Smartphone className="h-6 w-6 text-blue-600" />
                          ) : (
                            <Tablet className="h-6 w-6 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{device.name}</h4>
                          <p className="text-sm text-gray-600">{device.user}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={getStatusColor(device.status)}>
                              {device.status.toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{device.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Battery */}
                        <div className="flex items-center gap-1">
                          <Battery className={`h-4 w-4 ${getBatteryColor(device.battery)}`} />
                          <span className={`text-sm font-medium ${getBatteryColor(device.battery)}`}>
                            {device.battery}%
                          </span>
                        </div>

                        {/* Signal */}
                        <div className="flex items-center gap-1">
                          <div className="flex items-end gap-0.5">
                            {getSignalBars(device.signal)}
                          </div>
                          <span className="text-sm text-gray-600">{device.signal}%</span>
                        </div>

                        {/* Features */}
                        <div className="flex gap-2">
                          {device.features.qrScanning && (
                            <QrCode className="h-4 w-4 text-green-600" title="QR Scanning" />
                          )}
                          {device.features.photoCapture && (
                            <Camera className="h-4 w-4 text-blue-600" title="Photo Capture" />
                          )}
                          {device.features.offlineMode && (
                            <Wifi className="h-4 w-4 text-purple-600" title="Offline Mode" />
                          )}
                          {device.features.voiceCommands && (
                            <Zap className="h-4 w-4 text-orange-600" title="Voice Commands" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Last sync: {new Date(device.lastSync).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="qr" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">QR Code Scanning Activity</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">
                  {qrScans.filter(s => s.status === 'success').length} Successful
                </Badge>
                <Badge className="bg-red-100 text-red-700">
                  {qrScans.filter(s => s.status === 'error').length} Failed
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* QR Scan Instructions */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-blue-600" />
                    How to Use QR Scanning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Room Identification</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Scan QR code on room door to instantly identify and update room status
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Quick Actions</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Mark rooms as clean, report maintenance issues, or check guest status
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Photo Documentation</span>
                    </div>
                    <p className="text-sm text-purple-800">
                      Capture photos of room conditions and attach to maintenance reports
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Scans */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-medium">Recent QR Scans</h4>
                {qrScans.map((scan) => (
                  <Card key={scan.id} className="transition-all hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            scan.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <Bed className={`h-4 w-4 ${
                              scan.status === 'success' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <h5 className="font-medium">Room {scan.roomNumber}</h5>
                            <p className="text-sm text-gray-600">by {scan.staff}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge className={scan.status === 'success' ?
                            'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }>
                            {scan.action.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(scan.scanTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gestures" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Touch Gesture Controls</h3>
              <Badge className="bg-blue-100 text-blue-700">
                {touchGestures.filter(g => g.enabled).length} Active Gestures
              </Badge>
            </div>

            <div className="grid gap-4">
              {touchGestures.map((gesture) => (
                <Card key={gesture.id} className={`transition-all ${
                  gesture.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Hand className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{gesture.action}</h4>
                          <p className="text-sm text-gray-600">{gesture.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {gesture.gesture.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <Switch
                        checked={gesture.enabled}
                        onCheckedChange={() => toggleGesture(gesture.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-900">Training Tip</span>
                </div>
                <p className="text-sm text-orange-800">
                  New staff members can enable "Gesture Guide" in settings to see visual hints for touch interactions during their first week.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offline" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Offline Mode Configuration</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Enable Offline Mode</span>
                <Switch
                  checked={offlineModeEnabled}
                  onCheckedChange={setOfflineModeEnabled}
                />
              </div>
            </div>

            {offlineModeEnabled && (
              <div className="grid gap-6">
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Offline Capabilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Room status updates (cached locally)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">QR code scanning and identification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Photo capture for maintenance reports</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Guest check-in/out processing</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Sync Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last sync:</span>
                          <span className="font-medium">2 minutes ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next sync:</span>
                          <span className="font-medium">3 minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sync interval:</span>
                          <span className="font-medium">Every 5 minutes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Settings className="h-4 w-4 text-purple-600" />
                        Storage Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cache size:</span>
                          <span className="font-medium">12.4 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Photos stored:</span>
                          <span className="font-medium">8 files</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending sync:</span>
                          <span className="font-medium">3 items</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {!offlineModeEnabled && (
              <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                <CardContent className="p-6 text-center">
                  <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-700 mb-2">Offline Mode Disabled</h4>
                  <p className="text-sm text-gray-600">
                    Enable offline mode to allow mobile devices to work without internet connectivity.
                    This is essential for housekeeping and maintenance staff working in areas with poor signal.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};