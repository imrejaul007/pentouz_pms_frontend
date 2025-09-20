import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Target,
  Brain,
  Zap,
  AlertTriangle,
  Settings,
  RefreshCw,
  Eye,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Users,
  Building,
  MapPin,
  Clock,
  Star,
  Percent,
  Save
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import revenueManagementService, { RevenueMetrics, RateShopping, DemandForecast, PerformanceMetrics } from '@/services/revenueManagementService';

const getProgressBarWidth = (percentage: number) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  return `${clampedPercentage}%`;
};

const validateRateValue = (field: string, value: number, currentRate: any): string | null => {
  const errors: string[] = [];

  switch (field) {
    case 'baseRate':
      if (value < 500) errors.push('Base rate must be at least ₹500');
      if (value > 50000) errors.push('Base rate cannot exceed ₹50,000');
      if (currentRate.maxRate && value > currentRate.maxRate) errors.push('Base rate cannot exceed max rate');
      break;

    case 'currentRate':
      if (value < 500) errors.push('Current rate must be at least ₹500');
      if (value > 50000) errors.push('Current rate cannot exceed ₹50,000');
      if (currentRate.minRate && value < currentRate.minRate) errors.push('Current rate cannot be below min rate');
      if (currentRate.maxRate && value > currentRate.maxRate) errors.push('Current rate cannot exceed max rate');
      break;

    case 'minRate':
      if (value < 100) errors.push('Min rate must be at least ₹100');
      if (currentRate.currentRate && value > currentRate.currentRate) errors.push('Min rate cannot exceed current rate');
      if (currentRate.maxRate && value > currentRate.maxRate) errors.push('Min rate cannot exceed max rate');
      break;

    case 'maxRate':
      if (value > 100000) errors.push('Max rate cannot exceed ₹1,00,000');
      if (currentRate.currentRate && value < currentRate.currentRate) errors.push('Max rate cannot be below current rate');
      if (currentRate.minRate && value < currentRate.minRate) errors.push('Max rate cannot be below min rate');
      break;

    case 'occupancyThreshold':
      if (value < 30) errors.push('Occupancy threshold must be at least 30%');
      if (value > 95) errors.push('Occupancy threshold cannot exceed 95%');
      break;
  }

  return errors.length > 0 ? errors.join('. ') : null;
};

interface RoomTypeRate {
  id: string;
  roomType: string;
  baseRate: number;
  currentRate: number;
  demandMultiplier: number;
  occupancyThreshold: number;
  minRate: number;
  maxRate: number;
  isActive: boolean;
  lastUpdated: Date;
}



const RevenueManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [autoOptimization, setAutoOptimization] = useState(true);
  const [rateTypes, setRateTypes] = useState<RoomTypeRate[]>([]);
  const [demandForecast, setDemandForecast] = useState<DemandForecast[]>([]);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [rateShopping, setRateShopping] = useState<RateShopping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Mock data initialization
  useEffect(() => {
    fetchRevenueData();
  }, [dateRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch real data from API with timeout
      const dashboardData = await Promise.race([
        revenueManagementService.getDashboardMetrics({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ]) as any;

      // Fetch real room types from the system
      try {
        // Get the hotel ID from the dedicated hotel endpoint
        const hotelResponse = await fetch('/api/v1/admin-dashboard/hotel', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        let hotelId = null;
        if (hotelResponse.ok) {
          const hotelData = await hotelResponse.json();
          hotelId = hotelData.data?.hotel?._id;
        }

        if (!hotelId) {
          console.log('No hotel ID found from hotel endpoint');
          throw new Error('Hotel ID not found');
        }

        const roomTypesResponse = await fetch('/api/v1/revenue-management/room-types', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (roomTypesResponse.ok) {
          const roomTypesData = await roomTypesResponse.json();
          if (roomTypesData.success && roomTypesData.data?.length > 0) {
            // Use the real data from the backend API
            setRateTypes(roomTypesData.data);
          } else {
            // No data found, use fallback
            console.log('No room types data found');
            setRateTypes([]);
          }
        } else {
          // Fallback to generated data based on dashboard metrics
          const fallbackRateTypes: RoomTypeRate[] = [
            {
              id: 'std-1',
              roomType: 'Standard Room',
              baseRate: Math.round(dashboardData.metrics.adr * 0.85),
              currentRate: dashboardData.metrics.adr,
              demandMultiplier: 1.2,
              occupancyThreshold: 80,
              minRate: Math.round(dashboardData.metrics.adr * 0.7),
              maxRate: Math.round(dashboardData.metrics.adr * 1.5),
              isActive: true,
              lastUpdated: new Date()
            },
            {
              id: 'dlx-2',
              roomType: 'Deluxe Room',
              baseRate: Math.round(dashboardData.metrics.adr * 1.3),
              currentRate: Math.round(dashboardData.metrics.adr * 1.5),
              demandMultiplier: 1.2,
              occupancyThreshold: 75,
              minRate: Math.round(dashboardData.metrics.adr * 1.1),
              maxRate: Math.round(dashboardData.metrics.adr * 2.0),
              isActive: true,
              lastUpdated: new Date()
            }
          ];
          setRateTypes(fallbackRateTypes);
        }
      } catch (roomTypeError) {
        console.error('Failed to fetch room types:', roomTypeError);
        // Use minimal fallback
        setRateTypes([]);
      }
      setDemandForecast(dashboardData.demandForecast);
      setMetrics(dashboardData.metrics);
      setPerformanceMetrics(dashboardData.performanceMetrics);
      setRateShopping(dashboardData.rateShopping);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch revenue data';

      // Set error state but keep fallback mock data
      setError(`${errorMessage}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`);

      // Set empty array to trigger no content display
      setRateTypes([]);
      setDemandForecast([]);
      setMetrics({
        totalRevenue: 62500,
        revPAR: 21,
        adr: 3500,
        occupancyRate: 68.5,
        rateOptimizationImpact: 12.3,
        competitiveIndex: 108,
        demandCaptureRate: 15.6,
        priceElasticity: 0.75
      });
      setPerformanceMetrics({
        currentVsTarget: 75,
        targetRevenue: 85000,
        marketShare: 62,
        rateOptimization: 83,
        revenueGrowth: 12.3
      });
      setRateShopping({
        competitors: [
          { hotelName: 'Grand Plaza', roomType: 'Standard', currentRate: 3325, availability: 15, lastUpdated: new Date(), source: 'API' },
          { hotelName: 'Royal Palace', roomType: 'Standard', currentRate: 3745, availability: 8, lastUpdated: new Date(), source: 'Scraping' }
        ],
        marketPosition: 'competitive',
        priceGap: 175,
        recommendations: [
          { action: 'Monitor competitor rates closely', impact: 'Market positioning', urgency: 'medium' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await fetchRevenueData();
  };

  const updateRateType = async (id: string, updates: Partial<RoomTypeRate>) => {
    // Get current rate for validation
    const currentRate = rateTypes.find(rate => rate.id === id);
    if (!currentRate) return;

    // Validate updates
    let hasValidationErrors = false;
    for (const [field, value] of Object.entries(updates)) {
      if (typeof value === 'number' && field !== 'lastUpdated') {
        const validationError = validateRateValue(field, value, { ...currentRate, ...updates });
        const errorKey = `${id}-${field}`;

        if (validationError) {
          setValidationErrors(prev => ({ ...prev, [errorKey]: validationError }));
          hasValidationErrors = true;
        } else {
          // Clear validation error if value is now valid
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[errorKey];
            return newErrors;
          });
        }
      }
    }

    // Don't proceed if there are validation errors
    if (hasValidationErrors) {
      return;
    }

    // Optimistically update the UI
    setRateTypes(prev => prev.map(rate =>
      rate.id === id ? { ...rate, ...updates, lastUpdated: new Date() } : rate
    ));

    try {
      // Save to backend
      await revenueManagementService.updateRoomTypeRate(id, updates);
      console.log('Room type rate updated successfully');

      // Clear any previous errors
      setError(null);

    } catch (error: any) {
      console.error('Failed to update room type rate:', error);

      // Revert the optimistic update on error
      setRateTypes(prev => prev.map(rate => {
        if (rate.id === id) {
          // Revert to previous values
          const originalRate = { ...rate };
          for (const field of Object.keys(updates)) {
            if (field in currentRate) {
              (originalRate as any)[field] = (currentRate as any)[field];
            }
          }
          return originalRate;
        }
        return rate;
      }));

      // Show user-friendly error message based on error type
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save rate changes';
      setError(`Error updating ${currentRate.roomType}: ${errorMessage}`);

      // Clear error after 7 seconds
      setTimeout(() => setError(null), 7000);
    }
  };

  const saveAllRateChanges = async () => {
    // Validate all rates before saving
    let hasAnyValidationErrors = false;
    const newValidationErrors: Record<string, string> = {};

    rateTypes.forEach(rate => {
      const fields = ['baseRate', 'currentRate', 'minRate', 'maxRate', 'occupancyThreshold'];
      fields.forEach(field => {
        const value = (rate as any)[field];
        if (typeof value === 'number') {
          const validationError = validateRateValue(field, value, rate);
          if (validationError) {
            const errorKey = `${rate.id}-${field}`;
            newValidationErrors[errorKey] = validationError;
            hasAnyValidationErrors = true;
          }
        }
      });
    });

    if (hasAnyValidationErrors) {
      setValidationErrors(newValidationErrors);
      setError('Please fix validation errors before saving all changes.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updates = rateTypes.map(rate => ({
        id: rate.id,
        baseRate: rate.baseRate,
        currentRate: rate.currentRate,
        minRate: rate.minRate,
        maxRate: rate.maxRate,
        occupancyThreshold: rate.occupancyThreshold,
        isActive: rate.isActive
      }));

      const result = await revenueManagementService.bulkUpdateRoomTypeRates(updates);
      console.log('Bulk update result:', result);

      // Show success message
      setSaveSuccess(`Successfully saved rates for all ${rateTypes.length} room types`);

      // Clear any validation errors
      setValidationErrors({});

    } catch (error: any) {
      console.error('Failed to save all rate changes:', error);

      // Handle different types of errors
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      const statusCode = error.response?.status;

      if (statusCode === 400) {
        setError('Invalid data provided. Please check your inputs and try again.');
      } else if (statusCode === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (statusCode === 403) {
        setError('You do not have permission to update pricing rates.');
      } else if (statusCode >= 500) {
        setError('Server error. Please try again later or contact support.');
      } else {
        setError(`Failed to save changes: ${errorMessage}`);
      }

      setTimeout(() => setError(null), 7000);
    } finally {
      setIsLoading(false);
    }
  };

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'peak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null;
  };

  if (isLoading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-medium">Unable to fetch latest data</h4>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-1">Showing fallback data to maintain functionality</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={isLoading}
              className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Revenue Management</h1>
          <p className="text-sm sm:text-base text-gray-600">AI-powered pricing optimization and demand intelligence</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <Label htmlFor="auto-optimization" className="text-sm">Auto Optimization</Label>
            <Switch
              id="auto-optimization"
              checked={autoOptimization}
              onCheckedChange={setAutoOptimization}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchRevenueData} className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="sm:hidden">Refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Total Revenue</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(metrics.totalRevenue)}</p>
                </div>
                <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getChangeIcon(12.3)}
                <span className={`text-xs sm:text-sm ${getChangeColor(12.3)} truncate`}>+12.3% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">RevPAR</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(metrics.revPAR)}</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getChangeIcon(8.7)}
                <span className={`text-xs sm:text-sm ${getChangeColor(8.7)} truncate`}>+8.7% optimization impact</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Competitive Index</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{metrics.competitiveIndex}</p>
                </div>
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-2 truncate">vs market average</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Demand Capture</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{metrics.demandCaptureRate}%</p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0 ml-2" />
              </div>
              <div className="text-xs sm:text-sm text-green-600 mt-2 truncate">Excellent performance</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Save className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h4 className="text-green-800 font-medium">Changes Saved Successfully</h4>
              <p className="text-green-600 text-sm">{saveSuccess}</p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs sm:text-sm">Dynamic Pricing</TabsTrigger>
          <TabsTrigger value="demand" className="text-xs sm:text-sm">Demand Intelligence</TabsTrigger>
          <TabsTrigger value="competition" className="text-xs sm:text-sm">Rate Shopping</TabsTrigger>
          <TabsTrigger value="forecasting" className="text-xs sm:text-sm">AI Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Revenue Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Current vs Target</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: getProgressBarWidth(performanceMetrics?.currentVsTarget || 0) }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm font-medium w-8">{performanceMetrics?.currentVsTarget || 0}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Market Share</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: getProgressBarWidth(performanceMetrics?.marketShare || 0) }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm font-medium w-8">{performanceMetrics?.marketShare || 0}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm font-medium">Rate Optimization</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: getProgressBarWidth(performanceMetrics?.rateOptimization || 0) }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm font-medium w-8">{performanceMetrics?.rateOptimization || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-green-800 text-sm sm:text-base">Increase Weekend Rates</span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-700">High demand predicted for weekends. Increase rates by 15-20%.</p>
                    <p className="text-xs text-green-600 mt-1">Potential revenue: +₹95K</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-blue-800 text-sm sm:text-base">Optimize Corporate Rates</span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-700">Adjust corporate discount tiers based on volume commitments.</p>
                    <p className="text-xs text-blue-600 mt-1">Impact: +8% corporate revenue</p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span className="font-medium text-orange-800 text-sm sm:text-base">Competitive Response</span>
                    </div>
                    <p className="text-xs sm:text-sm text-orange-700">Grand Plaza reduced rates by 8%. Consider tactical response.</p>
                    <p className="text-xs text-orange-600 mt-1">Urgency: High</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  Dynamic Pricing Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 sm:space-y-6">
                  {rateTypes.map(rate => (
                    <div key={rate.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="font-medium text-sm sm:text-base">{rate.roomType}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {rate.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={rate.isActive}
                            onCheckedChange={(checked) => updateRateType(rate.id, { isActive: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-xs sm:text-sm">Base Rate</Label>
                          <Input
                            type="number"
                            value={rate.baseRate}
                            onChange={(e) => updateRateType(rate.id, { baseRate: parseFloat(e.target.value) })}
                            className={`text-sm ${validationErrors[`${rate.id}-baseRate`] ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          {validationErrors[`${rate.id}-baseRate`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`${rate.id}-baseRate`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Current Rate</Label>
                          <Input
                            type="number"
                            value={rate.currentRate}
                            onChange={(e) => updateRateType(rate.id, { currentRate: parseFloat(e.target.value) })}
                            className={`text-sm ${validationErrors[`${rate.id}-currentRate`] ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          {validationErrors[`${rate.id}-currentRate`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`${rate.id}-currentRate`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Min Rate</Label>
                          <Input
                            type="number"
                            value={rate.minRate}
                            onChange={(e) => updateRateType(rate.id, { minRate: parseFloat(e.target.value) })}
                            className={`text-sm ${validationErrors[`${rate.id}-minRate`] ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          {validationErrors[`${rate.id}-minRate`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`${rate.id}-minRate`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs sm:text-sm">Max Rate</Label>
                          <Input
                            type="number"
                            value={rate.maxRate}
                            onChange={(e) => updateRateType(rate.id, { maxRate: parseFloat(e.target.value) })}
                            className={`text-sm ${validationErrors[`${rate.id}-maxRate`] ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                          {validationErrors[`${rate.id}-maxRate`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`${rate.id}-maxRate`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label className="text-xs sm:text-sm">Occupancy Threshold: {rate.occupancyThreshold}%</Label>
                        <Slider
                          value={[rate.occupancyThreshold]}
                          onValueChange={([value]) => updateRateType(rate.id, { occupancyThreshold: value })}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div className="mt-2 text-xs sm:text-sm text-gray-600">
                        Last updated: {rate.lastUpdated.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {rateTypes.length > 0 && (
                    <div className="flex justify-end pt-4 mt-6 border-t">
                      <Button
                        onClick={saveAllRateChanges}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save All Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demand">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                Demand Intelligence & Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {demandForecast.map((forecast, index) => (
                  <div key={index} className="p-3 sm:p-4 border rounded-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="text-center sm:text-left">
                          <div className="font-medium text-sm sm:text-base">{new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-xs sm:text-sm text-gray-500">{new Date(forecast.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        </div>
                        
                        <Badge className={`text-xs ${getDemandLevelColor(forecast.demandLevel)}`}>
                          {forecast.demandLevel.toUpperCase()}
                        </Badge>
                        
                        <div className="text-xs sm:text-sm">
                          <div className="font-medium">{forecast.predictedOccupancy}% occupancy predicted</div>
                          <div className="text-gray-500">{forecast.confidence}% confidence</div>
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <div className={`text-base sm:text-lg font-bold ${getChangeColor(forecast.recommendedRateChange)}`}>
                          {forecast.recommendedRateChange > 0 ? '+' : ''}{forecast.recommendedRateChange}%
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">rate change</div>
                        <div className="text-xs sm:text-sm font-medium">{formatCurrency(forecast.potentialRevenue)}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      {forecast.factors.map((factor, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition">
          {rateShopping && (
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    Competitive Rate Shopping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm sm:text-base">Market Position</p>
                        <p className="text-xs sm:text-sm text-gray-600">Your pricing vs competitors</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <Badge className={`text-xs ${
                          rateShopping.marketPosition === 'leader' ? 'bg-green-100 text-green-800' :
                          rateShopping.marketPosition === 'competitive' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {rateShopping.marketPosition.toUpperCase()}
                        </Badge>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatCurrency(rateShopping.priceGap)} gap
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">Competitor Rates</h4>
                      {rateShopping.competitors.map((comp, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{comp.hotelName}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{comp.roomType} • {comp.availability} rooms available</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="font-bold">{formatCurrency(comp.currentRate)}</p>
                            <p className="text-xs text-gray-500">{comp.source} • {new Date(comp.lastUpdated).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm sm:text-base">Recommendations</h4>
                      {rateShopping.recommendations.map((rec, index) => (
                        <div key={index} className={`p-3 rounded border-l-4 ${
                          rec.urgency === 'high' ? 'border-red-500 bg-red-50' :
                          rec.urgency === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                          'border-green-500 bg-green-50'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <p className="font-medium text-sm sm:text-base">{rec.action}</p>
                            <Badge variant="outline" className="text-xs w-fit">{rec.urgency}</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{rec.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="forecasting">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                AI Revenue Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <LineChart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">₹12.5M</p>
                    <p className="text-xs sm:text-sm text-gray-600">30-day forecast</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-green-600">+18%</p>
                    <p className="text-xs sm:text-sm text-gray-600">vs last period</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">92%</p>
                    <p className="text-xs sm:text-sm text-gray-600">forecast accuracy</p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 text-sm sm:text-base">Key Forecast Drivers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Positive Factors</p>
                      <ul className="space-y-1 text-xs sm:text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          Conference season starting
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          Increased corporate travel
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          Holiday booking surge
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Risk Factors</p>
                      <ul className="space-y-1 text-xs sm:text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                          New competitor opening
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                          Economic uncertainty
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                          Seasonal demand decline
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagementDashboard;