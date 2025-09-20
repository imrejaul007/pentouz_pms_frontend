import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ArrowUpIcon, StarIcon, CreditCardIcon, TrendingUpIcon, CheckIcon, XIcon, RefreshCwIcon } from 'lucide-react';
import { ReservationWorkflowEngine } from '@/utils/ReservationWorkflowEngine';

interface RoomUpgrade {
  id: string;
  fromRoomType: string;
  toRoomType: string;
  fromRoomNumber: string;
  toRoomNumber: string;
  priceIncrease: number;
  confidence: number;
  reason: string;
  benefits: string[];
  guestProfile?: {
    tier: string;
    preferences: any[];
    history: any[];
  };
}

interface UpgradeRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    guestTier?: string[];
    roomOccupancy?: number;
    daysUntilCheckIn?: number;
    priceThreshold?: number;
  };
  action: {
    type: 'auto_upgrade' | 'suggest_upgrade' | 'offer_upgrade';
    targetRoomTypes: string[];
    maxPriceIncrease: number;
  };
}

interface UpgradeStats {
  totalSuggestions: number;
  acceptedUpgrades: number;
  totalRevenue: number;
  averageIncrease: number;
  conversionRate: number;
}

export const UpgradeProcessor: React.FC = () => {
  const [upgrades, setUpgrades] = useState<RoomUpgrade[]>([]);
  const [rules, setRules] = useState<UpgradeRule[]>([]);
  const [stats, setStats] = useState<UpgradeStats>({
    totalSuggestions: 0,
    acceptedUpgrades: 0,
    totalRevenue: 0,
    averageIncrease: 0,
    conversionRate: 0
  });
  const [selectedUpgrade, setSelectedUpgrade] = useState<RoomUpgrade | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    initializeUpgradeEngine();
    loadUpgradeRules();
    generateUpgradeSuggestions();
  }, []);

  const initializeUpgradeEngine = () => {
    // Initialize default upgrade rules
    const defaultRules: UpgradeRule[] = [
      {
        id: 'vip-auto-upgrade',
        name: 'VIP Auto Upgrade',
        priority: 1,
        conditions: {
          guestTier: ['diamond', 'svip'],
          roomOccupancy: 70
        },
        action: {
          type: 'auto_upgrade',
          targetRoomTypes: ['suite', 'presidential'],
          maxPriceIncrease: 500
        }
      },
      {
        id: 'early-booking-upgrade',
        name: 'Early Booking Reward',
        priority: 2,
        conditions: {
          daysUntilCheckIn: 14,
          roomOccupancy: 60
        },
        action: {
          type: 'offer_upgrade',
          targetRoomTypes: ['deluxe', 'premium'],
          maxPriceIncrease: 200
        }
      },
      {
        id: 'corporate-upgrade',
        name: 'Corporate Account Upgrade',
        priority: 3,
        conditions: {
          guestTier: ['corporate'],
          priceThreshold: 300
        },
        action: {
          type: 'suggest_upgrade',
          targetRoomTypes: ['business', 'executive'],
          maxPriceIncrease: 150
        }
      }
    ];

    setRules(defaultRules);
  };

  const loadUpgradeRules = () => {
    // In a real implementation, this would load from API
    const mockStats: UpgradeStats = {
      totalSuggestions: 145,
      acceptedUpgrades: 87,
      totalRevenue: 15450,
      averageIncrease: 125,
      conversionRate: 60
    };
    setStats(mockStats);
  };

  const generateUpgradeSuggestions = async () => {
    setProcessing(true);

    // Mock upgrade suggestions - in real implementation, this would analyze current reservations
    const mockUpgrades: RoomUpgrade[] = [
      {
        id: 'up-001',
        fromRoomType: 'Standard',
        toRoomType: 'Deluxe',
        fromRoomNumber: '205',
        toRoomNumber: '305',
        priceIncrease: 75,
        confidence: 92,
        reason: 'VIP guest with preference for higher floors',
        benefits: ['City view', 'Larger room', 'Premium amenities'],
        guestProfile: {
          tier: 'vip',
          preferences: ['high floor', 'city view'],
          history: ['Previous upgrades accepted']
        }
      },
      {
        id: 'up-002',
        fromRoomType: 'Deluxe',
        toRoomType: 'Suite',
        fromRoomNumber: '412',
        toRoomNumber: '501',
        priceIncrease: 200,
        confidence: 85,
        reason: 'Corporate guest with high-value booking history',
        benefits: ['Separate living area', 'Complimentary breakfast', 'Executive lounge access'],
        guestProfile: {
          tier: 'corporate',
          preferences: ['business amenities'],
          history: ['Multiple bookings this year']
        }
      },
      {
        id: 'up-003',
        fromRoomType: 'Standard',
        toRoomType: 'Premium',
        fromRoomNumber: '108',
        toRoomNumber: '208',
        priceIncrease: 50,
        confidence: 78,
        reason: 'Anniversary celebration mentioned in booking',
        benefits: ['Romantic setup', 'Complimentary wine', 'Late checkout'],
        guestProfile: {
          tier: 'regular',
          preferences: ['special occasions'],
          history: ['Anniversary booking']
        }
      }
    ];

    setTimeout(() => {
      setUpgrades(mockUpgrades);
      setProcessing(false);
    }, 1500);
  };

  const processUpgrade = async (upgradeId: string, action: 'approve' | 'reject') => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const workflowEngine = ReservationWorkflowEngine.getInstance();

    if (action === 'approve') {
      // Create upgrade workflow
      await workflowEngine.createWorkflow({
        type: 'room_upgrade',
        guestId: `guest-${upgradeId}`,
        upgradeDetails: upgrade,
        priority: 'high'
      });

      // Update stats
      setStats(prev => ({
        ...prev,
        acceptedUpgrades: prev.acceptedUpgrades + 1,
        totalRevenue: prev.totalRevenue + upgrade.priceIncrease,
        conversionRate: Math.round(((prev.acceptedUpgrades + 1) / prev.totalSuggestions) * 100)
      }));
    }

    // Remove processed upgrade from list
    setUpgrades(prev => prev.filter(u => u.id !== upgradeId));
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-600 bg-green-100';
    if (confidence >= 75) return 'text-blue-600 bg-blue-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRoomTypeIcon = (roomType: string) => {
    switch (roomType.toLowerCase()) {
      case 'suite':
      case 'presidential':
        return <StarIcon className="h-4 w-4" />;
      case 'premium':
      case 'deluxe':
        return <TrendingUpIcon className="h-4 w-4" />;
      default:
        return <ArrowUpIcon className="h-4 w-4" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowUpIcon className="h-4 w-4" />
          Upgrade Processor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpIcon className="h-5 w-5" />
            Automated Upgrade Processor
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="suggestions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">Upgrade Suggestions</TabsTrigger>
            <TabsTrigger value="rules">Upgrade Rules</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={generateUpgradeSuggestions}
                  disabled={processing}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                  {processing ? 'Analyzing...' : 'Refresh Suggestions'}
                </Button>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 border rounded-md"
                >
                  <option value="all">All Suggestions</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                {upgrades.length} suggestions found
              </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {upgrades.map((upgrade) => (
                  <Card key={upgrade.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getRoomTypeIcon(upgrade.toRoomType)}
                          <div>
                            <div className="font-semibold">
                              {upgrade.fromRoomType} → {upgrade.toRoomType}
                            </div>
                            <div className="text-sm text-gray-600">
                              Room {upgrade.fromRoomNumber} → {upgrade.toRoomNumber}
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getConfidenceColor(upgrade.confidence)}`}>
                          {upgrade.confidence}% confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Reason</div>
                          <div className="text-sm text-gray-600">{upgrade.reason}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Price Increase</div>
                          <div className="text-lg font-bold text-green-600">
                            +${upgrade.priceIncrease}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Benefits</div>
                        <div className="flex flex-wrap gap-2">
                          {upgrade.benefits.map((benefit, index) => (
                            <Badge key={index} variant="secondary">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {upgrade.guestProfile && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <div className="text-sm font-medium mb-2">Guest Profile</div>
                          <div className="text-xs space-y-1">
                            <div><strong>Tier:</strong> {upgrade.guestProfile.tier.toUpperCase()}</div>
                            <div><strong>Preferences:</strong> {upgrade.guestProfile.preferences.join(', ')}</div>
                            <div><strong>History:</strong> {upgrade.guestProfile.history.join(', ')}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => processUpgrade(upgrade.id, 'approve')}
                          className="gap-2"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve Upgrade
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processUpgrade(upgrade.id, 'reject')}
                          className="gap-2"
                        >
                          <XIcon className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUpgrade(upgrade)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {upgrades.length === 0 && !processing && (
                  <div className="text-center py-8 text-gray-500">
                    No upgrade suggestions available. Click refresh to analyze current reservations.
                  </div>
                )}

                {processing && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="mt-2 text-gray-600">Analyzing reservations for upgrade opportunities...</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {rule.name}
                      <Badge variant="outline">Priority {rule.priority}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium mb-2">Conditions</div>
                        <div className="space-y-1 text-sm">
                          {rule.conditions.guestTier && (
                            <div>Guest Tier: {rule.conditions.guestTier.join(', ')}</div>
                          )}
                          {rule.conditions.roomOccupancy && (
                            <div>Occupancy: ≤{rule.conditions.roomOccupancy}%</div>
                          )}
                          {rule.conditions.daysUntilCheckIn && (
                            <div>Advance Booking: ≥{rule.conditions.daysUntilCheckIn} days</div>
                          )}
                          {rule.conditions.priceThreshold && (
                            <div>Min Rate: ${rule.conditions.priceThreshold}</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Action</div>
                        <div className="space-y-1 text-sm">
                          <div>Type: {rule.action.type.replace('_', ' ').toUpperCase()}</div>
                          <div>Target Rooms: {rule.action.targetRoomTypes.join(', ')}</div>
                          <div>Max Increase: ${rule.action.maxPriceIncrease}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSuggestions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Accepted Upgrades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.acceptedUpgrades}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">${stats.totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                  <Progress value={stats.conversionRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Upgrade Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">VIP Guests</span>
                      <span className="text-sm">85% acceptance</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Corporate Accounts</span>
                      <span className="text-sm">72% acceptance</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Regular Guests</span>
                      <span className="text-sm">45% acceptance</span>
                    </div>
                    <Progress value={45} className="h-2" />
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