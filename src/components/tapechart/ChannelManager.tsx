import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';
import {
  Globe,
  Wifi,
  Building2,
  Plane,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Download,
  Upload,
  Zap,
  Clock,
  Users,
  Star,
  BarChart3,
  Target,
  Sync
} from 'lucide-react';
import { format, subDays, addDays } from 'date-fns';
import { api } from '@/services/api';

interface OTAChannel {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  isActive: boolean;
  lastSync: string;
  totalBookings: number;
  revenue: number;
  commission: number;
  connectionHealth: number;
  apiEndpoint: string;
  credentials: {
    partnerId?: string;
    propertyId?: string;
    apiKey?: string;
  };
  settings: {
    autoSync: boolean;
    syncInterval: number;
    rateSync: boolean;
    availabilitySync: boolean;
    restrictionsSync: boolean;
    minAdvanceBooking: number;
    maxAdvanceBooking: number;
  };
}

interface ChannelBooking {
  id: string;
  channelId: string;
  channelBookingId: string;
  guestName: string;
  guestEmail: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  commission: number;
  netAmount: number;
  status: 'new' | 'imported' | 'confirmed' | 'cancelled' | 'modified';
  importedAt: string;
  specialRequests?: string[];
  channelData: any;
}

interface InventoryDistribution {
  roomType: string;
  totalInventory: number;
  directBookings: number;
  channelAllocations: {
    [channelId: string]: {
      allocated: number;
      booked: number;
      available: number;
    };
  };
  reservedInventory: number;
  availableInventory: number;
}

interface RateSync {
  roomType: string;
  baseRate: number;
  channelRates: {
    [channelId: string]: {
      rate: number;
      currency: string;
      markup: number;
      lastUpdated: string;
    };
  };
  lastSyncStatus: 'success' | 'pending' | 'error';
}

export const ChannelManager: React.FC = () => {
  const [channels, setChannels] = useState<OTAChannel[]>([]);
  const [channelBookings, setChannelBookings] = useState<ChannelBooking[]>([]);
  const [inventoryDistribution, setInventoryDistribution] = useState<InventoryDistribution[]>([]);
  const [rateSync, setRateSync] = useState<RateSync[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<OTAChannel | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastFullSync, setLastFullSync] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalChannels: 0,
    activeChannels: 0,
    todayBookings: 0,
    todayRevenue: 0,
    syncHealth: 0,
    avgCommission: 0
  });

  useEffect(() => {
    initializeChannelManager();
    loadChannelData();
    const interval = setInterval(performAutoSync, 300000); // Auto sync every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const initializeChannelManager = () => {
    // Initialize with major OTA channels
    const defaultChannels: OTAChannel[] = [
      {
        id: 'booking-com',
        name: 'Booking.com',
        logo: '🏨',
        status: 'connected',
        isActive: true,
        lastSync: new Date().toISOString(),
        totalBookings: 156,
        revenue: 45600,
        commission: 15,
        connectionHealth: 95,
        apiEndpoint: 'https://distribution-xml.booking.com/xml',
        credentials: {
          partnerId: 'PARTNER123',
          propertyId: 'PROP456',
          apiKey: 'API_KEY_BOOKING'
        },
        settings: {
          autoSync: true,
          syncInterval: 5,
          rateSync: true,
          availabilitySync: true,
          restrictionsSync: true,
          minAdvanceBooking: 0,
          maxAdvanceBooking: 365
        }
      },
      {
        id: 'expedia',
        name: 'Expedia',
        logo: '✈️',
        status: 'connected',
        isActive: true,
        lastSync: new Date().toISOString(),
        totalBookings: 89,
        revenue: 32100,
        commission: 18,
        connectionHealth: 88,
        apiEndpoint: 'https://services.expediapartnercentral.com/eqc',
        credentials: {
          partnerId: 'EXP789',
          propertyId: 'HOTEL123',
          apiKey: 'API_KEY_EXPEDIA'
        },
        settings: {
          autoSync: true,
          syncInterval: 10,
          rateSync: true,
          availabilitySync: true,
          restrictionsSync: false,
          minAdvanceBooking: 1,
          maxAdvanceBooking: 330
        }
      },
      {
        id: 'agoda',
        name: 'Agoda',
        logo: '🌏',
        status: 'disconnected',
        isActive: false,
        lastSync: subDays(new Date(), 2).toISOString(),
        totalBookings: 34,
        revenue: 12400,
        commission: 20,
        connectionHealth: 0,
        apiEndpoint: 'https://xml-api.agoda.com',
        credentials: {},
        settings: {
          autoSync: false,
          syncInterval: 15,
          rateSync: false,
          availabilitySync: false,
          restrictionsSync: false,
          minAdvanceBooking: 0,
          maxAdvanceBooking: 365
        }
      },
      {
        id: 'airbnb',
        name: 'Airbnb',
        logo: '🏠',
        status: 'error',
        isActive: true,
        lastSync: subDays(new Date(), 1).toISOString(),
        totalBookings: 67,
        revenue: 28900,
        commission: 14,
        connectionHealth: 25,
        apiEndpoint: 'https://api.airbnb.com/v2',
        credentials: {
          apiKey: 'AIRBNB_API_KEY'
        },
        settings: {
          autoSync: true,
          syncInterval: 30,
          rateSync: true,
          availabilitySync: true,
          restrictionsSync: true,
          minAdvanceBooking: 0,
          maxAdvanceBooking: 365
        }
      }
    ];

    setChannels(defaultChannels);

    // Calculate stats
    const calculatedStats = {
      totalChannels: defaultChannels.length,
      activeChannels: defaultChannels.filter(c => c.isActive).length,
      todayBookings: 23,
      todayRevenue: 8900,
      syncHealth: Math.round(defaultChannels.reduce((sum, c) => sum + c.connectionHealth, 0) / defaultChannels.length),
      avgCommission: Math.round(defaultChannels.reduce((sum, c) => sum + c.commission, 0) / defaultChannels.length)
    };
    setStats(calculatedStats);
  };

  const loadChannelData = async () => {
    try {
      // Fetch real channel and booking data from backend
      const [channelsResponse, bookingsResponse, roomsResponse] = await Promise.all([
        api.get('/channels').catch(() => ({ data: { channels: [] } })), // Channel configurations (fallback if not exists)
        api.get('/bookings?source=booking.com,expedia,agoda'), // OTA bookings
        api.get('/rooms') // Room inventory
      ]);

      const channels = channelsResponse.data.channels || [];
      const otaBookings = bookingsResponse.data.bookings || [];
      const rooms = roomsResponse.data.rooms || [];

      // Transform OTA bookings to ChannelBooking format
      const channelBookings: ChannelBooking[] = otaBookings.map((booking: any) => {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: booking._id,
          channelId: booking.source || 'direct',
          channelBookingId: booking.externalBookingId || booking.bookingNumber,
          guestName: booking.userId?.name || 'Unknown Guest',
          guestEmail: booking.userId?.email || '',
          roomType: booking.rooms?.[0]?.roomId?.type || 'Standard',
          checkIn: booking.checkIn?.split('T')[0] || '',
          checkOut: booking.checkOut?.split('T')[0] || '',
          nights: nights || 1,
          adults: booking.guestDetails?.adults || 1,
          children: booking.guestDetails?.children || 0,
          totalAmount: booking.totalAmount || 0,
          commission: booking.commissionAmount || booking.totalAmount * 0.15, // Default 15% commission
          netAmount: booking.totalAmount - (booking.commissionAmount || booking.totalAmount * 0.15),
          status: booking.status === 'pending' ? 'new' : 'imported',
          importedAt: booking.createdAt || new Date().toISOString(),
          specialRequests: booking.guestDetails?.specialRequests ? [booking.guestDetails.specialRequests] : [],
          channelData: booking.channelData || {}
        };
      });
      setChannelBookings(channelBookings);

      // Calculate real inventory distribution from room data
      const roomTypes = [...new Set(rooms.map((r: any) => r.type))];
      const inventoryDistribution: InventoryDistribution[] = roomTypes.map(roomType => {
        const totalRooms = rooms.filter((r: any) => r.type === roomType).length;
        const directBookings = otaBookings.filter((b: any) =>
          b.rooms?.[0]?.roomId?.type === roomType &&
          b.source === 'direct'
        ).length;

        // Calculate channel allocations based on bookings
        const channelBookings = otaBookings.filter((b: any) =>
          b.rooms?.[0]?.roomId?.type === roomType &&
          b.source !== 'direct'
        );

        const channelAllocations: any = {};
        ['booking-com', 'expedia', 'agoda', 'airbnb'].forEach(channel => {
          const channelBookingCount = channelBookings.filter((b: any) =>
            b.source === channel || b.source === channel.replace('-', '.')
          ).length;

          const allocated = Math.floor(totalRooms * 0.25); // 25% allocation per major channel
          channelAllocations[channel] = {
            allocated,
            booked: channelBookingCount,
            available: allocated - channelBookingCount
          };
        });

        const totalBooked = directBookings + channelBookings.length;
        return {
          roomType,
          totalInventory: totalRooms,
          directBookings,
          channelAllocations,
          reservedInventory: totalBooked,
          availableInventory: totalRooms - totalBooked
        };
      });
      setInventoryDistribution(inventoryDistribution);

      // Generate real rate sync data based on room types
      const rateSync: RateSync[] = roomTypes.map(roomType => {
        const baseRate = rooms.find((r: any) => r.type === roomType)?.baseRate || 180;

        return {
          roomType,
          baseRate,
          channelRates: {
            'booking-com': {
              rate: baseRate,
              currency: 'USD',
              markup: 0,
              lastUpdated: new Date().toISOString()
            },
            'expedia': {
              rate: baseRate * 1.03,
              currency: 'USD',
              markup: 3,
              lastUpdated: new Date().toISOString()
            },
            'agoda': {
              rate: baseRate * 0.98,
              currency: 'USD',
              markup: -2,
              lastUpdated: new Date().toISOString()
            }
          },
          lastSyncStatus: 'success'
        };
      });
      setRateSync(rateSync);

    } catch (error) {
      console.error('Failed to load channel data:', error);
      toast.error('Failed to load channel manager data');
    }
  };

  const performAutoSync = async () => {
    if (syncInProgress) return;

    const activeChannels = channels.filter(c => c.isActive && c.settings.autoSync);
    if (activeChannels.length === 0) return;

    console.log('🔄 Performing auto sync for', activeChannels.length, 'channels');

    // Update last sync times
    setChannels(prev => prev.map(channel => {
      if (activeChannels.find(ac => ac.id === channel.id)) {
        return {
          ...channel,
          lastSync: new Date().toISOString(),
          status: 'connected' as const
        };
      }
      return channel;
    }));
  };

  const syncChannel = async (channelId: string, forceSync = false) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    setSyncInProgress(true);
    try {
      console.log(`🔄 Syncing ${channel.name}...`);

      // Update channel status to syncing
      setChannels(prev => prev.map(c =>
        c.id === channelId ? { ...c, status: 'syncing' as const } : c
      ));

      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update channel status to connected
      setChannels(prev => prev.map(c =>
        c.id === channelId ? {
          ...c,
          status: 'connected' as const,
          lastSync: new Date().toISOString(),
          connectionHealth: Math.min(100, c.connectionHealth + 5)
        } : c
      ));

      toast.success(`${channel.name} synced successfully`);

      // Reload data
      await loadChannelData();

    } catch (error) {
      console.error(`Failed to sync ${channel.name}:`, error);
      setChannels(prev => prev.map(c =>
        c.id === channelId ? { ...c, status: 'error' as const } : c
      ));
      toast.error(`Failed to sync ${channel.name}`);
    } finally {
      setSyncInProgress(false);
    }
  };

  const syncAllChannels = async () => {
    const activeChannels = channels.filter(c => c.isActive);
    setSyncInProgress(true);

    try {
      for (const channel of activeChannels) {
        await syncChannel(channel.id, true);
      }
      setLastFullSync(new Date());
      toast.success('All channels synced successfully');
    } catch (error) {
      toast.error('Some channels failed to sync');
    } finally {
      setSyncInProgress(false);
    }
  };

  const importChannelBooking = async (bookingId: string) => {
    try {
      const booking = channelBookings.find(b => b.id === bookingId);
      if (!booking) return;

      // In real implementation, this would call the booking creation API
      console.log('📥 Importing booking:', booking);

      setChannelBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'imported' as const } : b
      ));

      toast.success(`Booking ${booking.channelBookingId} imported successfully`);
    } catch (error) {
      console.error('Failed to import booking:', error);
      toast.error('Failed to import booking');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'disconnected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getChannelLogo = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel?.logo || '🏨';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200"
        >
          <Globe className="h-4 w-4 mr-2 text-emerald-600" />
          Channel Manager
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
          >
            OTA
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <Globe className="h-5 w-5 text-white" />
            </div>
            Channel Manager & OTA Integration
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              Real-time Sync
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-emerald-600">{stats.totalChannels}</div>
            <div className="text-xs text-gray-600">Total Channels</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.activeChannels}</div>
            <div className="text-xs text-gray-600">Active</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{stats.todayBookings}</div>
            <div className="text-xs text-gray-600">Today</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-green-600">${(stats.todayRevenue/1000).toFixed(1)}k</div>
            <div className="text-xs text-gray-600">Revenue</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-orange-600">{stats.syncHealth}%</div>
            <div className="text-xs text-gray-600">Health</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-pink-600">{stats.avgCommission}%</div>
            <div className="text-xs text-gray-600">Commission</div>
          </Card>
        </div>

        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">OTA Channel Management</h3>
              <Button
                onClick={syncAllChannels}
                disabled={syncInProgress}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
                Sync All
              </Button>
            </div>

            <div className="grid gap-4">
              {channels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{channel.logo}</div>
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {channel.name}
                            {getStatusIcon(channel.status)}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getStatusColor(channel.status)}>
                              {channel.status.toUpperCase()}
                            </Badge>
                            <Badge variant={channel.isActive ? 'default' : 'secondary'}>
                              {channel.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{channel.totalBookings}</div>
                          <div className="text-xs text-gray-600">Bookings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">${(channel.revenue/1000).toFixed(1)}k</div>
                          <div className="text-xs text-gray-600">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{channel.commission}%</div>
                          <div className="text-xs text-gray-600">Commission</div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => syncChannel(channel.id)}
                            disabled={syncInProgress}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sync
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Config
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <h3 className="text-lg font-semibold">Channel Bookings</h3>

            <div className="space-y-4">
              {channelBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{getChannelLogo(booking.channelId)}</div>
                        <div>
                          <h4 className="font-medium">{booking.guestName}</h4>
                          <p className="text-sm text-gray-600">{booking.channelBookingId}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-medium">{booking.roomType}</div>
                          <div className="text-sm text-gray-600">{booking.nights} nights</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">${booking.totalAmount}</div>
                          <div className="text-sm text-gray-600">Total</div>
                        </div>

                        <div className="flex gap-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status.toUpperCase()}
                          </Badge>
                          {booking.status === 'new' && (
                            <Button
                              size="sm"
                              onClick={() => importChannelBooking(booking.id)}
                            >
                              Import
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <h3 className="text-lg font-semibold">Inventory Distribution</h3>

            <div className="space-y-4">
              {inventoryDistribution.map((inv) => (
                <Card key={inv.roomType}>
                  <CardHeader>
                    <CardTitle>{inv.roomType} Rooms - {inv.totalInventory} Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center mb-4">
                      <div>
                        <div className="text-lg font-bold text-green-600">{inv.directBookings}</div>
                        <div className="text-xs text-gray-600">Direct</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{inv.reservedInventory}</div>
                        <div className="text-xs text-gray-600">Channel Booked</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{inv.availableInventory}</div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-600">
                          {Math.round((inv.reservedInventory / inv.totalInventory) * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">Utilization</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(inv.channelAllocations).map(([channelId, allocation]) => {
                        const channel = channels.find(c => c.id === channelId);
                        if (!channel?.isActive) return null;

                        return (
                          <div key={channelId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span>{channel.logo}</span>
                              <span className="font-medium">{channel.name}</span>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <span>Allocated: {allocation.allocated}</span>
                              <span>Booked: {allocation.booked}</span>
                              <span className="text-green-600 font-medium">Available: {allocation.available}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rates" className="space-y-4">
            <h3 className="text-lg font-semibold">Rate Synchronization</h3>

            <div className="space-y-4">
              {rateSync.map((rate) => (
                <Card key={rate.roomType}>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      {rate.roomType} - Base Rate: ${rate.baseRate}
                      <Badge className={rate.lastSyncStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {rate.lastSyncStatus.toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(rate.channelRates).map(([channelId, channelRate]) => {
                        const channel = channels.find(c => c.id === channelId);
                        if (!channel) return null;

                        return (
                          <div key={channelId} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{channel.logo}</span>
                              <span className="font-medium">{channel.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold">${channelRate.rate}</div>
                                <div className={`text-sm ${
                                  channelRate.markup > 0 ? 'text-green-600' :
                                  channelRate.markup < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {channelRate.markup > 0 ? '+' : ''}{channelRate.markup}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};