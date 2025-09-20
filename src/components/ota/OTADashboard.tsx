import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { RefreshButton } from '@/components/dashboard/RefreshButton';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { toast } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  Calendar,
  Globe,
  Star,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Line, Bar, Doughnut, Area } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface OTAChannel {
  id: string;
  name: string;
  type: 'booking.com' | 'expedia' | 'airbnb' | 'hotels.com' | 'agoda' | 'trivago';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  connectivity: number;
  commission: number;
  bookings: number;
  revenue: number;
  conversion: number;
  avgDailyRate: number;
  occupancyRate: number;
  cancellationRate: number;
  reviewScore: number;
  totalReviews: number;
}

interface OTAMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageCommission: number;
  totalChannels: number;
  activeChannels: number;
  avgConversion: number;
  avgReviewScore: number;
  syncErrors: number;
  lastUpdated: string;
  periodComparison: {
    revenue: { value: number; direction: 'up' | 'down' | 'neutral' };
    bookings: { value: number; direction: 'up' | 'down' | 'neutral' };
    conversion: { value: number; direction: 'up' | 'down' | 'neutral' };
    channels: { value: number; direction: 'up' | 'down' | 'neutral' };
  };
}

interface BookingTrend {
  date: string;
  'booking.com': number;
  'expedia': number;
  'airbnb': number;
  'hotels.com': number;
  total: number;
}

interface DeviceAnalytics {
  desktop: number;
  mobile: number;
  tablet: number;
}

interface ChannelPerformance {
  channelId: string;
  channelName: string;
  impressions: number;
  clicks: number;
  bookings: number;
  revenue: number;
  commission: number;
  ctr: number;
  conversionRate: number;
  revenuePerClick: number;
}

