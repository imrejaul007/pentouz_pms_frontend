import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, IndianRupee, Globe, Users, Calendar,
  Filter, Download, Refresh, Settings, AlertTriangle, CheckCircle,
  Target, Zap, BarChart3, PieChart as PieChartIcon, Activity,
  Languages, MapPin, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

interface RevenueData {
  period: string;
  revenue: number;
  occupancy: number;
  adr: number;
  revpar: number;
  previousRevenue?: number;
  currency: string;
}

interface RegionalData {
  region: string;
  regionName: string;
  revenue: number;
  growth: number;
  marketShare: number;
  currency: string;
  performance: 'high' | 'medium' | 'low';
}

interface LanguageData {
  language: string;
  languageName: string;
  revenue: number;
  bookings: number;
  conversionRate: number;
  satisfaction: number;
  translationQuality: number;
}

interface ChannelData {
  channel: string;
  revenue: number;
  bookings: number;
  commission: number;
  profitability: number;
  growth: number;
}

interface DashboardProps {
  hotelId: string;
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  INR: '₹'
};

export const RevenueAnalyticsDashboard: React.FC<DashboardProps> = ({ hotelId, className = '' }) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [currency, setCurrency] = useState('USD');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data - in real implementation, this would come from APIs
  const revenueData: RevenueData[] = [
    { period: 'Jan', revenue: 45000, occupancy: 68, adr: 185, revpar: 125.8, previousRevenue: 42000, currency: 'USD' },
    { period: 'Feb', revenue: 52000, occupancy: 72, adr: 190, revpar: 136.8, previousRevenue: 48000, currency: 'USD' },
    { period: 'Mar', revenue: 58000, occupancy: 75, adr: 195, revpar: 146.25, previousRevenue: 55000, currency: 'USD' },
    { period: 'Apr', revenue: 65000, occupancy: 78, adr: 200, revpar: 156, previousRevenue: 60000, currency: 'USD' },
    { period: 'May', revenue: 72000, occupancy: 82, adr: 205, revpar: 168.1, previousRevenue: 68000, currency: 'USD' },
    { period: 'Jun', revenue: 78000, occupancy: 85, adr: 210, revpar: 178.5, previousRevenue: 75000, currency: 'USD' }
  ];

  const regionalData: RegionalData[] = [
    { region: 'US', regionName: 'United States', revenue: 125000, growth: 15.5, marketShare: 35.2, currency: 'USD', performance: 'high' },
    { region: 'EU', regionName: 'Europe', revenue: 98000, growth: 12.3, marketShare: 28.1, currency: 'EUR', performance: 'high' },
    { region: 'GB', regionName: 'United Kingdom', revenue: 65000, growth: 8.7, marketShare: 18.5, currency: 'GBP', performance: 'medium' },
    { region: 'CN', regionName: 'China', revenue: 45000, growth: 22.1, marketShare: 12.8, currency: 'CNY', performance: 'high' },
    { region: 'JP', regionName: 'Japan', revenue: 32000, growth: 5.2, marketShare: 9.1, currency: 'JPY', performance: 'medium' },
    { region: 'CA', regionName: 'Canada', revenue: 28000, growth: 11.8, marketShare: 8.0, currency: 'CAD', performance: 'medium' }
  ];

  const languageData: LanguageData[] = [
    { language: 'en', languageName: 'English', revenue: 145000, bookings: 856, conversionRate: 12.5, satisfaction: 4.3, translationQuality: 100 },
    { language: 'es', languageName: 'Spanish', revenue: 78000, bookings: 445, conversionRate: 9.8, satisfaction: 4.1, translationQuality: 87 },
    { language: 'fr', languageName: 'French', revenue: 65000, bookings: 332, conversionRate: 11.2, satisfaction: 4.2, translationQuality: 91 },
    { language: 'de', languageName: 'German', revenue: 58000, bookings: 298, conversionRate: 13.1, satisfaction: 4.4, translationQuality: 89 },
    { language: 'zh', languageName: 'Chinese', revenue: 42000, bookings: 234, conversionRate: 8.7, satisfaction: 3.9, translationQuality: 82 },
    { language: 'ja', languageName: 'Japanese', revenue: 35000, bookings: 187, conversionRate: 10.5, satisfaction: 4.0, translationQuality: 85 }
  ];

  const channelData: ChannelData[] = [
    { channel: 'Direct', revenue: 89000, bookings: 445, commission: 0, profitability: 95, growth: 18.5 },
    { channel: 'Booking.com', revenue: 125000, bookings: 756, commission: 18, profitability: 82, growth: 12.3 },
    { channel: 'Expedia', revenue: 78000, bookings: 423, commission: 15, profitability: 85, growth: 8.7 },
    { channel: 'Agoda', revenue: 45000, bookings: 267, commission: 16, profitability: 84, growth: 15.2 },
    { channel: 'Corporate', revenue: 52000, bookings: 189, commission: 5, profitability: 92, growth: 22.1 }
  ];

  const kpiCards = useMemo(() => [
    {
      title: 'Total Revenue',
      value: `${CURRENCY_SYMBOLS[currency] || '$'}350K`,
      change: '+15.5%',
      trend: 'up',
      icon: IndianRupee,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Occupancy Rate',
      value: '78.5%',
      change: '+3.2%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'ADR',
      value: `${CURRENCY_SYMBOLS[currency] || '$'}195`,
      change: '+8.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'RevPAR',
      value: `${CURRENCY_SYMBOLS[currency] || '$'}153`,
      change: '+12.1%',
      trend: 'up',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ], [currency]);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const formatCurrency = (value: number, currencyCode: string = currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.dataKey.includes('revenue') ? formatCurrency(entry.value) : entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">
            Multi-currency revenue performance and optimization insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Refresh className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                  <div className="flex items-center mt-2">
                    {kpi.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="languages" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Performance Trend</CardTitle>
              <CardDescription>Monthly revenue, occupancy, and key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Occupancy (%)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="adr" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="ADR"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
                <CardDescription>Current vs previous period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Current Revenue" />
                    <Bar dataKey="previousRevenue" fill="#94A3B8" name="Previous Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Revenue Target Achievement</span>
                    <span className="text-sm text-gray-500">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Occupancy vs Capacity</span>
                    <span className="text-sm text-gray-500">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-sm text-gray-500">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Guest Satisfaction</span>
                    <span className="text-sm text-gray-500">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Region</CardTitle>
                <CardDescription>Geographic performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={regionalData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="revenue"
                      label={({ regionName, revenue }) => `${regionName}: ${formatCurrency(revenue)}`}
                    >
                      {regionalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
                <CardDescription>Growth and market share analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalData.map((region, index) => (
                    <div key={region.region} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <div>
                          <p className="font-medium">{region.regionName}</p>
                          <p className="text-sm text-gray-500">Market Share: {region.marketShare}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(region.revenue, region.currency)}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant={region.growth >= 15 ? "default" : region.growth >= 10 ? "secondary" : "outline"}>
                            {formatPercentage(region.growth)}
                          </Badge>
                          <Badge variant={region.performance === 'high' ? "default" : region.performance === 'medium' ? "secondary" : "outline"}>
                            {region.performance}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Language</CardTitle>
                <CardDescription>Multi-language performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={languageData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="languageName" type="category" width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Language Quality vs Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Quality vs Revenue</CardTitle>
                <CardDescription>Quality impact on performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={languageData}>
                    <CartesianGrid />
                    <XAxis dataKey="translationQuality" name="Translation Quality" unit="%" />
                    <YAxis dataKey="revenue" name="Revenue" unit="$" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{data.languageName}</p>
                              <p>Revenue: {formatCurrency(data.revenue)}</p>
                              <p>Quality: {data.translationQuality}%</p>
                              <p>Conversion: {data.conversionRate}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="revenue" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Language Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Language Performance Details</CardTitle>
              <CardDescription>Comprehensive language-specific metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Language</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Bookings</th>
                      <th className="text-right p-2">Conversion</th>
                      <th className="text-right p-2">Satisfaction</th>
                      <th className="text-right p-2">Translation Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languageData.map((lang) => (
                      <tr key={lang.language} className="border-b">
                        <td className="p-2">
                          <div className="font-medium">{lang.languageName}</div>
                          <div className="text-sm text-gray-500">{lang.language.toUpperCase()}</div>
                        </td>
                        <td className="text-right p-2 font-medium">{formatCurrency(lang.revenue)}</td>
                        <td className="text-right p-2">{lang.bookings.toLocaleString()}</td>
                        <td className="text-right p-2">{lang.conversionRate}%</td>
                        <td className="text-right p-2">{lang.satisfaction}/5.0</td>
                        <td className="text-right p-2">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={lang.translationQuality} className="w-16 h-2" />
                            <span className="text-sm">{lang.translationQuality}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Revenue Performance</CardTitle>
                <CardDescription>Revenue distribution across channels</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channel Profitability */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Profitability vs Growth</CardTitle>
                <CardDescription>Profitability analysis and growth rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={channelData}>
                    <CartesianGrid />
                    <XAxis dataKey="profitability" name="Profitability" unit="%" />
                    <YAxis dataKey="growth" name="Growth" unit="%" />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{data.channel}</p>
                              <p>Profitability: {data.profitability}%</p>
                              <p>Growth: {formatPercentage(data.growth)}</p>
                              <p>Commission: {data.commission}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter dataKey="growth" fill="#10B981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimization Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Optimization Opportunities</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Dynamic Pricing Opportunity</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Implement dynamic pricing for German market to increase RevPAR by 12-15%
                      </p>
                      <Badge className="mt-2">High Impact</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Channel Mix Optimization</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Increase direct booking share from 25% to 35% to reduce commission costs
                      </p>
                      <Badge variant="secondary" className="mt-2">Medium Impact</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-900">Translation Quality Alert</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        Chinese translation quality (82%) affecting conversion rates
                      </p>
                      <Badge variant="outline" className="mt-2">Action Required</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Impact Projection */}
            <Card>
              <CardHeader>
                <CardTitle>Projected Impact</CardTitle>
                <CardDescription>Expected improvements from optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Increase</span>
                    <span className="text-sm text-gray-500">+18.5%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Potential: {formatCurrency(65000)} additional revenue</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-sm text-gray-500">+12.3%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Current: 32% → Target: 44%</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Market Penetration</span>
                    <span className="text-sm text-gray-500">+8.7%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Expand to 3 new regional markets</p>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full">
                    <Zap className="w-4 h-4 mr-2" />
                    Implement Optimization Strategy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueAnalyticsDashboard;