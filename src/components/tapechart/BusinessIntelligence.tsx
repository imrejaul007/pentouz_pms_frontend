import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/utils/toast';
import {
  BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  Calendar, Download, Mail, Clock, Users, DollarSign,
  Target, Eye, Settings, Plus, Trash2, Edit,
  Filter, Search, RefreshCw, Share, FileText
} from 'lucide-react';

// Business Intelligence Types
interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map';
  chartType?: 'bar' | 'line' | 'pie' | 'doughnut' | 'area';
  dataSource: string;
  filters: ReportFilter[];
  position: { x: number; y: number; width: number; height: number };
  refreshInterval: number;
  lastUpdated: string;
}

interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'guest' | 'staff' | 'marketing';
  description: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filters: ReportFilter[];
  isActive: boolean;
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  category: 'revenue' | 'occupancy' | 'guest_satisfaction' | 'efficiency';
  period: string;
  drillDown?: BusinessMetric[];
}

interface DataExport {
  id: string;
  name: string;
  format: 'excel' | 'csv' | 'pdf' | 'json';
  dataSource: string;
  filters: ReportFilter[];
  columns: string[];
  scheduledExports?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    lastSent: string;
  };
}

export const BusinessIntelligence: React.FC = () => {
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetric[]>([]);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<BusinessMetric | null>(null);
  const [isDashboardBuilder, setIsDashboardBuilder] = useState(false);

  useEffect(() => {
    loadBusinessIntelligenceData();
  }, []);

  const loadBusinessIntelligenceData = () => {
    // Load mock dashboards
    const mockDashboards: CustomDashboard[] = [
      {
        id: 'dashboard-revenue',
        name: 'Revenue Analytics',
        description: 'Comprehensive revenue tracking and analysis',
        widgets: [
          {
            id: 'widget-1',
            title: 'Monthly Revenue Trend',
            type: 'chart',
            chartType: 'line',
            dataSource: 'bookings',
            filters: [{ field: 'date', operator: 'between', value: ['2024-01-01', '2024-12-31'], label: 'This Year' }],
            position: { x: 0, y: 0, width: 6, height: 4 },
            refreshInterval: 300,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'widget-2',
            title: 'Room Type Performance',
            type: 'chart',
            chartType: 'bar',
            dataSource: 'rooms',
            filters: [],
            position: { x: 6, y: 0, width: 6, height: 4 },
            refreshInterval: 600,
            lastUpdated: new Date().toISOString()
          }
        ],
        isPublic: false,
        owner: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['revenue', 'financial', 'analytics']
      },
      {
        id: 'dashboard-operations',
        name: 'Operations Dashboard',
        description: 'Daily operational metrics and KPIs',
        widgets: [
          {
            id: 'widget-3',
            title: 'Occupancy Rate',
            type: 'gauge',
            dataSource: 'occupancy',
            filters: [],
            position: { x: 0, y: 0, width: 3, height: 3 },
            refreshInterval: 60,
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'widget-4',
            title: 'Guest Satisfaction',
            type: 'metric',
            dataSource: 'reviews',
            filters: [],
            position: { x: 3, y: 0, width: 3, height: 3 },
            refreshInterval: 300,
            lastUpdated: new Date().toISOString()
          }
        ],
        isPublic: true,
        owner: 'manager',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['operations', 'daily', 'kpi']
      }
    ];

    // Load mock report templates
    const mockReports: ReportTemplate[] = [
      {
        id: 'report-daily-operations',
        name: 'Daily Operations Report',
        category: 'operational',
        description: 'Daily summary of hotel operations, occupancy, and key metrics',
        schedule: {
          frequency: 'daily',
          time: '08:00',
        },
        recipients: ['manager@hotel.com', 'operations@hotel.com'],
        format: 'pdf',
        filters: [
          { field: 'date', operator: 'equals', value: 'today', label: 'Today' }
        ],
        isActive: true
      },
      {
        id: 'report-monthly-revenue',
        name: 'Monthly Revenue Analysis',
        category: 'financial',
        description: 'Comprehensive monthly revenue analysis with comparisons',
        schedule: {
          frequency: 'monthly',
          time: '09:00',
          dayOfMonth: 1
        },
        recipients: ['finance@hotel.com', 'gm@hotel.com'],
        format: 'excel',
        filters: [
          { field: 'date', operator: 'between', value: ['month_start', 'month_end'], label: 'This Month' }
        ],
        isActive: true
      },
      {
        id: 'report-guest-satisfaction',
        name: 'Guest Satisfaction Weekly',
        category: 'guest',
        description: 'Weekly guest satisfaction and feedback analysis',
        schedule: {
          frequency: 'weekly',
          time: '10:00',
          dayOfWeek: 1 // Monday
        },
        recipients: ['gm@hotel.com', 'guest.relations@hotel.com'],
        format: 'pdf',
        filters: [
          { field: 'rating', operator: 'greater_than', value: 0, label: 'All Ratings' }
        ],
        isActive: true
      }
    ];

    // Load mock business metrics
    const mockMetrics: BusinessMetric[] = [
      {
        id: 'metric-revenue',
        name: 'Total Revenue',
        value: 125000,
        previousValue: 118000,
        target: 130000,
        unit: 'currency',
        trend: 'up',
        category: 'revenue',
        period: 'This Month',
        drillDown: [
          { id: 'rooms-revenue', name: 'Room Revenue', value: 98000, previousValue: 92000, unit: 'currency', trend: 'up', category: 'revenue', period: 'This Month' },
          { id: 'food-revenue', name: 'F&B Revenue', value: 18000, previousValue: 16000, unit: 'currency', trend: 'up', category: 'revenue', period: 'This Month' },
          { id: 'other-revenue', name: 'Other Revenue', value: 9000, previousValue: 10000, unit: 'currency', trend: 'down', category: 'revenue', period: 'This Month' }
        ]
      },
      {
        id: 'metric-occupancy',
        name: 'Occupancy Rate',
        value: 78.5,
        previousValue: 75.2,
        target: 85.0,
        unit: 'percentage',
        trend: 'up',
        category: 'occupancy',
        period: 'This Month'
      },
      {
        id: 'metric-adr',
        name: 'Average Daily Rate',
        value: 245,
        previousValue: 238,
        target: 250,
        unit: 'currency',
        trend: 'up',
        category: 'revenue',
        period: 'This Month'
      },
      {
        id: 'metric-satisfaction',
        name: 'Guest Satisfaction',
        value: 4.3,
        previousValue: 4.1,
        target: 4.5,
        unit: 'rating',
        trend: 'up',
        category: 'guest_satisfaction',
        period: 'This Month'
      }
    ];

    // Load mock data exports
    const mockExports: DataExport[] = [
      {
        id: 'export-guest-data',
        name: 'Guest Database Export',
        format: 'excel',
        dataSource: 'guests',
        filters: [
          { field: 'status', operator: 'equals', value: 'active', label: 'Active Guests' }
        ],
        columns: ['name', 'email', 'phone', 'total_bookings', 'last_stay'],
        scheduledExports: {
          frequency: 'weekly',
          recipients: ['marketing@hotel.com'],
          lastSent: new Date().toISOString()
        }
      },
      {
        id: 'export-financial',
        name: 'Financial Transactions',
        format: 'csv',
        dataSource: 'transactions',
        filters: [
          { field: 'date', operator: 'between', value: ['2024-01-01', '2024-12-31'], label: 'This Year' }
        ],
        columns: ['date', 'amount', 'type', 'booking_id', 'payment_method']
      }
    ];

    setDashboards(mockDashboards);
    setReportTemplates(mockReports);
    setBusinessMetrics(mockMetrics);
    setDataExports(mockExports);
    setSelectedDashboard(mockDashboards[0]?.id || '');
  };

  const createNewDashboard = () => {
    const newDashboard: CustomDashboard = {
      id: `dashboard-${Date.now()}`,
      name: 'New Dashboard',
      description: 'Custom dashboard',
      widgets: [],
      isPublic: false,
      owner: 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: []
    };

    setDashboards(prev => [...prev, newDashboard]);
    setSelectedDashboard(newDashboard.id);
    setIsDashboardBuilder(true);
    toast.success('New dashboard created');
  };

  const deleteDashboard = (dashboardId: string) => {
    setDashboards(prev => prev.filter(d => d.id !== dashboardId));
    if (selectedDashboard === dashboardId) {
      setSelectedDashboard(dashboards[0]?.id || '');
    }
    toast.success('Dashboard deleted');
  };

  const exportData = (exportConfig: DataExport) => {
    // Mock export functionality
    toast.success(`Exporting ${exportConfig.name} as ${exportConfig.format.toUpperCase()}`);
    console.log('📊 Exporting data:', exportConfig);
  };

  const scheduleReport = (reportId: string) => {
    const report = reportTemplates.find(r => r.id === reportId);
    if (report) {
      setReportTemplates(prev =>
        prev.map(r => r.id === reportId ? { ...r, isActive: !r.isActive } : r)
      );
      toast.success(`Report ${report.isActive ? 'disabled' : 'enabled'}`);
    }
  };

  const shareReport = (reportId: string) => {
    toast.info('Sharing functionality would integrate with email system');
  };

  const drillDownMetric = (metric: BusinessMetric) => {
    setSelectedMetric(metric);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'rating':
        return `${value}/5`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      operational: 'bg-blue-100 text-blue-800',
      guest: 'bg-purple-100 text-purple-800',
      staff: 'bg-orange-100 text-orange-800',
      marketing: 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const selectedDashboardData = dashboards.find(d => d.id === selectedDashboard);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Business Intelligence
          <Badge className="bg-green-100 text-green-800">Phase 3</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Reporting & Business Intelligence
            <Badge className="bg-green-100 text-green-800">
              Innovation Leadership
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Custom dashboards, automated reports, and advanced analytics with drill-down capabilities
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dashboards" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="exports">Data Export</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboards" className="space-y-4">
            {/* Dashboard Management */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label>Select Dashboard:</Label>
                <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={createNewDashboard}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Dashboard
                </Button>
                {selectedDashboardData && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDashboard(selectedDashboard)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {selectedDashboardData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedDashboardData.name}
                    <div className="flex items-center gap-2">
                      <Badge className={selectedDashboardData.isPublic ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {selectedDashboardData.isPublic ? 'Public' : 'Private'}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardTitle>
                  <div className="text-sm text-gray-600">{selectedDashboardData.description}</div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {selectedDashboardData.widgets.map((widget) => (
                      <Card key={widget.id} className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            {widget.title}
                            <div className="flex items-center gap-1">
                              {widget.type === 'chart' && <BarChart3 className="h-4 w-4 text-gray-500" />}
                              {widget.type === 'metric' && <Target className="h-4 w-4 text-gray-500" />}
                              {widget.type === 'gauge' && <PieChart className="h-4 w-4 text-gray-500" />}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-400">📊</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {widget.chartType?.toUpperCase() || widget.type.toUpperCase()} Chart
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Last updated: {new Date(widget.lastUpdated).toLocaleTimeString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {selectedDashboardData.widgets.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">No Widgets</h3>
                        <p>Add widgets to customize this dashboard</p>
                        <Button className="mt-4" onClick={() => setIsDashboardBuilder(true)}>
                          Add Widget
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      Tags: {selectedDashboardData.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="mr-1 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      Created: {new Date(selectedDashboardData.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            {/* Automated Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Automated Report Templates
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    New Template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportTemplates.map((report) => (
                    <Card key={report.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium">{report.name}</div>
                              <Badge className={getCategoryColor(report.category)}>
                                {report.category.toUpperCase()}
                              </Badge>
                              <Badge className={report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {report.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">{report.description}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => scheduleReport(report.id)}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {report.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareReport(report.id)}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="text-xs">Frequency</Label>
                            <div className="font-medium capitalize">{report.schedule.frequency}</div>
                          </div>

                          <div>
                            <Label className="text-xs">Time</Label>
                            <div className="font-medium">{report.schedule.time}</div>
                          </div>

                          <div>
                            <Label className="text-xs">Format</Label>
                            <div className="font-medium uppercase">{report.format}</div>
                          </div>

                          <div>
                            <Label className="text-xs">Recipients</Label>
                            <div className="font-medium">{report.recipients.length} recipients</div>
                          </div>
                        </div>

                        {report.filters.length > 0 && (
                          <div className="mt-3">
                            <Label className="text-xs">Filters</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {report.filters.map((filter, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {filter.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            Recipients: {report.recipients.join(', ')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {/* Business Metrics with Drill-down */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {businessMetrics.map((metric) => (
                <Card
                  key={metric.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => drillDownMetric(metric)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm font-medium text-gray-600">{metric.name}</div>
                      {getTrendIcon(metric.trend)}
                    </div>

                    <div className="text-2xl font-bold mb-1">
                      {formatValue(metric.value, metric.unit)}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={getTrendColor(metric.trend)}>
                        {metric.trend === 'up' ? '+' : ''}{calculateChange(metric.value, metric.previousValue)}%
                      </span>
                      <span className="text-gray-500">vs previous</span>
                    </div>

                    {metric.target && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Target</span>
                          <span>{formatValue(metric.target, metric.unit)}</span>
                        </div>
                        <Progress
                          value={(metric.value / metric.target) * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {metric.period}
                    </div>

                    {metric.drillDown && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-xs text-blue-600">
                          <Eye className="h-3 w-3 inline mr-1" />
                          Click for drill-down
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Drill-down Modal */}
            {selectedMetric && selectedMetric.drillDown && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {selectedMetric.name} - Drill Down
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedMetric(null)}
                    >
                      Close
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedMetric.drillDown.map((subMetric) => (
                      <Card key={subMetric.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">{subMetric.name}</div>
                            {getTrendIcon(subMetric.trend)}
                          </div>
                          <div className="text-xl font-bold">
                            {formatValue(subMetric.value, subMetric.unit)}
                          </div>
                          <div className={`text-sm ${getTrendColor(subMetric.trend)}`}>
                            {subMetric.trend === 'up' ? '+' : ''}{calculateChange(subMetric.value, subMetric.previousValue)}% vs previous
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="exports" className="space-y-4">
            {/* Data Export Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Data Export Management
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    New Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataExports.map((exportConfig) => (
                    <Card key={exportConfig.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">{exportConfig.name}</div>
                            <div className="text-sm text-gray-600">
                              {exportConfig.dataSource} → {exportConfig.format.toUpperCase()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportData(exportConfig)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export Now
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <Label className="text-xs">Columns</Label>
                            <div className="font-medium">{exportConfig.columns.length} selected</div>
                          </div>

                          <div>
                            <Label className="text-xs">Filters</Label>
                            <div className="font-medium">{exportConfig.filters.length} applied</div>
                          </div>

                          <div>
                            <Label className="text-xs">Format</Label>
                            <Badge className="ml-1">{exportConfig.format.toUpperCase()}</Badge>
                          </div>
                        </div>

                        {exportConfig.scheduledExports && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Scheduled Export</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              Frequency: {exportConfig.scheduledExports.frequency} |
                              Recipients: {exportConfig.scheduledExports.recipients.length} |
                              Last sent: {new Date(exportConfig.scheduledExports.lastSent).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        <div className="mt-3">
                          <Label className="text-xs">Filters Applied</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exportConfig.filters.map((filter, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {filter.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-4">
            {/* Dashboard Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Builder</CardTitle>
                <div className="text-sm text-gray-600">
                  Drag and drop components to build custom dashboards
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* Widget Palette */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Available Widgets</h4>

                    <div className="space-y-2">
                      <Card className="p-3 cursor-move hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-sm">Bar Chart</span>
                        </div>
                      </Card>

                      <Card className="p-3 cursor-move hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          <span className="text-sm">Line Chart</span>
                        </div>
                      </Card>

                      <Card className="p-3 cursor-move hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          <span className="text-sm">Pie Chart</span>
                        </div>
                      </Card>

                      <Card className="p-3 cursor-move hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="text-sm">KPI Metric</span>
                        </div>
                      </Card>

                      <Card className="p-3 cursor-move hover:shadow-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Data Table</span>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* Canvas Area */}
                  <div className="col-span-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2">Drag Widgets Here</h3>
                        <p>Start building your custom dashboard by dragging widgets from the left panel</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Dashboard</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};