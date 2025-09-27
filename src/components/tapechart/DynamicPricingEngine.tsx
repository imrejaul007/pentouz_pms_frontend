import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/utils/toast';
import {
  TrendingUp, TrendingDown, Target, Brain, BarChart3, Zap,
  Settings, Eye, AlertTriangle, CheckCircle, DollarSign,
  Users, Calendar, MapPin, Cloud, ThermometerSun, Plane,
  Building2, Star, Trophy, Activity, Lightbulb, Sparkles
} from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';

// Dynamic Pricing Interfaces
interface PricingRule {
  id: string;
  name: string;
  type: 'occupancy' | 'demand' | 'competitor' | 'seasonal' | 'event' | 'weather';
  condition: string;
  adjustment: number; // Percentage adjustment
  priority: number;
  isActive: boolean;
  lastTriggered?: string;
}

interface MarketIntelligence {
  competitorRates: {
    hotelName: string;
    rating: number;
    distance: string;
    rate: number;
    availability: boolean;
    source: string;
  }[];
  localEvents: {
    name: string;
    date: string;
    impact: 'high' | 'medium' | 'low';
    demandMultiplier: number;
  }[];
  weatherForecast: {
    date: string;
    condition: string;
    temperature: number;
    precipitation: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  marketTrends: {
    bookingVelocity: number;
    priceElasticity: number;
    demandIndex: number;
    competitivePosition: 'above' | 'at' | 'below';
  };
}

interface OptimalPricing {
  roomType: string;
  date: string;
  currentRate: number;
  optimalRate: number;
  confidence: number;
  reasoning: string[];
  projectedRevenue: number;
  demandLevel: 'high' | 'medium' | 'low';
  competitivePosition: string;
}

interface DynamicPricingEngineProps {}

export const DynamicPricingEngine: React.FC<DynamicPricingEngineProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [optimalPricing, setOptimalPricing] = useState<OptimalPricing[]>([]);
  const [autoOptimization, setAutoOptimization] = useState(true);
  const [loading, setLoading] = useState(false);

  // Mock data generation for realistic business scenarios
  useEffect(() => {
    generateMockPricingRules();
    generateMockMarketIntelligence();
    generateMockOptimalPricing();
  }, []);

  const generateMockPricingRules = () => {
    const rules: PricingRule[] = [
      {
        id: 'rule-1',
        name: 'High Occupancy Premium',
        type: 'occupancy',
        condition: 'Occupancy > 85%',
        adjustment: 15,
        priority: 1,
        isActive: true,
        lastTriggered: '2025-09-23T14:30:00Z'
      },
      {
        id: 'rule-2',
        name: 'Weekend Surge Pricing',
        type: 'seasonal',
        condition: 'Weekend nights',
        adjustment: 25,
        priority: 2,
        isActive: true,
        lastTriggered: '2025-09-22T18:00:00Z'
      },
      {
        id: 'rule-3',
        name: 'Conference Event Premium',
        type: 'event',
        condition: 'Major local event',
        adjustment: 40,
        priority: 1,
        isActive: true,
        lastTriggered: '2025-09-20T09:15:00Z'
      },
      {
        id: 'rule-4',
        name: 'Competitor Undercutting',
        type: 'competitor',
        condition: 'Our rate > Competitor average + 10%',
        adjustment: -8,
        priority: 3,
        isActive: true
      },
      {
        id: 'rule-5',
        name: 'Low Demand Discount',
        type: 'demand',
        condition: 'Booking velocity < 20% of target',
        adjustment: -12,
        priority: 4,
        isActive: false
      },
      {
        id: 'rule-6',
        name: 'Perfect Weather Premium',
        type: 'weather',
        condition: 'Sunny, 22-28°C, No precipitation',
        adjustment: 10,
        priority: 3,
        isActive: true
      }
    ];
    setPricingRules(rules);
  };

  const generateMockMarketIntelligence = () => {
    const intelligence: MarketIntelligence = {
      competitorRates: [
        {
          hotelName: 'Grand Palace Hotel',
          rating: 5,
          distance: '0.3 km',
          rate: 18500,
          availability: true,
          source: 'Booking.com'
        },
        {
          hotelName: 'City Center Inn',
          rating: 4,
          distance: '0.8 km',
          rate: 14200,
          availability: true,
          source: 'Expedia'
        },
        {
          hotelName: 'Business Tower Hotel',
          rating: 4,
          distance: '1.2 km',
          rate: 16800,
          availability: false,
          source: 'Agoda'
        },
        {
          hotelName: 'Comfort Suites',
          rating: 3,
          distance: '2.1 km',
          rate: 11500,
          availability: true,
          source: 'Hotels.com'
        }
      ],
      localEvents: [
        {
          name: 'Tech Innovation Summit 2025',
          date: '2025-09-28',
          impact: 'high',
          demandMultiplier: 2.4
        },
        {
          name: 'International Food Festival',
          date: '2025-10-05',
          impact: 'medium',
          demandMultiplier: 1.6
        },
        {
          name: 'City Marathon',
          date: '2025-10-12',
          impact: 'medium',
          demandMultiplier: 1.8
        }
      ],
      weatherForecast: [
        {
          date: '2025-09-24',
          condition: 'Sunny',
          temperature: 26,
          precipitation: 0,
          impact: 'positive'
        },
        {
          date: '2025-09-25',
          condition: 'Partly Cloudy',
          temperature: 24,
          precipitation: 10,
          impact: 'neutral'
        },
        {
          date: '2025-09-26',
          condition: 'Rainy',
          temperature: 20,
          precipitation: 85,
          impact: 'negative'
        }
      ],
      marketTrends: {
        bookingVelocity: 127, // 27% above target
        priceElasticity: 1.2,
        demandIndex: 8.4,
        competitivePosition: 'above'
      }
    };
    setMarketData(intelligence);
  };

  const generateMockOptimalPricing = () => {
    const roomTypes = ['Deluxe Room', 'Executive Suite', 'Presidential Suite', 'Standard Room'];
    const pricing: OptimalPricing[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      roomTypes.forEach(roomType => {
        const baseRate = roomType === 'Presidential Suite' ? 25000 :
                        roomType === 'Executive Suite' ? 18000 :
                        roomType === 'Deluxe Room' ? 15000 : 12000;

        const isWeekendDate = isWeekend(date);
        const demandMultiplier = isWeekendDate ? 1.3 : Math.random() * 0.4 + 0.8;

        pricing.push({
          roomType,
          date: format(date, 'yyyy-MM-dd'),
          currentRate: baseRate,
          optimalRate: Math.round(baseRate * demandMultiplier),
          confidence: Math.round(75 + Math.random() * 20),
          reasoning: [
            isWeekendDate ? 'Weekend premium applied' : 'Weekday rates',
            demandMultiplier > 1.1 ? 'High demand detected' : 'Standard demand',
            'Competitor analysis completed',
            'Weather impact factored'
          ],
          projectedRevenue: Math.round(baseRate * demandMultiplier * (0.85 + Math.random() * 0.1)),
          demandLevel: demandMultiplier > 1.2 ? 'high' : demandMultiplier > 0.9 ? 'medium' : 'low',
          competitivePosition: 'Competitive with market leaders'
        });
      });
    }

    setOptimalPricing(pricing);
  };

  const handleApplyOptimalPricing = async () => {
    setLoading(true);
    try {
      // Simulate API call to apply pricing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Optimal pricing applied to all room types');

      // Simulate rule triggering
      setPricingRules(prev => prev.map(rule =>
        rule.isActive ? { ...rule, lastTriggered: new Date().toISOString() } : rule
      ));

    } catch (error) {
      toast.error('Failed to apply optimal pricing');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    setPricingRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (type: string) => {
    switch (type) {
      case 'occupancy': return <Users className="h-4 w-4" />;
      case 'demand': return <TrendingUp className="h-4 w-4" />;
      case 'competitor': return <Target className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      case 'event': return <MapPin className="h-4 w-4" />;
      case 'weather': return <ThermometerSun className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100 transition-all duration-200"
        >
          <DollarSign className="h-4 w-4 mr-2 text-purple-600" />
          Dynamic Pricing
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
          >
            AI
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Dynamic Pricing & Revenue Management
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              AI-Powered
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Intelligent rate optimization using machine learning, market analysis, and competitor monitoring
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pricing Rules
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Market Intel
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Optimization
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Key Metrics */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Revenue Impact</p>
                      <p className="text-2xl font-bold text-green-700">+18.2%</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs manual pricing</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Optimal Pricing</p>
                      <p className="text-2xl font-bold text-blue-700">94.3%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">accuracy rate</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Rules</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {pricingRules.filter(r => r.isActive).length}
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">auto adjustments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Market Position</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {marketData?.marketTrends.competitivePosition.toUpperCase()}
                      </p>
                    </div>
                    <Trophy className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs competitors</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Auto-Adjustments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Auto-Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pricingRules
                    .filter(rule => rule.lastTriggered)
                    .slice(0, 5)
                    .map((rule, index) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTrendIcon(rule.type)}
                          <div>
                            <p className="font-medium text-sm">{rule.name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(rule.lastTriggered!), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${rule.adjustment > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                          >
                            {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pricing Rules Configuration</h3>
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Lightbulb className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="grid gap-4">
              {pricingRules.map((rule) => (
                <Card key={rule.id} className={`transition-all ${rule.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(rule.type)}
                          <div>
                            <h4 className="font-medium">{rule.name}</h4>
                            <p className="text-sm text-gray-600">{rule.condition}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={`${rule.adjustment > 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                        </Badge>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          Priority {rule.priority}
                        </Badge>
                        <Button
                          variant={rule.isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleRule(rule.id)}
                          className={rule.isActive ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {rule.isActive ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {rule.lastTriggered && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last triggered: {format(new Date(rule.lastTriggered), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            {marketData && (
              <>
                {/* Competitor Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Competitor Rate Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {marketData.competitorRates.map((competitor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {Array.from({length: competitor.rating}).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                              ))}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{competitor.hotelName}</p>
                              <p className="text-xs text-gray-500">{competitor.distance} • {competitor.source}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-lg">₹{competitor.rate.toLocaleString()}</span>
                            <Badge variant={competitor.availability ? 'default' : 'secondary'}>
                              {competitor.availability ? 'Available' : 'Sold Out'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Local Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      Upcoming Local Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {marketData.localEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{event.name}</p>
                            <p className="text-xs text-gray-500">{format(new Date(event.date), 'MMM dd, yyyy')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${
                              event.impact === 'high' ? 'bg-red-100 text-red-700' :
                              event.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {event.impact.toUpperCase()} Impact
                            </Badge>
                            <span className="text-sm font-medium">
                              {event.demandMultiplier}x Demand
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Forecast */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ThermometerSun className="h-5 w-5 text-orange-600" />
                      Weather Impact Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {marketData.weatherForecast.map((weather, index) => (
                        <Card key={index} className="p-3">
                          <div className="text-center">
                            <p className="font-medium text-sm">
                              {format(new Date(weather.date), 'MMM dd')}
                            </p>
                            <div className="flex items-center justify-center gap-1 my-2">
                              {getImpactIcon(weather.impact)}
                              <span className="text-lg font-bold">{weather.temperature}°C</span>
                            </div>
                            <p className="text-xs text-gray-600">{weather.condition}</p>
                            <p className="text-xs text-gray-500">{weather.precipitation}% rain</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI-Powered Rate Optimization</h3>
              <Button
                onClick={handleApplyOptimalPricing}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Optimal Pricing
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4">
              {optimalPricing.slice(0, 8).map((pricing, index) => (
                <Card key={index} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{pricing.roomType}</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(pricing.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge className={getDemandColor(pricing.demandLevel)}>
                          {pricing.demandLevel.toUpperCase()} Demand
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              ₹{pricing.currentRate.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              ₹{pricing.optimalRate.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={pricing.confidence} className="w-16 h-2" />
                            <span className="text-xs text-gray-500">{pricing.confidence}% confidence</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            ₹{pricing.projectedRevenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">projected revenue</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {pricing.reasoning.map((reason, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    AI Revenue Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Smart Recommendation</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Increase weekend rates by 8-12% for Executive Suites. Competitor analysis shows 15% pricing gap with similar properties.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">Demand Forecast</span>
                    </div>
                    <p className="text-sm text-green-800">
                      High demand predicted for Oct 5-8. Consider implementing 20% surge pricing 3 days before event.
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-900">Risk Alert</span>
                    </div>
                    <p className="text-sm text-orange-800">
                      Standard rooms showing 15% booking velocity decline. Consider promotional pricing or package deals.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue Per Available Room</span>
                      <span className="font-bold">₹12,450</span>
                    </div>
                    <Progress value={82} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Daily Rate</span>
                      <span className="font-bold">₹16,750</span>
                    </div>
                    <Progress value={76} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pricing Accuracy</span>
                      <span className="font-bold">94.3%</span>
                    </div>
                    <Progress value={94} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Market Share</span>
                      <span className="font-bold">23.1%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">+18.2%</p>
                      <p className="text-xs text-gray-500">Revenue Growth</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">-5.8%</p>
                      <p className="text-xs text-gray-500">Cost Reduction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Learning Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Learning & Model Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                      <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="font-bold text-lg">15,847</p>
                      <p className="text-sm text-gray-600">Training Data Points</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-bold text-lg">94.3%</p>
                      <p className="text-sm text-gray-600">Model Accuracy</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-bold text-lg">Live</p>
                      <p className="text-sm text-gray-600">Learning Status</p>
                    </div>
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