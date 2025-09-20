import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ListIcon,
  UserCheckIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon,
  StarIcon,
  CalendarIcon,
  CreditCardIcon,
  RefreshCwIcon
} from 'lucide-react';

interface WaitlistEntry {
  id: string;
  guestId: string;
  guestName: string;
  guestTier: 'regular' | 'vip' | 'svip' | 'corporate' | 'diamond';
  email: string;
  phone: string;
  requestedRoomType: string;
  checkInDate: string;
  checkOutDate: string;
  partySize: number;
  maxPrice: number;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  preferences: string[];
  specialRequests: string[];
  createdAt: string;
  lastContactDate?: string;
  status: 'waiting' | 'matched' | 'contacted' | 'confirmed' | 'declined' | 'expired';
  matchScore?: number;
  autoNotify: boolean;
  notes: string[];
}

interface MatchResult {
  waitlistEntryId: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  matchScore: number;
  matchReasons: string[];
  priceMatch: boolean;
  dateMatch: boolean;
  typeMatch: boolean;
  availabilityConfirmed: boolean;
  recommendedAction: 'auto_confirm' | 'manual_review' | 'contact_guest';
}

interface WaitlistSettings {
  autoProcessing: boolean;
  processInterval: number; // minutes
  minimumMatchScore: number;
  autoConfirmThreshold: number;
  maxContactAttempts: number;
  contactDelayHours: number;
  prioritizeVIP: boolean;
  considerAlternativeRoomTypes: boolean;
}

interface WaitlistStats {
  totalWaiting: number;
  processedToday: number;
  successfulMatches: number;
  conversionRate: number;
  averageWaitTime: number; // hours
  priorityQueue: number;
}

export const WaitlistProcessor: React.FC = () => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [settings, setSettings] = useState<WaitlistSettings>({
    autoProcessing: true,
    processInterval: 15,
    minimumMatchScore: 75,
    autoConfirmThreshold: 90,
    maxContactAttempts: 3,
    contactDelayHours: 2,
    prioritizeVIP: true,
    considerAlternativeRoomTypes: true
  });
  const [stats, setStats] = useState<WaitlistStats>({
    totalWaiting: 0,
    processedToday: 0,
    successfulMatches: 0,
    conversionRate: 0,
    averageWaitTime: 0,
    priorityQueue: 0
  });
  const [processing, setProcessing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('waiting');

  useEffect(() => {
    loadWaitlistData();
    loadWaitlistStats();
    if (settings.autoProcessing) {
      const interval = setInterval(processWaitlist, settings.processInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [settings.autoProcessing, settings.processInterval]);

  const loadWaitlistData = () => {
    // Mock waitlist data
    const mockWaitlist: WaitlistEntry[] = [
      {
        id: 'wl-001',
        guestId: 'guest-001',
        guestName: 'Alexandra Chen',
        guestTier: 'vip',
        email: 'alexandra.chen@email.com',
        phone: '+1-555-0123',
        requestedRoomType: 'Suite',
        checkInDate: '2024-01-20',
        checkOutDate: '2024-01-23',
        partySize: 2,
        maxPrice: 450,
        urgency: 'high',
        preferences: ['high floor', 'city view', 'quiet room'],
        specialRequests: ['champagne arrival', 'late checkout'],
        createdAt: '2024-01-15T10:30:00',
        lastContactDate: '2024-01-16T14:20:00',
        status: 'waiting',
        autoNotify: true,
        notes: ['VIP guest - priority handling', 'Preferred upgrade if available']
      },
      {
        id: 'wl-002',
        guestId: 'guest-002',
        guestName: 'Marcus Johnson',
        guestTier: 'corporate',
        email: 'marcus.johnson@company.com',
        phone: '+1-555-0456',
        requestedRoomType: 'Deluxe',
        checkInDate: '2024-01-18',
        checkOutDate: '2024-01-20',
        partySize: 1,
        maxPrice: 280,
        urgency: 'medium',
        preferences: ['business amenities', 'wifi'],
        specialRequests: ['early checkin'],
        createdAt: '2024-01-14T16:45:00',
        status: 'matched',
        matchScore: 87,
        autoNotify: true,
        notes: ['Corporate rate eligible']
      },
      {
        id: 'wl-003',
        guestId: 'guest-003',
        guestName: 'Sofia Rodriguez',
        guestTier: 'regular',
        email: 'sofia.rodriguez@email.com',
        phone: '+1-555-0789',
        requestedRoomType: 'Standard',
        checkInDate: '2024-01-22',
        checkOutDate: '2024-01-24',
        partySize: 2,
        maxPrice: 180,
        urgency: 'low',
        preferences: ['ground floor', 'accessible'],
        specialRequests: ['wheelchair accessible'],
        createdAt: '2024-01-16T09:15:00',
        status: 'waiting',
        autoNotify: false,
        notes: ['Accessibility requirements confirmed']
      },
      {
        id: 'wl-004',
        guestId: 'guest-004',
        guestName: 'David Kim',
        guestTier: 'diamond',
        email: 'david.kim@email.com',
        phone: '+1-555-0321',
        requestedRoomType: 'Presidential Suite',
        checkInDate: '2024-01-19',
        checkOutDate: '2024-01-22',
        partySize: 4,
        maxPrice: 800,
        urgency: 'urgent',
        preferences: ['top floor', 'panoramic view'],
        specialRequests: ['private check-in', 'concierge service'],
        createdAt: '2024-01-17T11:00:00',
        status: 'contacted',
        matchScore: 95,
        autoNotify: true,
        notes: ['Diamond tier - highest priority', 'Confirmed interest in available suite']
      }
    ];

    setWaitlist(mockWaitlist);

    // Mock matches
    const mockMatches: MatchResult[] = [
      {
        waitlistEntryId: 'wl-002',
        roomId: 'room-305',
        roomNumber: '305',
        roomType: 'Deluxe',
        matchScore: 87,
        matchReasons: ['Room type match', 'Date availability', 'Price within budget'],
        priceMatch: true,
        dateMatch: true,
        typeMatch: true,
        availabilityConfirmed: true,
        recommendedAction: 'contact_guest'
      },
      {
        waitlistEntryId: 'wl-004',
        roomId: 'room-801',
        roomNumber: '801',
        roomType: 'Presidential Suite',
        matchScore: 95,
        matchReasons: ['Perfect room type match', 'Premium location', 'All preferences met'],
        priceMatch: true,
        dateMatch: true,
        typeMatch: true,
        availabilityConfirmed: true,
        recommendedAction: 'auto_confirm'
      }
    ];

    setMatches(mockMatches);
  };

  const loadWaitlistStats = () => {
    const mockStats: WaitlistStats = {
      totalWaiting: 12,
      processedToday: 8,
      successfulMatches: 6,
      conversionRate: 75,
      averageWaitTime: 18.5,
      priorityQueue: 3
    };
    setStats(mockStats);
  };

  const processWaitlist = async () => {
    setProcessing(true);

    // Simulate processing logic
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real implementation, this would:
    // 1. Check room availability against waitlist criteria
    // 2. Calculate match scores based on preferences, price, dates
    // 3. Prioritize by guest tier and urgency
    // 4. Generate match results

    console.log('Waitlist processing completed');
    setProcessing(false);
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'diamond':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'svip':
        return 'bg-gold-100 text-gold-800 border-gold-200';
      case 'vip':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'corporate':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <ClockIcon className="h-4 w-4" />;
      case 'matched':
        return <TrendingUpIcon className="h-4 w-4" />;
      case 'contacted':
        return <UserCheckIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'declined':
        return <XCircleIcon className="h-4 w-4" />;
      case 'expired':
        return <AlertCircleIcon className="h-4 w-4" />;
      default:
        return <ListIcon className="h-4 w-4" />;
    }
  };

  const confirmMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.waitlistEntryId !== matchId));
    setWaitlist(prev => prev.map(entry =>
      entry.id === matchId
        ? { ...entry, status: 'confirmed' }
        : entry
    ));
  };

  const declineMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.waitlistEntryId !== matchId));
    setWaitlist(prev => prev.map(entry =>
      entry.id === matchId
        ? { ...entry, status: 'waiting', matchScore: undefined }
        : entry
    ));
  };

  const contactGuest = (entryId: string) => {
    setWaitlist(prev => prev.map(entry =>
      entry.id === entryId
        ? {
            ...entry,
            status: 'contacted',
            lastContactDate: new Date().toISOString()
          }
        : entry
    ));
  };

  const filteredWaitlist = waitlist.filter(entry =>
    filterStatus === 'all' || entry.status === filterStatus
  );

  // Sort by priority: Diamond > SVIP > VIP > Corporate > Regular, then by urgency
  const prioritizedWaitlist = [...filteredWaitlist].sort((a, b) => {
    const tierPriority = { diamond: 5, svip: 4, vip: 3, corporate: 2, regular: 1 };
    const urgencyPriority = { urgent: 4, high: 3, medium: 2, low: 1 };

    if (tierPriority[a.guestTier] !== tierPriority[b.guestTier]) {
      return tierPriority[b.guestTier] - tierPriority[a.guestTier];
    }

    return urgencyPriority[b.urgency] - urgencyPriority[a.urgency];
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ListIcon className="h-4 w-4" />
          Waitlist Processor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListIcon className="h-5 w-5" />
            Automated Waitlist Processing
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist Queue</TabsTrigger>
            <TabsTrigger value="matches">Smart Matches</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Processing Status */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Processing Status</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={settings.autoProcessing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {settings.autoProcessing ? <PlayIcon className="h-3 w-3 mr-1" /> : <PauseIcon className="h-3 w-3 mr-1" />}
                      {settings.autoProcessing ? 'Auto Processing ON' : 'Auto Processing OFF'}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={processWaitlist}
                      disabled={processing}
                      className="gap-2"
                    >
                      <RefreshCwIcon className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                      {processing ? 'Processing...' : 'Process Now'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalWaiting}</div>
                    <div className="text-sm text-gray-600">Total Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.priorityQueue}</div>
                    <div className="text-sm text-gray-600">Priority Queue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.processedToday}</div>
                    <div className="text-sm text-gray-600">Processed Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.successfulMatches}</div>
                    <div className="text-sm text-gray-600">Successful Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.averageWaitTime}h</div>
                    <div className="text-sm text-gray-600">Avg Wait Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Matches */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Smart Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match) => {
                    const entry = waitlist.find(e => e.id === match.waitlistEntryId);
                    return (
                      <div key={match.waitlistEntryId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div>
                            <div className="font-medium">{entry?.guestName}</div>
                            <div className="text-sm text-gray-600">
                              {match.roomType} - Room {match.roomNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            {match.matchScore}% Match
                          </Badge>
                          <Badge className={getTierColor(entry?.guestTier || 'regular')}>
                            {entry?.guestTier?.toUpperCase()}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {match.recommendedAction.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {matches.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No recent matches. Run processing to find new matches.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600">
                  {prioritizedWaitlist.length} entries (Priority sorted)
                </div>
              </div>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {prioritizedWaitlist.map((entry, index) => (
                  <Card key={entry.id} className={`border-l-4 ${
                    entry.guestTier === 'diamond' ? 'border-l-purple-500' :
                    entry.guestTier === 'svip' ? 'border-l-yellow-500' :
                    entry.guestTier === 'vip' ? 'border-l-blue-500' :
                    entry.guestTier === 'corporate' ? 'border-l-green-500' :
                    'border-l-gray-400'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-lg">{entry.guestName}</div>
                            <div className="text-sm text-gray-600 mb-1">
                              {entry.email} • {entry.phone}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.partySize} {entry.partySize === 1 ? 'guest' : 'guests'} •
                              {new Date(entry.checkInDate).toLocaleDateString()} - {new Date(entry.checkOutDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex gap-2">
                            <Badge className={getTierColor(entry.guestTier)}>
                              {entry.guestTier.toUpperCase()}
                            </Badge>
                            <Badge className={getUrgencyColor(entry.urgency)}>
                              {entry.urgency.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(entry.status)}>
                              {getStatusIcon(entry.status)}
                              {entry.status.toUpperCase()}
                            </Badge>
                          </div>
                          {entry.matchScore && (
                            <Badge className="bg-green-100 text-green-800">
                              {entry.matchScore}% Match
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium">Requested Room</div>
                          <div className="text-sm text-gray-600">{entry.requestedRoomType}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Max Budget</div>
                          <div className="text-sm text-gray-600">${entry.maxPrice}/night</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Wait Time</div>
                          <div className="text-sm text-gray-600">
                            {Math.round((Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60))}h
                          </div>
                        </div>
                      </div>

                      {entry.preferences.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Preferences</div>
                          <div className="flex flex-wrap gap-2">
                            {entry.preferences.map((pref, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.specialRequests.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Special Requests</div>
                          <div className="flex flex-wrap gap-2">
                            {entry.specialRequests.map((req, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {entry.status === 'waiting' && (
                          <Button size="sm" onClick={() => processWaitlist()}>
                            Find Matches
                          </Button>
                        )}
                        {entry.status === 'matched' && (
                          <>
                            <Button size="sm" onClick={() => contactGuest(entry.id)}>
                              Contact Guest
                            </Button>
                            <Button size="sm" variant="outline">
                              View Match Details
                            </Button>
                          </>
                        )}
                        {entry.status === 'contacted' && (
                          <Button size="sm" variant="outline">
                            Follow Up
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          View Full Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {prioritizedWaitlist.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No waitlist entries found matching the current filter.
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Match Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match) => {
                    const entry = waitlist.find(e => e.id === match.waitlistEntryId);
                    return (
                      <div key={match.waitlistEntryId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-lg">{entry?.guestName}</div>
                            <div className="text-sm text-gray-600">
                              Matched with Room {match.roomNumber} ({match.roomType})
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                              {match.matchScore}% Match
                            </Badge>
                            <div className="text-sm text-gray-500 mt-1">
                              {match.recommendedAction.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium">Room Type</div>
                            <div className={match.typeMatch ? 'text-green-600' : 'text-red-600'}>
                              {match.typeMatch ? '✓ Match' : '✗ No Match'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Dates</div>
                            <div className={match.dateMatch ? 'text-green-600' : 'text-red-600'}>
                              {match.dateMatch ? '✓ Available' : '✗ Conflict'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Price</div>
                            <div className={match.priceMatch ? 'text-green-600' : 'text-red-600'}>
                              {match.priceMatch ? '✓ Within Budget' : '✗ Over Budget'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Availability</div>
                            <div className={match.availabilityConfirmed ? 'text-green-600' : 'text-yellow-600'}>
                              {match.availabilityConfirmed ? '✓ Confirmed' : '? Pending'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-2">Match Reasons</div>
                          <div className="flex flex-wrap gap-2">
                            {match.matchReasons.map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {match.recommendedAction === 'auto_confirm' && (
                            <Button
                              size="sm"
                              onClick={() => confirmMatch(match.waitlistEntryId)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Auto Confirm
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => contactGuest(match.waitlistEntryId)}
                          >
                            Contact Guest
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => declineMatch(match.waitlistEntryId)}
                          >
                            Decline Match
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMatch(match)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {matches.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No matches found. Run waitlist processing to find potential matches.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Waitlist Processing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto Processing</div>
                        <div className="text-sm text-gray-600">Automatically process waitlist at intervals</div>
                      </div>
                      <Switch
                        checked={settings.autoProcessing}
                        onCheckedChange={(checked) => setSettings(prev => ({...prev, autoProcessing: checked}))}
                      />
                    </div>

                    <div>
                      <div className="font-medium mb-2">Processing Interval (minutes)</div>
                      <Select
                        value={settings.processInterval.toString()}
                        onValueChange={(value) => setSettings(prev => ({...prev, processInterval: parseInt(value)}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutes</SelectItem>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Minimum Match Score</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>50%</span>
                          <span>{settings.minimumMatchScore}%</span>
                          <span>100%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          value={settings.minimumMatchScore}
                          onChange={(e) => setSettings(prev => ({...prev, minimumMatchScore: parseInt(e.target.value)}))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Auto Confirm Threshold</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>80%</span>
                          <span>{settings.autoConfirmThreshold}%</span>
                          <span>100%</span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="100"
                          value={settings.autoConfirmThreshold}
                          onChange={(e) => setSettings(prev => ({...prev, autoConfirmThreshold: parseInt(e.target.value)}))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Prioritize VIP Guests</div>
                        <div className="text-sm text-gray-600">Process VIP guests first</div>
                      </div>
                      <Switch
                        checked={settings.prioritizeVIP}
                        onCheckedChange={(checked) => setSettings(prev => ({...prev, prioritizeVIP: checked}))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Consider Alternative Room Types</div>
                        <div className="text-sm text-gray-600">Match with similar room types</div>
                      </div>
                      <Switch
                        checked={settings.considerAlternativeRoomTypes}
                        onCheckedChange={(checked) => setSettings(prev => ({...prev, considerAlternativeRoomTypes: checked}))}
                      />
                    </div>

                    <div>
                      <div className="font-medium mb-2">Max Contact Attempts</div>
                      <Select
                        value={settings.maxContactAttempts.toString()}
                        onValueChange={(value) => setSettings(prev => ({...prev, maxContactAttempts: parseInt(value)}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 attempt</SelectItem>
                          <SelectItem value="2">2 attempts</SelectItem>
                          <SelectItem value="3">3 attempts</SelectItem>
                          <SelectItem value="5">5 attempts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Contact Delay (hours)</div>
                      <Select
                        value={settings.contactDelayHours.toString()}
                        onValueChange={(value) => setSettings(prev => ({...prev, contactDelayHours: parseInt(value)}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
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