const OTADashboard: React.FC = () => {
  const { user } = useAuth();
  const hotelId = user?.hotelId || 'default';

  // State
  const [dateRange, setDateRange] = useState({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [otaChannels, setOtaChannels] = useState<OTAChannel[]>([]);
  const [otaMetrics, setOtaMetrics] = useState<OTAMetrics | null>(null);
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics | null>(null);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, hotelId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, these would be API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock OTA Channels
      const mockChannels: OTAChannel[] = [
        {
          id: '1',
          name: 'Booking.com',
          type: 'booking.com',
          status: 'connected',
          lastSync: new Date().toISOString(),
          connectivity: 98,
          commission: 15,
          bookings: 245,
          revenue: 1235000,
          conversion: 3.2,
          avgDailyRate: 5040,
          occupancyRate: 78,
          cancellationRate: 12,
          reviewScore: 8.7,
          totalReviews: 1247
        },
        {
          id: '2',
          name: 'Expedia',
          type: 'expedia',
          status: 'connected',
          lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          connectivity: 94,
          commission: 18,
          bookings: 156,
          revenue: 856000,
          conversion: 2.8,
          avgDailyRate: 5490,
          occupancyRate: 65,
          cancellationRate: 15,
          reviewScore: 8.3,
          totalReviews: 892
        },
        {
          id: '3',
          name: 'Airbnb',
          type: 'airbnb',
          status: 'syncing',
          lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          connectivity: 89,
          commission: 3,
          bookings: 89,
          revenue: 445000,
          conversion: 4.1,
          avgDailyRate: 5000,
          occupancyRate: 82,
          cancellationRate: 8,
          reviewScore: 4.6,
          totalReviews: 156
        },
        {
          id: '4',
          name: 'Hotels.com',
          type: 'hotels.com',
          status: 'error',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          connectivity: 67,
          commission: 16,
          bookings: 67,
          revenue: 334000,
          conversion: 2.3,
          avgDailyRate: 4985,
          occupancyRate: 58,
          cancellationRate: 18,
          reviewScore: 8.1,
          totalReviews: 423
        }
      ];

      // Mock metrics
      const mockMetrics: OTAMetrics = {
        totalRevenue: mockChannels.reduce((sum, ch) => sum + ch.revenue, 0),
        totalBookings: mockChannels.reduce((sum, ch) => sum + ch.bookings, 0),
        averageCommission: mockChannels.reduce((sum, ch) => sum + ch.commission, 0) / mockChannels.length,
        totalChannels: mockChannels.length,
        activeChannels: mockChannels.filter(ch => ch.status === 'connected').length,
        avgConversion: mockChannels.reduce((sum, ch) => sum + ch.conversion, 0) / mockChannels.length,
        avgReviewScore: mockChannels.reduce((sum, ch) => sum + ch.reviewScore, 0) / mockChannels.length,
        syncErrors: mockChannels.filter(ch => ch.status === 'error').length,
        lastUpdated: new Date().toISOString(),
        periodComparison: {
          revenue: { value: 12.5, direction: 'up' },
          bookings: { value: 8.3, direction: 'up' },
          conversion: { value: 2.1, direction: 'down' },
          channels: { value: 0, direction: 'neutral' }
        }
      };

      // Mock booking trends
      const mockBookingTrends: BookingTrend[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        mockBookingTrends.push({
          date,
          'booking.com': Math.floor(Math.random() * 15) + 5,
          'expedia': Math.floor(Math.random() * 10) + 3,
          'airbnb': Math.floor(Math.random() * 8) + 2,
          'hotels.com': Math.floor(Math.random() * 6) + 1,
          total: 0 // Will be calculated
        });
      }
      
      // Calculate totals
      mockBookingTrends.forEach(trend => {
        trend.total = trend['booking.com'] + trend['expedia'] + trend['airbnb'] + trend['hotels.com'];
      });

      // Mock device analytics
      const mockDeviceAnalytics: DeviceAnalytics = {
        desktop: 45,
        mobile: 40,
        tablet: 15
      };

      // Mock channel performance
      const mockChannelPerformance: ChannelPerformance[] = mockChannels.map(channel => ({
        channelId: channel.id,
        channelName: channel.name,
        impressions: Math.floor(Math.random() * 50000) + 10000,
        clicks: Math.floor(Math.random() * 2000) + 500,
        bookings: channel.bookings,
        revenue: channel.revenue,
        commission: channel.commission,
        ctr: Math.round((Math.random() * 5 + 2) * 100) / 100,
        conversionRate: channel.conversion,
        revenuePerClick: Math.round(channel.revenue / (Math.floor(Math.random() * 2000) + 500))
      }));

      setOtaChannels(mockChannels);
      setOtaMetrics(mockMetrics);
      setBookingTrends(mockBookingTrends);
      setDeviceAnalytics(mockDeviceAnalytics);
      setChannelPerformance(mockChannelPerformance);

    } catch (error) {
      toast.error('Failed to load OTA dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard data refreshed');
  };

  const handleExportData = () => {
    // Mock export functionality
    toast.success('Exporting OTA analytics data...');
  };

  const getChannelStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChannelStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'syncing':
        return 'blue';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Chart configurations
  const bookingTrendChartData = {
    labels: bookingTrends.map(trend => format(new Date(trend.date), 'MMM dd')),
    datasets: [
      {
        label: 'Booking.com',
        data: bookingTrends.map(trend => trend['booking.com']),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Expedia',
        data: bookingTrends.map(trend => trend['expedia']),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Airbnb',
        data: bookingTrends.map(trend => trend['airbnb']),
        borderColor: 'rgb(245, 101, 101)',
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Hotels.com',
        data: bookingTrends.map(trend => trend['hotels.com']),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const deviceAnalyticsChartData = deviceAnalytics ? {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [deviceAnalytics.desktop, deviceAnalytics.mobile, deviceAnalytics.tablet],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 101, 101, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 101, 101)'
      ],
      borderWidth: 2
    }]
  } : null;

  const revenueByChannelData = {
    labels: otaChannels.map(ch => ch.name),
    datasets: [{
      label: 'Revenue',
      data: otaChannels.map(ch => ch.revenue / 1000), // Convert to thousands
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 101, 101, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 191, 36, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 101, 101)',
        'rgb(168, 85, 247)',
        'rgb(251, 191, 36)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading && !otaMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading OTA dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">OTA Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize your online travel agency performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            maxDate={new Date()}
          />
          <RefreshButton
            onRefresh={handleRefresh}
            loading={refreshing}
          />
          <ExportButton
            onExport={handleExportData}
            filename={`ota-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`}
          />
        </div>
      </div>

      {/* Key Metrics */}
      {otaMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <MetricCard
            title="Total Revenue"
            value={otaMetrics.totalRevenue}
            type="currency"
            trend={{
              value: otaMetrics.periodComparison.revenue.value,
              direction: otaMetrics.periodComparison.revenue.direction,
              label: 'vs last period'
            }}
            icon={<IndianRupee className="w-5 h-5" />}
            color="green"
            loading={loading}
          />
          
          <MetricCard
            title="Total Bookings"
            value={otaMetrics.totalBookings}
            type="number"
            trend={{
              value: otaMetrics.periodComparison.bookings.value,
              direction: otaMetrics.periodComparison.bookings.direction,
              label: 'vs last period'
            }}
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
            loading={loading}
          />
          
          <MetricCard
            title="Avg Conversion"
            value={otaMetrics.avgConversion}
            type="percentage"
            suffix="%"
            trend={{
              value: otaMetrics.periodComparison.conversion.value,
              direction: otaMetrics.periodComparison.conversion.direction,
              label: 'vs last period'
            }}
            icon={<Target className="w-5 h-5" />}
            color="purple"
            loading={loading}
          />
          
          <MetricCard
            title="Active Channels"
            value={`${otaMetrics.activeChannels}/${otaMetrics.totalChannels}`}
            trend={{
              value: otaMetrics.periodComparison.channels.value,
              direction: otaMetrics.periodComparison.channels.direction,
              label: 'channels online'
            }}
            icon={<Globe className="w-5 h-5" />}
            color="orange"
            loading={loading}
          />
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Booking Trends by Channel"
              subtitle="Daily bookings over the past 30 days"
              loading={loading}
              onRefresh={() => loadDashboardData()}
              height={350}
            >
              <Line data={bookingTrendChartData} options={chartOptions} />
            </ChartCard>
            
            <ChartCard
              title="Revenue by Channel"
              subtitle="Revenue distribution across OTA platforms"
              loading={loading}
              height={350}
            >
              <Bar data={revenueByChannelData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: false
                  }
                }
              }} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Channel Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {otaChannels.map(channel => (
                    <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChannelStatusIcon(channel.status)}
                        <div>
                          <h3 className="font-semibold">{channel.name}</h3>
                          <p className="text-sm text-gray-600">
                            Last sync: {format(new Date(channel.lastSync), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(channel.revenue)}</div>
                        <div className="text-sm text-gray-600">{channel.bookings} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {deviceAnalytics && (
              <ChartCard
                title="Booking Device Types"
                subtitle="Device usage distribution"
                loading={loading}
                height={300}
              >
                <Doughnut data={deviceAnalyticsChartData!} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                }} />
              </ChartCard>
            )}
          </div>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="grid gap-4">
            {otaChannels.map(channel => (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        channel.status === 'connected' ? 'bg-green-500' :
                        channel.status === 'syncing' ? 'bg-blue-500' :
                        channel.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <CardTitle>{channel.name}</CardTitle>
                      <Badge variant={getChannelStatusColor(channel.status) as any}>
                        {channel.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {channel.connectivity}% uptime
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Bookings</div>
                      <div className="text-xl font-semibold">{formatNumber(channel.bookings)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Revenue</div>
                      <div className="text-xl font-semibold">{formatCurrency(channel.revenue)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Commission</div>
                      <div className="text-xl font-semibold">{channel.commission}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Conversion</div>
                      <div className="text-xl font-semibold">{channel.conversion}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Avg Daily Rate</div>
                      <div className="text-xl font-semibold">{formatCurrency(channel.avgDailyRate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Review Score</div>
                      <div className="text-xl font-semibold flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        {channel.reviewScore}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Occupancy Rate:</span>
                        <span className="ml-1 font-medium">{channel.occupancyRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Cancellation Rate:</span>
                        <span className="ml-1 font-medium">{channel.cancellationRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Reviews:</span>
                        <span className="ml-1 font-medium">{formatNumber(channel.totalReviews)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={channelPerformance}
                columns={[
                  { key: 'channelName', label: 'Channel' },
                  { key: 'impressions', label: 'Impressions', format: 'number' },
                  { key: 'clicks', label: 'Clicks', format: 'number' },
                  { key: 'ctr', label: 'CTR', format: 'percentage' },
                  { key: 'bookings', label: 'Bookings', format: 'number' },
                  { key: 'conversionRate', label: 'Conv. Rate', format: 'percentage' },
                  { key: 'revenue', label: 'Revenue', format: 'currency' },
                  { key: 'revenuePerClick', label: 'Rev/Click', format: 'currency' },
                  { key: 'commission', label: 'Commission', format: 'percentage' }
                ]}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {otaChannels
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((channel, index) => (
                    <div key={channel.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{channel.name}</div>
                          <div className="text-sm text-gray-600">{channel.bookings} bookings</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(channel.revenue)}</div>
                        <div className="text-sm text-gray-600">{channel.conversion}% conv.</div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900">Revenue Growing</div>
                    <div className="text-sm text-blue-700">
                      Total OTA revenue increased by 12.5% compared to last period
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-900">High Connectivity</div>
                    <div className="text-sm text-green-700">
                      Average channel uptime is 92%, ensuring consistent bookings
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-900">Review Attention Needed</div>
                    <div className="text-sm text-yellow-700">
                      Hotels.com has lower review scores - consider guest experience improvements
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <WifiOff className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-900">Sync Issues</div>
                    <div className="text-sm text-red-700">
                      {otaMetrics?.syncErrors} channel{(otaMetrics?.syncErrors || 0) !== 1 ? 's' : ''} currently experiencing sync errors
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OTADashboard;