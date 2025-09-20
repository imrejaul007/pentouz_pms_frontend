import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Calendar, AlertTriangle, CheckCircle, Settings, TrendingUp, Clock } from 'lucide-react';
import { roomTypeService, RoomType } from '@/services/roomTypeService';
import { availabilityService } from '@/services/availabilityService';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface OverbookingRule {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  allowOverbooking: boolean;
  overbookingLimit: number;
  requiresApproval: boolean;
  seasonalRules?: {
    season: 'peak' | 'off-peak' | 'shoulder';
    startDate: string;
    endDate: string;
    overbookingLimit: number;
  }[];
  lastUpdated: string;
  createdBy: string;
}

interface OverbookingAlert {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  date: string;
  currentBookings: number;
  availableRooms: number;
  overbookingLevel: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
}

interface OverbookingStats {
  totalRoomTypes: number;
  overbookingEnabled: number;
  activeAlerts: number;
  revenueFromOverbooking: number;
  occupancyImprovement: number;
}

export default function OverbookingConfiguration() {
  const { user } = useAuth();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [overbookingRules, setOverbookingRules] = useState<OverbookingRule[]>([]);
  const [alerts, setAlerts] = useState<OverbookingAlert[]>([]);
  const [stats, setStats] = useState<OverbookingStats>({
    totalRoomTypes: 0,
    overbookingEnabled: 0,
    activeAlerts: 0,
    revenueFromOverbooking: 0,
    occupancyImprovement: 0
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [overbookingLimit, setOverbookingLimit] = useState(0);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Get hotel ID from authenticated user context
  const hotelId = user?.hotelId || '68bc094f80c86bfe258e172b'; // Fallback to default if not in user context

  useEffect(() => {
    if (hotelId) {
      loadData();
    }
  }, [hotelId]);

  // Debug effect to monitor state changes
  useEffect(() => {
    if (selectedRoomType) {
      console.log('🔧 State Effect - Room Type Selected:', selectedRoomType.slice(0,8));
      console.log('🔧 State Effect - Current values:', { 
        allowOverbooking, 
        overbookingLimit, 
        requiresApproval 
      });
    }
  }, [selectedRoomType, allowOverbooking, overbookingLimit, requiresApproval]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load room types
      const roomTypesData = await roomTypeService.getRoomTypes(hotelId, { isActive: true });
      setRoomTypes(roomTypesData);

      // Convert room types to overbooking rules format
      const rules: OverbookingRule[] = roomTypesData.map(rt => ({
        id: rt._id,
        roomTypeId: rt._id,
        roomTypeName: rt.name,
        allowOverbooking: rt.settings?.allowOverbooking || false,
        overbookingLimit: rt.settings?.overbookingLimit || 0,
        requiresApproval: rt.settings?.requiresApproval || false,
        lastUpdated: rt.updatedAt,
        createdBy: 'admin'
      }));
      
      setOverbookingRules(rules);

      // Generate mock alerts for demonstration
      const mockAlerts: OverbookingAlert[] = [
        {
          id: '1',
          roomTypeId: roomTypesData[0]?._id || '',
          roomTypeName: roomTypesData[0]?.name || 'Deluxe Room',
          date: new Date().toISOString().split('T')[0],
          currentBookings: 25,
          availableRooms: 20,
          overbookingLevel: 5,
          severity: 'medium',
          status: 'active'
        },
        {
          id: '2',
          roomTypeId: roomTypesData[1]?._id || '',
          roomTypeName: roomTypesData[1]?.name || 'Suite',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          currentBookings: 12,
          availableRooms: 10,
          overbookingLevel: 2,
          severity: 'low',
          status: 'active'
        }
      ];
      setAlerts(mockAlerts);

      // Calculate stats
      const enabledCount = rules.filter(rule => rule.allowOverbooking).length;
      setStats({
        totalRoomTypes: rules.length,
        overbookingEnabled: enabledCount,
        activeAlerts: mockAlerts.filter(alert => alert.status === 'active').length,
        revenueFromOverbooking: 15420,
        occupancyImprovement: 8.5
      });

    } catch (error) {
      console.error('Error loading overbooking data:', error);
      toast.error('Failed to load overbooking configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomTypeSelect = (roomTypeId: string) => {
    console.log('🔧 Room Type Selected:', roomTypeId);
    console.log('🔧 Available Room Types:', roomTypes.map(rt => ({ id: rt._id, name: rt.name, settings: rt.settings })));
    console.log('🔧 Available Rules:', overbookingRules.map(r => ({ id: r.roomTypeId, name: r.roomTypeName, settings: { allowOverbooking: r.allowOverbooking, limit: r.overbookingLimit }})));
    
    setSelectedRoomType(roomTypeId);
    const rule = overbookingRules.find(r => r.roomTypeId === roomTypeId);
    const roomType = roomTypes.find(rt => rt._id === roomTypeId);
    
    console.log('🔧 Found Rule:', rule);
    console.log('🔧 Found Room Type:', roomType);
    console.log('🔧 Room Type Settings:', roomType?.settings);
    
    if (rule) {
      console.log('🔧 Using Rule Data - Before setting state:', { 
        allowOverbooking: rule.allowOverbooking, 
        overbookingLimit: rule.overbookingLimit, 
        requiresApproval: rule.requiresApproval 
      });
      setAllowOverbooking(rule.allowOverbooking);
      setOverbookingLimit(rule.overbookingLimit);
      setRequiresApproval(rule.requiresApproval);
    } else if (roomType?.settings) {
      console.log('🔧 Using Room Type Settings:', roomType.settings);
      setAllowOverbooking(roomType.settings.allowOverbooking || false);
      setOverbookingLimit(roomType.settings.overbookingLimit || 0);
      setRequiresApproval(roomType.settings.requiresApproval || false);
    } else {
      console.log('🔧 Using Default Settings - no rule or room type settings found');
      setAllowOverbooking(false);
      setOverbookingLimit(0);
      setRequiresApproval(false);
    }
    
    // Log state after a brief delay to see if it was set
    setTimeout(() => {
      console.log('🔧 State after update:', { 
        selectedRoomType: roomTypeId, 
        allowOverbooking, 
        overbookingLimit, 
        requiresApproval 
      });
    }, 100);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedRoomType) {
      toast.error('Please select a room type');
      return;
    }

    try {
      setSaving(true);
      
      // Update room type with overbooking settings
      await roomTypeService.updateRoomType(selectedRoomType, {
        settings: {
          allowOverbooking,
          overbookingLimit,
          requiresApproval
        }
      });

      // Update local state
      setOverbookingRules(prev => prev.map(rule => 
        rule.roomTypeId === selectedRoomType 
          ? {
              ...rule,
              allowOverbooking,
              overbookingLimit,
              requiresApproval,
              lastUpdated: new Date().toISOString()
            }
          : rule
      ));

      // Recalculate stats
      const updatedRules = overbookingRules.map(rule => 
        rule.roomTypeId === selectedRoomType 
          ? { ...rule, allowOverbooking }
          : rule
      );
      const enabledCount = updatedRules.filter(rule => rule.allowOverbooking).length;
      setStats(prev => ({
        ...prev,
        overbookingEnabled: enabledCount
      }));

      toast.success('Overbooking configuration saved successfully');
    } catch (error) {
      console.error('Error saving overbooking configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const checkOverbookingStatus = async (date: string, roomTypeId?: string) => {
    try {
      const result = await availabilityService.checkOverbooking({
        date,
        roomType: roomTypeId
      });
      
      if (result.isOverbooked) {
        toast.error(`Overbooking detected: ${result.overbookingCount} rooms over capacity`);
      } else {
        toast.success(`No overbooking detected. ${result.availableRooms} rooms available`);
      }
    } catch (error) {
      console.error('Error checking overbooking:', error);
      toast.error('Failed to check overbooking status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Overbooking Configuration</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage overbooking rules and monitor occupancy optimization
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={() => { console.log('🔄 Manually refreshing data...'); loadData(); }} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="sm:hidden">Refresh</span>
            <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh Data'}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Room Types</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.totalRoomTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Overbooking Enabled</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.overbookingEnabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Alerts</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats.activeAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Additional Revenue</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">₹{stats.revenueFromOverbooking.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Occupancy Boost</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">+{stats.occupancyImprovement}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="configuration" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="configuration" className="text-xs sm:text-sm">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs sm:text-sm">Monitoring</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Room Type Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Configure Overbooking Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Select Room Type
                  </label>
                  <Select value={selectedRoomType} onValueChange={handleRoomTypeSelect}>
                    <SelectTrigger className="w-full text-sm">
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">
                          {selectedRoomType 
                            ? (() => {
                                const selected = roomTypes.find(rt => rt._id === selectedRoomType);
                                return selected ? `${selected.name} (${selected.code})` : "Choose a room type";
                              })()
                            : "Choose a room type"
                          }
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map(rt => (
                        <SelectItem key={rt._id} value={rt._id} className="text-sm">
                          {rt.name} ({rt.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoomType ? (
                  <div className="space-y-4">
                    {/* Current Status Indicator */}
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h5 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {roomTypes.find(rt => rt._id === selectedRoomType)?.name || 'Room Type Not Found'}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Current: {allowOverbooking 
                              ? `${overbookingLimit} rooms allowed for overbooking`
                              : 'Overbooking disabled'
                            }
                          </p>
                          {allowOverbooking && (
                            <p className="text-xs text-blue-600 font-medium">
                              Overbooking Rooms: {overbookingLimit} {overbookingLimit === 1 ? 'room' : 'rooms'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={allowOverbooking ? "default" : "secondary"} className="text-xs">
                            {allowOverbooking ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              console.log('🔄 Toggle button clicked! Current state:', allowOverbooking);
                              const newState = !allowOverbooking;
                              setAllowOverbooking(newState);
                              if (newState && overbookingLimit === 0) {
                                setOverbookingLimit(1); // Default limit when enabling
                              }
                              console.log('🔄 New state will be:', newState);
                            }}
                            className="text-xs"
                          >
                            {allowOverbooking ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        Allow Overbooking
                      </label>
                      <Switch 
                        checked={allowOverbooking}
                        onCheckedChange={setAllowOverbooking}
                      />
                    </div>

                    {allowOverbooking && (
                      <>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Overbooking Limit (rooms)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={overbookingLimit}
                            onChange={(e) => setOverbookingLimit(parseInt(e.target.value) || 0)}
                            placeholder="Maximum rooms to overbook"
                            className="text-sm"
                          />
                        </div>

                      </>
                    )}

                    <Button 
                      onClick={handleSaveConfiguration}
                      disabled={saving}
                      className="w-full text-sm"
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Current Rules Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Current Overbooking Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overbookingRules.map(rule => (
                    <div 
                      key={rule.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoomType === rule.roomTypeId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleRoomTypeSelect(rule.roomTypeId)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{rule.roomTypeName}</h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {rule.allowOverbooking 
                              ? `Limit: ${rule.overbookingLimit} rooms`
                              : 'Overbooking disabled'
                            }
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={rule.allowOverbooking ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {rule.allowOverbooking ? 'Enabled' : 'Disabled'}
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

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Overbooking Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Room Type</TableHead>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Bookings</TableHead>
                        <TableHead className="text-xs sm:text-sm">Available</TableHead>
                        <TableHead className="text-xs sm:text-sm">Overbooking</TableHead>
                        <TableHead className="text-xs sm:text-sm">Severity</TableHead>
                        <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map(alert => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">{alert.roomTypeName}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{new Date(alert.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{alert.currentBookings}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{alert.availableRooms}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{alert.overbookingLevel}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => checkOverbookingStatus(alert.date, alert.roomTypeId)}
                              className="text-xs"
                            >
                              Check Status
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">No overbooking alerts at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Occupancy Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Base Occupancy</span>
                    <span className="text-xs sm:text-sm font-bold">78.5%</span>
                  </div>
                  <Progress value={78.5} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">With Overbooking</span>
                    <span className="text-xs sm:text-sm font-bold">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-800">
                      <strong>+{stats.occupancyImprovement}%</strong> improvement in occupancy rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">
                      ₹{stats.revenueFromOverbooking.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Additional revenue this month</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-base sm:text-lg font-semibold text-blue-600">42</p>
                      <p className="text-xs text-blue-800">Successful Overbooks</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-base sm:text-lg font-semibold text-purple-600">₹367</p>
                      <p className="text-xs text-purple-800">Avg. Revenue/Overbook</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}