import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/utils/toast';
import {
  Users, Star, Heart, TrendingUp, Gift, Mail, Phone,
  Crown, Award, Coffee, Plane, Baby, Building2, Eye
} from 'lucide-react';

// Guest Intelligence Interfaces
interface GuestProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  totalStays: number;
  totalSpent: number;
  avgRating: number;
  preferences: {
    roomType: string;
    floorPreference: string;
    amenities: string[];
    specialRequests: string[];
  };
  behavior: {
    bookingPattern: 'business' | 'leisure' | 'mixed';
    avgStayLength: number;
    cancelationRate: number;
    noShowRate: number;
  };
  personalizedOffers: string[];
  nextBookingProbability: number;
}

interface GuestIntelligenceProps {}

export const GuestIntelligence: React.FC<GuestIntelligenceProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('vip');
  const [guestProfiles, setGuestProfiles] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateMockGuestProfiles();
  }, []);

  const generateMockGuestProfiles = () => {
    const names = [
      'Robert Johnson', 'Emily Chen', 'Michael Brown', 'Sarah Davis',
      'David Wilson', 'Lisa Anderson', 'James Taylor', 'Jessica Martinez'
    ];

    const profiles: GuestProfile[] = names.map((name, index) => {
      const totalStays = 5 + Math.floor(Math.random() * 25);
      const totalSpent = totalStays * (8000 + Math.random() * 12000);
      const tier = totalSpent > 200000 ? 'platinum' :
                  totalSpent > 100000 ? 'gold' :
                  totalSpent > 50000 ? 'silver' : 'bronze';

      return {
        id: `guest-${index + 1}`,
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
        phone: `+91 ${Math.random().toString().slice(2, 12)}`,
        tier,
        totalStays,
        totalSpent: Math.round(totalSpent),
        avgRating: Math.round((4.2 + Math.random() * 0.8) * 10) / 10,
        preferences: {
          roomType: ['Deluxe Room', 'Executive Suite', 'Presidential Suite'][Math.floor(Math.random() * 3)],
          floorPreference: ['High floor', 'Low floor', 'No preference'][Math.floor(Math.random() * 3)],
          amenities: ['Late checkout', 'Airport pickup', 'Spa access', 'Business center'].slice(0, 2 + Math.floor(Math.random() * 2)),
          specialRequests: ['Extra pillows', 'Room service', 'Newspaper', 'Wake up call'].slice(0, 1 + Math.floor(Math.random() * 2))
        },
        behavior: {
          bookingPattern: ['business', 'leisure', 'mixed'][Math.floor(Math.random() * 3)] as any,
          avgStayLength: Math.round((2 + Math.random() * 4) * 10) / 10,
          cancelationRate: Math.round(Math.random() * 15),
          noShowRate: Math.round(Math.random() * 8)
        },
        personalizedOffers: [
          'Room upgrade discount',
          'Spa package deal',
          'Extended stay bonus',
          'Airport transfer included',
          'Welcome amenity'
        ].slice(0, 2 + Math.floor(Math.random() * 2)),
        nextBookingProbability: Math.round(60 + Math.random() * 35)
      };
    });

    // Sort by tier and total spent
    profiles.sort((a, b) => {
      const tierOrder = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
      return tierOrder[a.tier] - tierOrder[b.tier] || b.totalSpent - a.totalSpent;
    });

    setGuestProfiles(profiles);
  };

  const handleSendPersonalizedOffer = async (guestId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Personalized offer sent successfully');
    } catch (error) {
      toast.error('Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-purple-700 bg-purple-100 border-purple-300';
      case 'gold': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'silver': return 'text-gray-700 bg-gray-100 border-gray-300';
      case 'bronze': return 'text-orange-700 bg-orange-100 border-orange-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Crown className="h-4 w-4 text-purple-600" />;
      case 'gold': return <Star className="h-4 w-4 text-yellow-600" />;
      case 'silver': return <Award className="h-4 w-4 text-gray-600" />;
      case 'bronze': return <Gift className="h-4 w-4 text-orange-600" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'business': return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'leisure': return <Coffee className="h-4 w-4 text-green-600" />;
      case 'mixed': return <Plane className="h-4 w-4 text-purple-600" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const vipGuests = guestProfiles.filter(g => g.tier === 'platinum' || g.tier === 'gold');
  const loyalGuests = guestProfiles.filter(g => g.totalStays >= 10);
  const highValueGuests = guestProfiles.filter(g => g.totalSpent >= 100000);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-200"
        >
          <Eye className="h-4 w-4 mr-2 text-purple-600" />
          Guest Intelligence
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0"
          >
            360°
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Eye className="h-5 w-5 text-white" />
            </div>
            Guest Intelligence Platform
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              360° View
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Comprehensive guest behavior analytics, preferences, and personalized engagement tools
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vip" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              VIP Guests
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Personalized Offers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vip" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {guestProfiles.filter(g => g.tier === 'platinum').length}
                  </p>
                  <p className="text-sm text-purple-600">Platinum Guests</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">
                    {guestProfiles.filter(g => g.tier === 'gold').length}
                  </p>
                  <p className="text-sm text-yellow-600">Gold Guests</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    ₹{Math.round(vipGuests.reduce((sum, g) => sum + g.totalSpent, 0) / 100000)}L
                  </p>
                  <p className="text-sm text-green-600">VIP Revenue</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top VIP Guests</h3>
              {vipGuests.slice(0, 6).map((guest) => (
                <Card key={guest.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTierIcon(guest.tier)}
                          <div>
                            <h4 className="font-medium">{guest.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTierColor(guest.tier)} variant="outline">
                                {guest.tier.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {guest.totalStays} stays
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₹{guest.totalSpent.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(guest.avgRating)
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">
                              {guest.avgRating}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.success(`Contacting ${guest.name}`)}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSendPersonalizedOffer(guest.id)}
                            disabled={loading}
                          >
                            <Gift className="h-3 w-3 mr-1" />
                            Send Offer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <div className="grid gap-4">
              {guestProfiles.slice(0, 8).map((guest) => (
                <Card key={guest.id} className="transition-all hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getPatternIcon(guest.behavior.bookingPattern)}
                          <div>
                            <h4 className="font-medium">{guest.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {guest.behavior.bookingPattern.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-600">
                                Avg {guest.behavior.avgStayLength} nights
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Next Booking</p>
                          <div className="flex items-center gap-1">
                            <Progress value={guest.nextBookingProbability} className="w-12 h-1" />
                            <span className="text-xs font-medium">{guest.nextBookingProbability}%</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Cancellation</p>
                          <span className={`text-sm font-medium ${
                            guest.behavior.cancelationRate > 10 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {guest.behavior.cancelationRate}%
                          </span>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">No-show</p>
                          <span className={`text-sm font-medium ${
                            guest.behavior.noShowRate > 5 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {guest.behavior.noShowRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-4">
              {guestProfiles.slice(0, 6).map((guest) => (
                <Card key={guest.id} className="transition-all hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTierIcon(guest.tier)}
                        <h4 className="font-medium">{guest.name}</h4>
                        <Badge className={getTierColor(guest.tier)} variant="outline">
                          {guest.tier}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Room Preferences</p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">
                            <strong>Type:</strong> {guest.preferences.roomType}
                          </p>
                          <p className="text-xs text-gray-600">
                            <strong>Floor:</strong> {guest.preferences.floorPreference}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Amenities & Requests</p>
                        <div className="flex flex-wrap gap-1">
                          {[...guest.preferences.amenities, ...guest.preferences.specialRequests].map((pref, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {pref}
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

          <TabsContent value="offers" className="space-y-6">
            <div className="grid gap-4">
              {guestProfiles.slice(0, 6).map((guest) => (
                <Card key={guest.id} className="transition-all hover:shadow-md border-l-4 border-l-green-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getTierIcon(guest.tier)}
                          <div>
                            <h4 className="font-medium">{guest.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTierColor(guest.tier)} variant="outline">
                                {guest.tier}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                ₹{guest.totalSpent.toLocaleString()} lifetime value
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Next booking chance:</span>
                            <Progress value={guest.nextBookingProbability} className="w-16 h-2" />
                            <span className="text-sm font-medium">{guest.nextBookingProbability}%</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleSendPersonalizedOffer(guest.id)}
                          disabled={loading}
                          className="bg-gradient-to-r from-green-500 to-emerald-500"
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Send Offer
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recommended Personalized Offers:</p>
                      <div className="flex flex-wrap gap-2">
                        {guest.personalizedOffers.map((offer, i) => (
                          <Badge key={i} className="bg-green-100 text-green-700 border-green-300">
                            {offer}
                          </Badge>
                        ))}
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