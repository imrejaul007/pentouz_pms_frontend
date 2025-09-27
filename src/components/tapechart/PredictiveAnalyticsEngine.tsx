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
  Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Users,
  Calendar, DollarSign, Activity, Sparkles, Eye, BarChart3,
  UserX, Clock, Zap, Award, CheckCircle, XCircle, LineChart,
  PieChart, Settings, Lightbulb, Star, Crown, Building2,
  Phone, Mail, Heart, Baby, Plane, Coffee, MapPin
} from 'lucide-react';
import { format, addDays, subDays, isWeekend } from 'date-fns';

// Predictive Analytics Interfaces
interface NoShowPrediction {
  bookingId: string;
  guestName: string;
  checkInDate: string;
  roomType: string;
  noShowProbability: number;
  risk: 'high' | 'medium' | 'low';
  factors: string[];
  recommendedAction: string;
  potentialRevenueLoss: number;
}

interface DemandForecast {
  date: string;
  predictedOccupancy: number;
  confidence: number;
  demandLevel: 'high' | 'medium' | 'low';
  roomTypeBreakdown: {
    roomType: string;
    predictedBookings: number;
    optimalRate: number;
  }[];
  influencingFactors: string[];
}

interface GuestValuePrediction {
  guestId: string;
  guestName: string;
  currentValue: number;
  predictedLifetimeValue: number;
  valueTier: 'platinum' | 'gold' | 'silver' | 'bronze';
  loyaltyScore: number;
  churnRisk: number;
  nextBookingProbability: number;
  recommendedPerks: string[];
}

interface OverbookingRecommendation {
  date: string;
  roomType: string;
  currentBookings: number;
  optimalOverbooking: number;
  riskLevel: 'low' | 'medium' | 'high';
  expectedWalkIns: number;
  potentialRevenue: number;
  riskAssessment: string;
}

interface LengthOfStayPrediction {
  bookingId: string;
  guestName: string;
  initialStay: number;
  predictedExtension: number;
  extensionProbability: number;
  factors: string[];
  upsellOpportunities: string[];
}

interface PredictiveAnalyticsEngineProps {}

