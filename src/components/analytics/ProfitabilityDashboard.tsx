import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  BarChart3,
  PieChart,
  Target,
  Calendar,
  Users,
  Bed,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import analyticsService, { ProfitabilityData } from '@/services/analyticsService';

interface ProfitabilityMetrics {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenuePerRoom: number;
  costPerRoom: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenuePAR: number;
  previousPeriodComparison: {
    revenue: number;
    profit: number;
    occupancy: number;
  };
}

interface RoomTypeProfitability {
  roomType: string;
  revenue: number;
  costs: number;
  profit: number;
  profitMargin: number;
  occupancyRate: number;
  averageRate: number;
  roomCount: number;
}

interface ForecastData {
  date: string;
  predictedRevenue: number;
  predictedOccupancy: number;
  confidence: number;
  factors: string[];
}

interface ProfitabilityDashboardProps {
  className?: string;
}

interface Recommendation {
  title: string;
  description: string;
  potential?: string;
  savings?: string;
  type: string;
}

interface SmartRecommendations {
  revenueOpportunities: Recommendation[];
  costOptimizations: Recommendation[];
}

const ProfitabilityDashboard: React.FC<ProfitabilityDashboardProps> = ({ className = '' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [metrics, setMetrics] = useState<ProfitabilityMetrics | null>(null);
  const [roomTypeProfitability, setRoomTypeProfitability] = useState<RoomTypeProfitability[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const mockMetrics: ProfitabilityMetrics = {
    totalRevenue: 458750,
    totalCosts: 275250,
    grossProfit: 183500,
    netProfit: 158200,
    profitMargin: 34.5,
    revenuePerRoom: 2850,
    costPerRoom: 1712,
    occupancyRate: 78.5,
    averageDailyRate: 185.50,
    revenuePAR: 145.62,
    previousPeriodComparison: {
      revenue: 12.5,
      profit: 8.3,
      occupancy: -2.1
    }
  };

  const mockRoomTypeProfitability: RoomTypeProfitability[] = [
    {
      roomType: 'Standard Suite',
      revenue: 180750,
      costs: 95400,
      profit: 85350,
      profitMargin: 47.2,
      occupancyRate: 82.3,
      averageRate: 165.00,
      roomCount: 80
    },
    {
      roomType: 'Deluxe Suite',
      revenue: 156800,
      costs: 78400,
      profit: 78400,
      profitMargin: 50.0,
      occupancyRate: 75.8,
      averageRate: 220.00,
      roomCount: 50
    },
    {
      roomType: 'Executive Suite',
      revenue: 98600,
      costs: 49300,
      profit: 49300,
      profitMargin: 50.0,
      occupancyRate: 68.2,
      averageRate: 350.00,
      roomCount: 20
    },
    {
      roomType: 'Presidential Suite',
      revenue: 22600,
      costs: 11300,
      profit: 11300,
      profitMargin: 50.0,
      occupancyRate: 45.0,
      averageRate: 750.00,
      roomCount: 4
    }
  ];

  const mockForecast: ForecastData[] = [
    {
      date: '2024-01-15',
      predictedRevenue: 15500,
      predictedOccupancy: 85.2,
      confidence: 92,
      factors: ['Weekend surge', 'Local event', 'Historical trend']
    },
    {
      date: '2024-01-16',
      predictedRevenue: 18200,
      predictedOccupancy: 92.1,
      confidence: 88,
      factors: ['Corporate bookings', 'Limited availability']
    },
    {
      date: '2024-01-17',
      predictedRevenue: 12800,
      predictedOccupancy: 68.5,
      confidence: 91,
      factors: ['Mid-week dip', 'Weather forecast']
    }
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching profitability data for period:', selectedPeriod);
      const data: ProfitabilityData = await analyticsService.getProfitabilityMetrics(selectedPeriod);

      console.log('Profitability data received:', data);

      // Set all data from the single API call
      setMetrics(data);
      setRoomTypeProfitability(data.roomTypeProfitability || []);
      setForecast(data.forecast || []);
      setRecommendations(data.recommendations || { revenueOpportunities: [], costOptimizations: [] });

    } catch (error) {
      console.error('Error fetching profitability analytics:', error);
      // Fallback to mock data
      setMetrics(mockMetrics);
      setRoomTypeProfitability(mockRoomTypeProfitability);
      setForecast(mockForecast);
      setRecommendations({ revenueOpportunities: [], costOptimizations: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomTypeProfitability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/analytics/room-type-profitability?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setRoomTypeProfitability(data.data);
        } else {
          // Fallback to mock data if no real data available
          setRoomTypeProfitability(mockRoomTypeProfitability);
        }
      } else {
        setRoomTypeProfitability(mockRoomTypeProfitability);
      }
    } catch (error) {
      console.error('Error fetching room type profitability:', error);
      setRoomTypeProfitability(mockRoomTypeProfitability);
    }
  };

  const fetchForecastData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/analytics/revenue-forecast?days=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setForecast(data.data);
        } else {
          setForecast(mockForecast);
        }
      } else {
        setForecast(mockForecast);
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setForecast(mockForecast);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/analytics/smart-recommendations?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRecommendations(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const getRoomTypeName = (roomNumber: string) => {
    // Convert room numbers to room types
    const roomNum = parseInt(roomNumber);
    if (roomNum >= 1001) return 'Presidential Suite';
    if (roomNum >= 801) return 'Executive Suite';
    if (roomNum >= 501) return 'Deluxe Suite';
    return 'Standard Suite';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const calculateTotalProfit = () => {
    return roomTypeProfitability.reduce((sum, room) => sum + room.profit, 0);
  };

  const getMostProfitableRoomType = () => {
    return roomTypeProfitability.reduce((best, current) => 
      current.profitMargin > best.profitMargin ? current : best,
      roomTypeProfitability[0]
    );
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profitability Analytics</h2>
          <p className="text-gray-600">AI-powered revenue insights and forecasting</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
          
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getChangeIcon(metrics.previousPeriodComparison.revenue)}
                  <span className={`text-sm font-medium ${getChangeColor(metrics.previousPeriodComparison.revenue)}`}>
                    {Math.abs(metrics.previousPeriodComparison.revenue)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.netProfit)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getChangeIcon(metrics.previousPeriodComparison.profit)}
                  <span className={`text-sm font-medium ${getChangeColor(metrics.previousPeriodComparison.profit)}`}>
                    {Math.abs(metrics.previousPeriodComparison.profit)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.profitMargin}%
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Target: 35%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">RevPAR</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(metrics.revenuePAR)}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Revenue per Available Room
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Occupancy</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.occupancyRate}%
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {getChangeIcon(metrics.previousPeriodComparison.occupancy)}
                  <span className={`text-sm font-medium ${getChangeColor(metrics.previousPeriodComparison.occupancy)}`}>
                    {Math.abs(metrics.previousPeriodComparison.occupancy)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="room-analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="room-analysis">Room Type Analysis</TabsTrigger>
          <TabsTrigger value="forecasting">AI Forecasting</TabsTrigger>
          <TabsTrigger value="recommendations">Smart Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="room-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Room Type Profitability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roomTypeProfitability.map((room, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{room.roomType}</h4>
                        <Badge variant="outline" className="text-xs">
                          {room.roomCount} rooms
                        </Badge>
                        <Badge 
                          className={`text-xs ${
                            room.profitMargin > 45 ? 'bg-green-100 text-green-700' :
                            room.profitMargin > 30 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}
                        >
                          {room.profitMargin}% margin
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                        <div>
                          <span className="block text-xs text-gray-500">Revenue</span>
                          <span className="font-medium">{formatCurrency(room.revenue)}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-500">Profit</span>
                          <span className="font-medium text-green-600">{formatCurrency(room.profit)}</span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-500">Occupancy</span>
                          <span className="font-medium">{room.occupancyRate}%</span>
                        </div>
                        <div>
                          <span className="block text-xs text-gray-500">Avg Rate</span>
                          <span className="font-medium">{formatCurrency(room.averageRate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        room.profitMargin > 45 ? 'bg-green-500' :
                        room.profitMargin > 30 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Revenue Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(day.predictedRevenue)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {day.predictedOccupancy}% occupancy
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {day.confidence}% confidence
                          </Badge>
                          {day.factors.map((factor, idx) => (
                            <span key={idx} className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-3 h-3 rounded-full ${
                      day.confidence > 90 ? 'bg-green-500' :
                      day.confidence > 80 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Target className="w-5 h-5" />
                  Revenue Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations && recommendations.revenueOpportunities.length > 0 ? (
                  recommendations.revenueOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">{opportunity.title}</span>
                      </div>
                      <p className="text-sm text-green-700">{opportunity.description}</p>
                      <div className="text-xs text-green-600 mt-1">Potential: {opportunity.potential}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Analyzing data...</span>
                    </div>
                    <p className="text-sm text-gray-600">No specific revenue opportunities identified based on current data. System is analyzing performance patterns.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                  Cost Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations && recommendations.costOptimizations.length > 0 ? (
                  recommendations.costOptimizations.map((optimization, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowDownRight className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-800">{optimization.title}</span>
                      </div>
                      <p className="text-sm text-orange-700">{optimization.description}</p>
                      <div className="text-xs text-orange-600 mt-1">Savings: {optimization.savings}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Operations optimized</span>
                    </div>
                    <p className="text-sm text-gray-600">No critical cost optimization opportunities found. Current operations appear to be running efficiently.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfitabilityDashboard;