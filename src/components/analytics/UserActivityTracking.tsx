import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Pagination } from '../ui/Pagination';
import OptimizedSearch from '../ui/OptimizedSearch';
import {
  User,
  Activity,
  Clock,
  Eye,
  Mouse,
  Smartphone,
  Monitor,
  Globe,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Users,
  Timer,
  MousePointer
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  ipAddress: string;
  userAgent: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  location: {
    country: string;
    city: string;
    timezone: string;
  };
  activities: UserActivity[];
  pages: PageVisit[];
  status: 'active' | 'ended' | 'timeout';
}

interface UserActivity {
  id: string;
  timestamp: Date;
  type: 'page_view' | 'click' | 'form_submit' | 'api_call' | 'download' | 'search';
  target: string;
  details: Record<string, any>;
  duration?: number;
}

interface PageVisit {
  id: string;
  path: string;
  title: string;
  timestamp: Date;
  duration: number; // in seconds
  exitType: 'navigation' | 'close' | 'timeout' | 'refresh';
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  topPages: { path: string; title: string; views: number; }[];
  topDevices: { type: string; count: number; percentage: number; }[];
  topCountries: { country: string; count: number; percentage: number; }[];
}

interface UserActivityTrackingProps {
  propertyGroupId?: string;
  dateRange?: { start: Date; end: Date };
  onExportReport?: (data: any, format: string) => void;
}

// Mock data for demonstration
const mockUserSessions: UserSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    userName: 'John Smith',
    userEmail: 'john@hotel.com',
    userRole: 'admin',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 30 * 60 * 1000),
    duration: 90,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    device: {
      type: 'desktop',
      os: 'Windows 10',
      browser: 'Chrome 91.0'
    },
    location: {
      country: 'India',
      city: 'Mumbai',
      timezone: 'Asia/Kolkata'
    },
    activities: [
      {
        id: 'activity-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'page_view',
        target: '/admin/dashboard',
        details: { referrer: 'direct' }
      },
      {
        id: 'activity-2',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        type: 'click',
        target: 'property-list-button',
        details: { elementType: 'button', page: '/admin/properties' }
      }
    ],
    pages: [
      {
        id: 'page-1',
        path: '/admin/dashboard',
        title: 'Admin Dashboard',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        duration: 300,
        exitType: 'navigation'
      },
      {
        id: 'page-2',
        path: '/admin/properties',
        title: 'Property Management',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        duration: 450,
        exitType: 'navigation'
      }
    ],
    status: 'ended'
  },
  {
    id: 'session-2',
    userId: 'user-2',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@hotel.com',
    userRole: 'staff',
    startTime: new Date(Date.now() - 45 * 60 * 1000),
    duration: 45,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    device: {
      type: 'mobile',
      os: 'iOS 14.0',
      browser: 'Safari Mobile'
    },
    location: {
      country: 'India',
      city: 'Delhi',
      timezone: 'Asia/Kolkata'
    },
    activities: [
      {
        id: 'activity-3',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        type: 'page_view',
        target: '/staff/dashboard',
        details: { referrer: 'bookmark' }
      }
    ],
    pages: [
      {
        id: 'page-3',
        path: '/staff/dashboard',
        title: 'Staff Dashboard',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        duration: 180,
        exitType: 'close'
      }
    ],
    status: 'active'
  }
];

const mockUserMetrics: UserMetrics = {
  totalUsers: 156,
  activeUsers: 23,
  newUsers: 12,
  returningUsers: 144,
  averageSessionDuration: 25.4,
  bounceRate: 34.2,
  pageViews: 1248,
  uniquePageViews: 892,
  topPages: [
    { path: '/admin/dashboard', title: 'Admin Dashboard', views: 234 },
    { path: '/staff/rooms', title: 'Room Management', views: 189 },
    { path: '/admin/bookings', title: 'Booking Management', views: 156 },
    { path: '/staff/housekeeping', title: 'Housekeeping', views: 134 },
    { path: '/admin/reports', title: 'Reports', views: 98 }
  ],
  topDevices: [
    { type: 'Desktop', count: 89, percentage: 57.1 },
    { type: 'Mobile', count: 45, percentage: 28.8 },
    { type: 'Tablet', count: 22, percentage: 14.1 }
  ],
  topCountries: [
    { country: 'India', count: 134, percentage: 85.9 },
    { country: 'United States', count: 12, percentage: 7.7 },
    { country: 'United Kingdom', count: 6, percentage: 3.8 },
    { country: 'Canada', count: 4, percentage: 2.6 }
  ]
};

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType.toLowerCase()) {
    case 'mobile': return <Smartphone className="h-4 w-4" />;
    case 'tablet': return <Smartphone className="h-4 w-4" />;
    case 'desktop': return <Monitor className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
};

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'page_view': return <Eye className="h-3 w-3" />;
    case 'click': return <MousePointer className="h-3 w-3" />;
    case 'form_submit': return <Activity className="h-3 w-3" />;
    case 'api_call': return <Globe className="h-3 w-3" />;
    case 'download': return <Download className="h-3 w-3" />;
    case 'search': return <Filter className="h-3 w-3" />;
    default: return <Activity className="h-3 w-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-50 border-green-200';
    case 'ended': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'timeout': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const UserActivityTracking: React.FC<UserActivityTrackingProps> = ({
  propertyGroupId,
  dateRange,
  onExportReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filter sessions based on criteria
  const filteredSessions = useMemo(() => {
    return mockUserSessions.filter(session => {
      const matchesSearch = !searchTerm ||
        session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.ipAddress.includes(searchTerm);

      const matchesRole = roleFilter === 'all' || session.userRole === roleFilter;
      const matchesDevice = deviceFilter === 'all' || session.device.type === deviceFilter;
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

      const matchesDateFrom = !dateFrom || session.startTime >= new Date(dateFrom);
      const matchesDateTo = !dateTo || session.startTime <= endOfDay(new Date(dateTo));

      return matchesSearch && matchesRole && matchesDevice && matchesStatus &&
             matchesDateFrom && matchesDateTo;
    });
  }, [searchTerm, roleFilter, deviceFilter, statusFilter, dateFrom, dateTo]);

  // Paginate results
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSessions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  const handleExportReport = (format: string) => {
    const reportData = {
      sessions: filteredSessions,
      metrics: mockUserMetrics,
      filters: {
        searchTerm,
        roleFilter,
        deviceFilter,
        statusFilter,
        dateFrom,
        dateTo
      },
      generatedAt: new Date(),
      propertyGroupId
    };

    if (onExportReport) {
      onExportReport(reportData, format);
    } else {
      console.log(`Exporting user activity report in ${format} format:`, reportData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{mockUserMetrics.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{mockUserMetrics.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Now</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{mockUserMetrics.averageSessionDuration}m</div>
            <div className="text-sm text-muted-foreground">Avg Session</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{mockUserMetrics.pageViews}</div>
            <div className="text-sm text-muted-foreground">Page Views</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            User Activity Tracking
            <Badge variant="secondary" className="ml-2">
              {filteredSessions.length} sessions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sessions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sessions">User Sessions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="real-time">Real-time Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <OptimizedSearch
                    placeholder="Search by user, email, or IP address..."
                    onSearch={setSearchTerm}
                    initialValue={searchTerm}
                  />
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportReport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => handleExportReport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>

              {/* User Sessions List */}
              <div className="space-y-2">
                {paginatedSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedSession(session)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex flex-col items-center gap-1">
                            {getDeviceIcon(session.device.type)}
                            <Badge className={`${getStatusColor(session.status)} border text-xs px-2 py-0.5`}>
                              {session.status}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{session.userName}</span>
                              <Badge variant="outline">{session.userRole}</Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              {session.userEmail} • {session.location.city}, {session.location.country}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(session.startTime, 'MMM dd, HH:mm')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {session.duration}m
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {session.pages.length} pages
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {session.activities.length} actions
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>IP: {session.ipAddress}</span>
                              <span>{session.device.os} • {session.device.browser}</span>
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredSessions.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top Pages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockUserMetrics.topPages.map((page, index) => (
                      <div key={page.path} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{page.title}</div>
                          <div className="text-xs text-muted-foreground">{page.path}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{page.views} views</div>
                          <div className="w-20">
                            <Progress value={(page.views / mockUserMetrics.topPages[0].views) * 100} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Device Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockUserMetrics.topDevices.map((device) => (
                        <div key={device.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device.type)}
                            <span className="text-sm">{device.type}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{device.percentage}%</span>
                            <div className="w-16">
                              <Progress value={device.percentage} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Top Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockUserMetrics.topCountries.map((country) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <span className="text-sm">{country.country}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{country.percentage}%</span>
                            <div className="w-16">
                              <Progress value={country.percentage} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-600">{mockUserMetrics.newUsers}</div>
                    <div className="text-sm text-muted-foreground">New Users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-blue-600">{mockUserMetrics.returningUsers}</div>
                    <div className="text-sm text-muted-foreground">Returning Users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-orange-600">{mockUserMetrics.bounceRate}%</div>
                    <div className="text-sm text-muted-foreground">Bounce Rate</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-purple-600">{mockUserMetrics.uniquePageViews}</div>
                    <div className="text-sm text-muted-foreground">Unique Page Views</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="real-time" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Real-time Activity Feed
                    <Badge variant="secondary">{mockUserMetrics.activeUsers} active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {mockUserSessions
                        .filter(session => session.status === 'active')
                        .flatMap(session =>
                          session.activities.map(activity => ({
                            ...activity,
                            session
                          }))
                        )
                        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .slice(0, 20)
                        .map((activity, index) => (
                          <div key={`${activity.id}-${index}`} className="flex items-center gap-3 p-2 rounded border">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1">
                              <div className="text-sm">
                                <strong>{activity.session.userName}</strong> performed <strong>{activity.type.replace('_', ' ')}</strong>
                                {activity.target && ` on ${activity.target}`}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(activity.timestamp, 'HH:mm:ss')} • {activity.session.device.type}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Session Details - {selectedSession.userName}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label>User</Label>
                  <div>{selectedSession.userName}</div>
                  <div className="text-muted-foreground">{selectedSession.userEmail}</div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <div>{selectedSession.duration} minutes</div>
                </div>
                <div>
                  <Label>Device</Label>
                  <div className="flex items-center gap-1">
                    {getDeviceIcon(selectedSession.device.type)}
                    {selectedSession.device.type}
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div>{selectedSession.location.city}, {selectedSession.location.country}</div>
                </div>
              </div>

              {/* Page Visits */}
              <div>
                <Label>Page Visits ({selectedSession.pages.length})</Label>
                <div className="space-y-2 mt-2">
                  {selectedSession.pages.map((page) => (
                    <Card key={page.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{page.title}</div>
                            <div className="text-sm text-muted-foreground">{page.path}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div>{format(page.timestamp, 'HH:mm:ss')}</div>
                            <div className="text-muted-foreground">{page.duration}s</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div>
                <Label>Activities ({selectedSession.activities.length})</Label>
                <div className="space-y-2 mt-2">
                  {selectedSession.activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded border">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">
                          Target: {activity.target} • {format(activity.timestamp, 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};