export const PredictiveAnalyticsEngine: React.FC<PredictiveAnalyticsEngineProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [noShowPredictions, setNoShowPredictions] = useState<NoShowPrediction[]>([]);
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [guestValuePredictions, setGuestValuePredictions] = useState<GuestValuePrediction[]>([]);
  const [overbookingRecommendations, setOverbookingRecommendations] = useState<OverbookingRecommendation[]>([]);
  const [lengthOfStayPredictions, setLengthOfStayPredictions] = useState<LengthOfStayPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data generation for realistic business scenarios
  useEffect(() => {
    generateMockNoShowPredictions();
    generateMockDemandForecasts();
    generateMockGuestValuePredictions();
    generateMockOverbookingRecommendations();
    generateMockLengthOfStayPredictions();
  }, []);

  const generateMockNoShowPredictions = () => {
    const guestNames = ['John Smith', 'Maria Garcia', 'David Wilson', 'Sarah Johnson', 'Michael Brown'];
    const roomTypes = ['Deluxe Room', 'Executive Suite', 'Presidential Suite', 'Standard Room'];
    const factors = [
      'First-time guest',
      'Booking made last minute',
      'No credit card on file',
      'Historical no-show pattern',
      'Weather conditions',
      'Business traveler',
      'Group booking',
      'Low advance payment'
    ];

    const predictions: NoShowPrediction[] = [];

    for (let i = 0; i < 8; i++) {
      const probability = Math.random() * 100;
      const risk = probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low';

      predictions.push({
        bookingId: `BK-${String(Date.now() + i).slice(-6)}`,
        guestName: guestNames[i % guestNames.length],
        checkInDate: format(addDays(new Date(), i), 'yyyy-MM-dd'),
        roomType: roomTypes[i % roomTypes.length],
        noShowProbability: Math.round(probability),
        risk,
        factors: factors.slice(0, 2 + Math.floor(Math.random() * 3)),
        recommendedAction: risk === 'high' ? 'Require deposit confirmation' :
                          risk === 'medium' ? 'Send reminder email' : 'Monitor booking',
        potentialRevenueLoss: Math.round((12000 + Math.random() * 8000))
      });
    }

    setNoShowPredictions(predictions);
  };

  const generateMockDemandForecasts = () => {
    const roomTypes = ['Deluxe Room', 'Executive Suite', 'Presidential Suite', 'Standard Room'];
    const forecasts: DemandForecast[] = [];

    for (let i = 0; i < 14; i++) {
      const date = addDays(new Date(), i);
      const isWeekendDate = isWeekend(date);
      const baseOccupancy = isWeekendDate ? 85 + Math.random() * 10 : 65 + Math.random() * 20;

      forecasts.push({
        date: format(date, 'yyyy-MM-dd'),
        predictedOccupancy: Math.round(baseOccupancy),
        confidence: Math.round(80 + Math.random() * 15),
        demandLevel: baseOccupancy > 85 ? 'high' : baseOccupancy > 70 ? 'medium' : 'low',
        roomTypeBreakdown: roomTypes.map(roomType => ({
          roomType,
          predictedBookings: Math.round(5 + Math.random() * 10),
          optimalRate: Math.round((roomType === 'Presidential Suite' ? 25000 :
                                 roomType === 'Executive Suite' ? 18000 :
                                 roomType === 'Deluxe Room' ? 15000 : 12000) * (0.9 + Math.random() * 0.2))
        })),
        influencingFactors: [
          isWeekendDate ? 'Weekend demand surge' : 'Weekday business travel',
          'Seasonal patterns',
          'Local events impact',
          'Weather forecast',
          'Competitor pricing'
        ].slice(0, 3 + Math.floor(Math.random() * 2))
      });
    }

    setDemandForecasts(forecasts);
  };

  const generateMockGuestValuePredictions = () => {
    const guestNames = [
      'Robert Anderson', 'Emily Davis', 'James Martinez', 'Jennifer Taylor',
      'Christopher Moore', 'Jessica White', 'Daniel Harris', 'Ashley Clark'
    ];

    const predictions: GuestValuePrediction[] = [];

    guestNames.forEach((name, index) => {
      const currentValue = Math.round(50000 + Math.random() * 200000);
      const lifetimeMultiplier = 2 + Math.random() * 4;
      const loyaltyScore = Math.round(60 + Math.random() * 40);

      predictions.push({
        guestId: `G-${String(Date.now() + index).slice(-6)}`,
        guestName: name,
        currentValue,
        predictedLifetimeValue: Math.round(currentValue * lifetimeMultiplier),
        valueTier: loyaltyScore > 90 ? 'platinum' :
                  loyaltyScore > 75 ? 'gold' :
                  loyaltyScore > 60 ? 'silver' : 'bronze',
        loyaltyScore,
        churnRisk: Math.round(Math.random() * 40),
        nextBookingProbability: Math.round(60 + Math.random() * 35),
        recommendedPerks: [
          'Room upgrade',
          'Late checkout',
          'Welcome amenity',
          'Spa discount',
          'Restaurant voucher',
          'Loyalty points bonus'
        ].slice(0, 2 + Math.floor(Math.random() * 3))
      });
    });

    setGuestValuePredictions(predictions);
  };

  const generateMockOverbookingRecommendations = () => {
    const roomTypes = ['Deluxe Room', 'Executive Suite', 'Standard Room'];
    const recommendations: OverbookingRecommendation[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      roomTypes.forEach(roomType => {
        const currentBookings = Math.round(15 + Math.random() * 10);
        const optimalOverbooking = Math.round(currentBookings * (1.05 + Math.random() * 0.1));

        recommendations.push({
          date: format(date, 'yyyy-MM-dd'),
          roomType,
          currentBookings,
          optimalOverbooking,
          riskLevel: optimalOverbooking - currentBookings > 2 ? 'high' :
                    optimalOverbooking - currentBookings > 1 ? 'medium' : 'low',
          expectedWalkIns: Math.round(Math.random() * 3),
          potentialRevenue: Math.round((optimalOverbooking - currentBookings) * 15000 * 0.8),
          riskAssessment: 'Based on historical no-show patterns and booking velocity'
        });
      });
    }

    setOverbookingRecommendations(recommendations);
  };

  const generateMockLengthOfStayPredictions = () => {
    const guestNames = ['Alex Thompson', 'Lisa Wilson', 'Mark Johnson', 'Rachel Green'];
    const predictions: LengthOfStayPrediction[] = [];

    guestNames.forEach((name, index) => {
      const initialStay = 2 + Math.floor(Math.random() * 5);
      const extensionProbability = Math.round(30 + Math.random() * 50);

      predictions.push({
        bookingId: `BK-${String(Date.now() + index).slice(-6)}`,
        guestName: name,
        initialStay,
        predictedExtension: Math.floor(Math.random() * 3) + 1,
        extensionProbability,
        factors: [
          'Business trip flexibility',
          'Positive guest satisfaction',
          'Local event attendance',
          'Weather conditions',
          'Available room inventory'
        ].slice(0, 2 + Math.floor(Math.random() * 2)),
        upsellOpportunities: [
          'Spa package',
          'Airport transfer',
          'City tour',
          'Restaurant reservation',
          'Late checkout'
        ].slice(0, 1 + Math.floor(Math.random() * 3))
      });
    });

    setLengthOfStayPredictions(predictions);
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Refresh all predictions
      generateMockNoShowPredictions();
      generateMockDemandForecasts();
      generateMockGuestValuePredictions();
      generateMockOverbookingRecommendations();
      generateMockLengthOfStayPredictions();

      toast.success('Predictive analysis completed successfully');
    } catch (error) {
      toast.error('Failed to run predictive analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-purple-700 bg-purple-100';
      case 'gold': return 'text-yellow-700 bg-yellow-100';
      case 'silver': return 'text-gray-700 bg-gray-100';
      case 'bronze': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'gold': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'silver': return <Award className="h-4 w-4 text-gray-600" />;
      case 'bronze': return <Activity className="h-4 w-4 text-orange-600" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
        >
          <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
          AI Insights
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
          >
            ML
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Predictive Analytics & AI Insights
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              Machine Learning
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Advanced ML-powered predictions for no-shows, demand forecasting, guest behavior, and revenue optimization
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="noshows" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              No-Shows
            </TabsTrigger>
            <TabsTrigger value="demand" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Demand
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guest Value
            </TabsTrigger>
            <TabsTrigger value="overbooking" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overbooking
            </TabsTrigger>
            <TabsTrigger value="los" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Stay Length
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Analytics Overview</h3>
              <Button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Key Metrics */}
              <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High No-Show Risk</p>
                      <p className="text-2xl font-bold text-red-700">
                        {noShowPredictions.filter(p => p.risk === 'high').length}
                      </p>
                    </div>
                    <UserX className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">bookings at risk</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Demand Forecast</p>
                      <p className="text-2xl font-bold text-green-700">
                        {demandForecasts[0]?.predictedOccupancy || 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">next 7 days avg</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">VIP Guests</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {guestValuePredictions.filter(g => g.valueTier === 'platinum' || g.valueTier === 'gold').length}
                      </p>
                    </div>
                    <Crown className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">high value guests</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Revenue Impact</p>
                      <p className="text-2xl font-bold text-orange-700">+12.8%</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs baseline</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Weekend Demand Surge</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Predicted 95% occupancy this weekend. Consider dynamic pricing activation.
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-900">No-Show Alert</p>
                    <p className="text-xs text-red-700 mt-1">
                      3 bookings with 80%+ no-show probability detected for tomorrow.
                    </p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900">Upsell Opportunity</p>
                    <p className="text-xs text-green-700 mt-1">
                      4 guests likely to extend stay. Potential additional revenue: ₹85,000
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Model Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">No-Show Accuracy</span>
                      <span className="font-bold">91.2%</span>
                    </div>
                    <Progress value={91} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Demand Forecast</span>
                      <span className="font-bold">88.7%</span>
                    </div>
                    <Progress value={89} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Guest Value Prediction</span>
                      <span className="font-bold">84.3%</span>
                    </div>
                    <Progress value={84} className="h-2" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stay Extension</span>
                      <span className="font-bold">76.8%</span>
                    </div>
                    <Progress value={77} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="noshows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">No-Show Risk Predictions</h3>
              <Badge className="bg-red-100 text-red-700">
                {noShowPredictions.filter(p => p.risk === 'high').length} High Risk
              </Badge>
            </div>

            <div className="grid gap-4">
              {noShowPredictions.map((prediction) => (
                <Card key={prediction.bookingId} className={`transition-all border-l-4 ${
                  prediction.risk === 'high' ? 'border-l-red-500 bg-red-50/30' :
                  prediction.risk === 'medium' ? 'border-l-yellow-500 bg-yellow-50/30' :
                  'border-l-green-500 bg-green-50/30'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{prediction.guestName}</h4>
                          <p className="text-sm text-gray-600">{prediction.bookingId}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(prediction.checkInDate), 'MMM dd, yyyy')} • {prediction.roomType}
                          </p>
                        </div>
                        <Badge className={getRiskColor(prediction.risk)}>
                          {prediction.risk.toUpperCase()} RISK
                        </Badge>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <Progress value={prediction.noShowProbability} className="w-24 h-2" />
                          <span className="text-sm font-medium">{prediction.noShowProbability}%</span>
                        </div>
                        <p className="text-sm text-red-600 font-medium">
                          ₹{prediction.potentialRevenueLoss.toLocaleString()} at risk
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {prediction.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-600 font-medium">
                          Recommended: {prediction.recommendedAction}
                        </p>
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="demand" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">14-Day Demand Forecast</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">
                  Avg Confidence: {Math.round(demandForecasts.reduce((acc, f) => acc + f.confidence, 0) / demandForecasts.length)}%
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              {demandForecasts.slice(0, 7).map((forecast) => (
                <Card key={forecast.date} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {format(new Date(forecast.date), 'MMM dd, yyyy')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(forecast.date), 'EEEE')}
                          </p>
                        </div>
                        <Badge className={`${
                          forecast.demandLevel === 'high' ? 'bg-red-100 text-red-700' :
                          forecast.demandLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {forecast.demandLevel.toUpperCase()} Demand
                        </Badge>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={forecast.predictedOccupancy} className="w-24 h-2" />
                          <span className="text-lg font-bold">{forecast.predictedOccupancy}%</span>
                        </div>
                        <p className="text-xs text-gray-500">{forecast.confidence}% confidence</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {forecast.roomTypeBreakdown.map((room, i) => (
                          <div key={i} className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600">{room.roomType}</p>
                            <p className="text-sm font-medium">{room.predictedBookings} bookings</p>
                            <p className="text-xs text-green-600">₹{room.optimalRate.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {forecast.influencingFactors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guests" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Guest Lifetime Value Predictions</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700">
                  {guestValuePredictions.filter(g => g.valueTier === 'platinum').length} Platinum
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {guestValuePredictions.filter(g => g.valueTier === 'gold').length} Gold
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              {guestValuePredictions.map((guest) => (
                <Card key={guest.guestId} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTierIcon(guest.valueTier)}
                            <h4 className="font-medium">{guest.guestName}</h4>
                            <Badge className={getTierColor(guest.valueTier)}>
                              {guest.valueTier.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{guest.guestId}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-bold">₹{guest.currentValue.toLocaleString()}</p>
                        <p className="text-sm text-green-600 font-medium">
                          LTV: ₹{guest.predictedLifetimeValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Loyalty Score</p>
                        <div className="flex items-center justify-center gap-1">
                          <Progress value={guest.loyaltyScore} className="w-12 h-1" />
                          <span className="text-sm font-medium">{guest.loyaltyScore}</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500">Churn Risk</p>
                        <div className="flex items-center justify-center gap-1">
                          <Progress value={guest.churnRisk} className="w-12 h-1" />
                          <span className="text-sm font-medium">{guest.churnRisk}%</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500">Next Booking</p>
                        <div className="flex items-center justify-center gap-1">
                          <Progress value={guest.nextBookingProbability} className="w-12 h-1" />
                          <span className="text-sm font-medium">{guest.nextBookingProbability}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Recommended Perks:</p>
                      <div className="flex flex-wrap gap-1">
                        {guest.recommendedPerks.map((perk, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {perk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overbooking" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Optimal Overbooking Recommendations</h3>
              <Badge className="bg-blue-100 text-blue-700">
                ML-Powered Risk Assessment
              </Badge>
            </div>

            <div className="grid gap-4">
              {overbookingRecommendations.slice(0, 6).map((rec, index) => (
                <Card key={index} className={`transition-all border-l-4 ${
                  rec.riskLevel === 'high' ? 'border-l-red-500' :
                  rec.riskLevel === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {format(new Date(rec.date), 'MMM dd, yyyy')} • {rec.roomType}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Current: {rec.currentBookings} bookings • Optimal: {rec.optimalOverbooking}
                          </p>
                        </div>
                        <Badge className={getRiskColor(rec.riskLevel)}>
                          {rec.riskLevel.toUpperCase()} Risk
                        </Badge>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Potential Revenue</p>
                        <p className="text-lg font-bold text-green-600">
                          +₹{rec.potentialRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expected walk-ins: {rec.expectedWalkIns}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2">
                      <p className="text-xs text-gray-600">{rec.riskAssessment}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="los" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Length of Stay Predictions</h3>
              <Badge className="bg-green-100 text-green-700">
                Upsell Opportunities Identified
              </Badge>
            </div>

            <div className="grid gap-4">
              {lengthOfStayPredictions.map((prediction) => (
                <Card key={prediction.bookingId} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">{prediction.guestName}</h4>
                          <p className="text-sm text-gray-600">{prediction.bookingId}</p>
                          <p className="text-sm text-gray-500">
                            Current stay: {prediction.initialStay} nights
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-600">Extension chance:</span>
                          <Progress value={prediction.extensionProbability} className="w-16 h-2" />
                          <span className="text-sm font-medium">{prediction.extensionProbability}%</span>
                        </div>
                        <p className="text-sm font-medium text-blue-600">
                          +{prediction.predictedExtension} nights likely
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Influencing Factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.factors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Upsell Opportunities:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.upsellOpportunities.map((opportunity, i) => (
                            <Badge key={i} className="text-xs bg-green-100 text-green-700">
                              {opportunity}
                            </Badge>
                          ))}
                        </div>
                      </div>
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