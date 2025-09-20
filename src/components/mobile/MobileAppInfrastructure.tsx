import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Upload,
  Settings,
  Users,
  Bell,
  Shield,
  Zap,
  Globe,
  Database,
  Cloud,
  Lock,
  Wifi,
  Battery,
  Signal,
  Camera,
  Fingerprint,
  QrCode,
  CreditCard,
  MapPin,
  Calendar,
  MessageSquare,
  Star,
  Headphones,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Share2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface MobileApp {
  id: string;
  name: string;
  type: 'guest' | 'staff' | 'manager';
  platform: 'ios' | 'android' | 'pwa';
  version: string;
  status: 'development' | 'testing' | 'production' | 'deprecated';
  downloads: number;
  rating: number;
  features: string[];
  permissions: string[];
  lastUpdated: string;
  buildNumber: number;
  size: string;
}

interface DeviceMetrics {
  platform: string;
  devices: number;
  activeUsers: number;
  sessions: number;
  avgSessionTime: number;
  crashRate: number;
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
}

interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'guests' | 'staff' | 'managers';
  platform: 'all' | 'ios' | 'android';
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  deliveryRate: number;
  openRate: number;
}

interface AppFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  platforms: string[];
  isEnabled: boolean;
  usageStats: {
    users: number;
    sessions: number;
    avgTime: number;
  };
}

export const MobileAppInfrastructure: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileApps, setMobileApps] = useState<MobileApp[]>([]);
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics[]>([]);
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>([]);
  const [appFeatures, setAppFeatures] = useState<AppFeature[]>([]);
  const [selectedApp, setSelectedApp] = useState<MobileApp | null>(null);
  const [showNotificationComposer, setShowNotificationComposer] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    targetAudience: 'all' as const,
    platform: 'all' as const,
    scheduledTime: ''
  });

  const mockMobileApps: MobileApp[] = [
    {
      id: 'APP001',
      name: 'Hotel Guest App',
      type: 'guest',
      platform: 'ios',
      version: '2.1.5',
      status: 'production',
      downloads: 15847,
      rating: 4.6,
      features: ['Digital Key', 'Room Service', 'Concierge Chat', 'Check-in/out', 'Loyalty Points'],
      permissions: ['Camera', 'Location', 'Push Notifications', 'Bluetooth'],
      lastUpdated: '2024-11-15',
      buildNumber: 215,
      size: '45.2 MB'
    },
    {
      id: 'APP002',
      name: 'Hotel Guest App',
      type: 'guest',
      platform: 'android',
      version: '2.1.3',
      status: 'production',
      downloads: 12634,
      rating: 4.4,
      features: ['Digital Key', 'Room Service', 'Concierge Chat', 'Check-in/out', 'Loyalty Points'],
      permissions: ['Camera', 'Location', 'Push Notifications', 'Bluetooth'],
      lastUpdated: '2024-11-10',
      buildNumber: 213,
      size: '52.1 MB'
    },
    {
      id: 'APP003',
      name: 'Staff Mobile Portal',
      type: 'staff',
      platform: 'ios',
      version: '1.8.2',
      status: 'production',
      downloads: 892,
      rating: 4.8,
      features: ['Task Management', 'Guest Requests', 'Inventory', 'Communication'],
      permissions: ['Camera', 'Push Notifications', 'Microphone'],
      lastUpdated: '2024-11-20',
      buildNumber: 182,
      size: '38.5 MB'
    },
    {
      id: 'APP004',
      name: 'Manager Dashboard',
      type: 'manager',
      platform: 'pwa',
      version: '3.2.1',
      status: 'production',
      downloads: 234,
      rating: 4.9,
      features: ['Analytics', 'Reports', 'Staff Management', 'Revenue Tracking'],
      permissions: ['Push Notifications'],
      lastUpdated: '2024-11-25',
      buildNumber: 321,
      size: '12.8 MB'
    }
  ];

  const mockDeviceMetrics: DeviceMetrics[] = [
    {
      platform: 'iOS',
      devices: 8934,
      activeUsers: 6782,
      sessions: 24561,
      avgSessionTime: 8.5,
      crashRate: 0.12,
      retention: { day1: 85, day7: 68, day30: 45 }
    },
    {
      platform: 'Android',
      devices: 11247,
      activeUsers: 8456,
      sessions: 31248,
      avgSessionTime: 7.8,
      crashRate: 0.18,
      retention: { day1: 82, day7: 64, day30: 41 }
    },
    {
      platform: 'PWA',
      devices: 1234,
      activeUsers: 987,
      sessions: 3456,
      avgSessionTime: 12.3,
      crashRate: 0.05,
      retention: { day1: 78, day7: 62, day30: 48 }
    }
  ];

  const mockPushNotifications: PushNotification[] = [
    {
      id: 'PUSH001',
      title: 'Welcome to our hotel!',
      message: 'Complete your mobile check-in and skip the front desk line.',
      targetAudience: 'guests',
      platform: 'all',
      status: 'sent',
      deliveryRate: 94.2,
      openRate: 68.5
    },
    {
      id: 'PUSH002',
      title: 'New task assigned',
      message: 'Room 301 requires housekeeping attention.',
      targetAudience: 'staff',
      platform: 'all',
      status: 'sent',
      deliveryRate: 98.1,
      openRate: 87.3
    },
    {
      id: 'PUSH003',
      title: 'Special offer available',
      message: 'Upgrade to ocean view for just $30 more tonight!',
      targetAudience: 'guests',
      platform: 'all',
      scheduledTime: '2024-12-01T18:00:00',
      status: 'scheduled',
      deliveryRate: 0,
      openRate: 0
    }
  ];

  const mockAppFeatures: AppFeature[] = [
    {
      id: 'FEAT001',
      name: 'Digital Room Key',
      description: 'Unlock rooms using smartphone Bluetooth/NFC',
      category: 'Access Control',
      platforms: ['ios', 'android'],
      isEnabled: true,
      usageStats: { users: 12456, sessions: 45234, avgTime: 0.5 }
    },
    {
      id: 'FEAT002',
      name: 'Mobile Check-in',
      description: 'Complete check-in process without visiting front desk',
      category: 'Guest Services',
      platforms: ['ios', 'android', 'pwa'],
      isEnabled: true,
      usageStats: { users: 8934, sessions: 15678, avgTime: 3.2 }
    },
    {
      id: 'FEAT003',
      name: 'Room Service Ordering',
      description: 'Order food and services directly to room',
      category: 'F&B',
      platforms: ['ios', 'android'],
      isEnabled: true,
      usageStats: { users: 5647, sessions: 23456, avgTime: 4.8 }
    },
    {
      id: 'FEAT004',
      name: 'Contactless Payments',
      description: 'Pay for services using integrated payment methods',
      category: 'Payments',
      platforms: ['ios', 'android'],
      isEnabled: false,
      usageStats: { users: 0, sessions: 0, avgTime: 0 }
    }
  ];

  useEffect(() => {
    setMobileApps(mockMobileApps);
    setDeviceMetrics(mockDeviceMetrics);
    setPushNotifications(mockPushNotifications);
    setAppFeatures(mockAppFeatures);
  }, []);

  const sendPushNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Error",
        description: "Please fill in title and message",
        variant: "destructive"
      });
      return;
    }

    const notification: PushNotification = {
      id: `PUSH${String(pushNotifications.length + 1).padStart(3, '0')}`,
      title: newNotification.title,
      message: newNotification.message,
      targetAudience: newNotification.targetAudience,
      platform: newNotification.platform,
      scheduledTime: newNotification.scheduledTime || undefined,
      status: newNotification.scheduledTime ? 'scheduled' : 'sent',
      deliveryRate: newNotification.scheduledTime ? 0 : Math.random() * 10 + 90,
      openRate: newNotification.scheduledTime ? 0 : Math.random() * 30 + 40
    };

    setPushNotifications([...pushNotifications, notification]);
    setNewNotification({
      title: '',
      message: '',
      targetAudience: 'all',
      platform: 'all',
      scheduledTime: ''
    });
    setShowNotificationComposer(false);

    toast({
      title: "Push Notification",
      description: newNotification.scheduledTime ? "Notification scheduled successfully" : "Notification sent successfully"
    });
  };

  const toggleFeature = (featureId: string) => {
    setAppFeatures(appFeatures.map(feature => 
      feature.id === featureId 
        ? { ...feature, isEnabled: !feature.isEnabled }
        : feature
    ));

    const feature = appFeatures.find(f => f.id === featureId);
    toast({
      title: "Feature Updated",
      description: `${feature?.name} has been ${!feature?.isEnabled ? 'enabled' : 'disabled'}`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'default';
      case 'testing': return 'secondary';
      case 'development': return 'destructive';
      case 'deprecated': return 'outline';
      default: return 'secondary';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return Smartphone;
      case 'android': return Tablet;
      case 'pwa': return Monitor;
      default: return Smartphone;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-2xl font-bold">
                  {mobileApps.reduce((sum, app) => sum + app.downloads, 0).toLocaleString()}
                </p>
              </div>
              <Download className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold">
                  {deviceMetrics.reduce((sum, metric) => sum + metric.devices, 0).toLocaleString()}
                </p>
              </div>
              <Smartphone className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {(mobileApps.reduce((sum, app) => sum + app.rating, 0) / mobileApps.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crash Rate</p>
                <p className="text-2xl font-bold">
                  {(deviceMetrics.reduce((sum, metric) => sum + metric.crashRate, 0) / deviceMetrics.length).toFixed(2)}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deviceMetrics.map(metric => (
              <div key={metric.platform} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                    {metric.platform === 'iOS' && <Smartphone className="h-6 w-6" />}
                    {metric.platform === 'Android' && <Tablet className="h-6 w-6" />}
                    {metric.platform === 'PWA' && <Monitor className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="font-medium">{metric.platform}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.devices.toLocaleString()} devices
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-lg font-bold">{metric.activeUsers.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Active Users</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{metric.avgSessionTime}m</div>
                    <div className="text-xs text-muted-foreground">Avg Session</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{metric.crashRate}%</div>
                    <div className="text-xs text-muted-foreground">Crash Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{metric.retention.day7}%</div>
                    <div className="text-xs text-muted-foreground">7-day Retention</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border-l-4 border-l-green-500 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Hotel Guest App v2.1.5 deployed to iOS</div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border-l-4 border-l-blue-500 bg-blue-50">
              <Bell className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Push notification sent to 15,000 guests</div>
                <div className="text-xs text-muted-foreground">4 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border-l-4 border-l-yellow-500 bg-yellow-50">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <div className="text-sm font-medium">Increased crash rate detected on Android</div>
                <div className="text-xs text-muted-foreground">6 hours ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApps = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mobile Applications</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New App Version
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mobileApps.map(app => {
          const PlatformIcon = getPlatformIcon(app.platform);
          return (
            <Card key={app.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedApp(app)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <PlatformIcon className="mr-3 h-6 w-6" />
                    {app.name}
                    <Badge variant={getStatusColor(app.status) as any} className="ml-2">
                      {app.status}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{app.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  v{app.version} • {app.platform.toUpperCase()} • {app.size}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">{app.downloads.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Downloads</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{app.buildNumber}</div>
                      <div className="text-xs text-muted-foreground">Build</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">{app.features.length}</div>
                      <div className="text-xs text-muted-foreground">Features</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Key Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {app.features.slice(0, 3).map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {app.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{app.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Updated: {app.lastUpdated}</span>
                    <span className="capitalize">{app.type} App</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">App Features</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Feature
        </Button>
      </div>

      <div className="grid gap-4">
        {appFeatures.map(feature => (
          <Card key={feature.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">{feature.name}</h4>
                    <Badge variant="secondary">{feature.category}</Badge>
                    <div className="flex space-x-1">
                      {feature.platforms.map(platform => {
                        const Icon = getPlatformIcon(platform);
                        return (
                          <Icon key={platform} className="h-4 w-4 text-muted-foreground" />
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  {feature.isEnabled && (
                    <div className="flex space-x-6 mt-2 text-sm">
                      <span>{feature.usageStats.users.toLocaleString()} users</span>
                      <span>{feature.usageStats.sessions.toLocaleString()} sessions</span>
                      <span>{feature.usageStats.avgTime}min avg time</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={feature.isEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFeature(feature.id)}
                  >
                    {feature.isEnabled ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Disabled
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Push Notifications</h3>
        <Button onClick={() => setShowNotificationComposer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Send Notification
        </Button>
      </div>

      <div className="space-y-4">
        {pushNotifications.map(notification => (
          <Card key={notification.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    <Badge variant={
                      notification.status === 'sent' ? 'default' :
                      notification.status === 'scheduled' ? 'secondary' :
                      notification.status === 'failed' ? 'destructive' : 'outline'
                    }>
                      {notification.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Target: {notification.targetAudience}</span>
                    <span>Platform: {notification.platform}</span>
                    {notification.scheduledTime && (
                      <span>Scheduled: {new Date(notification.scheduledTime).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                {notification.status === 'sent' && (
                  <div className="text-right">
                    <div className="text-sm font-medium">{notification.deliveryRate.toFixed(1)}% delivered</div>
                    <div className="text-sm font-medium">{notification.openRate.toFixed(1)}% opened</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notification Composer Modal */}
      {showNotificationComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Send Push Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Notification title..."
                value={newNotification.title}
                onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
              />
              <Textarea
                placeholder="Notification message..."
                value={newNotification.message}
                onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
              />
              <Select
                value={newNotification.targetAudience}
                onValueChange={(value: any) => setNewNotification({...newNotification, targetAudience: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="guests">Guests Only</SelectItem>
                  <SelectItem value="staff">Staff Only</SelectItem>
                  <SelectItem value="managers">Managers Only</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newNotification.platform}
                onValueChange={(value: any) => setNewNotification({...newNotification, platform: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="ios">iOS Only</SelectItem>
                  <SelectItem value="android">Android Only</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                placeholder="Schedule time (optional)"
                value={newNotification.scheduledTime}
                onChange={(e) => setNewNotification({...newNotification, scheduledTime: e.target.value})}
              />
              <div className="flex space-x-2">
                <Button onClick={sendPushNotification} className="flex-1">
                  <Bell className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNotificationComposer(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'apps', name: 'Applications', icon: Smartphone },
    { id: 'features', name: 'Features', icon: Settings },
    { id: 'notifications', name: 'Push Notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Mobile App Infrastructure</h2>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Analytics
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            App Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex space-x-0 border-b">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'apps' && renderApps()}
      {activeTab === 'features' && renderFeatures()}
      {activeTab === 'notifications' && renderNotifications()}

      {/* App Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  {React.createElement(getPlatformIcon(selectedApp.platform), { className: "mr-3 h-6 w-6" })}
                  {selectedApp.name}
                </CardTitle>
                <Button variant="outline" onClick={() => setSelectedApp(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  <div className="text-lg font-semibold">{selectedApp.version}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Build</label>
                  <div className="text-lg font-semibold">{selectedApp.buildNumber}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Downloads</label>
                  <div className="text-lg font-semibold">{selectedApp.downloads.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Size</label>
                  <div className="text-lg font-semibold">{selectedApp.size}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Features</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedApp.features.map(feature => (
                    <Badge key={feature} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Permissions</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedApp.permissions.map(permission => (
                    <Badge key={permission} variant="outline">{permission}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Deploy Update
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};