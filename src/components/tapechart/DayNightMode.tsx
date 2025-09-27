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
import { toast } from '@/utils/toast';
import {
  Sun, Moon, Clock, Calendar, Globe,
  Settings, Users, Building, MapPin,
  Sunrise, Sunset, Timer, RefreshCw
} from 'lucide-react';

// Day/Night Mode Types
interface OperationalHours {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  type: 'day' | 'night' | 'full_day' | 'custom';
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  enabled: boolean;
}

interface ShiftConfiguration {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  staff: number;
  color: string;
  permissions: string[];
  operationalMode: 'standard' | 'limited' | 'emergency';
  breakTimes: Array<{
    start: string;
    end: string;
    type: 'break' | 'meal';
  }>;
}

interface PropertySettings {
  propertyName: string;
  timezone: string;
  operationalCycle: 'midnight_to_midnight' | 'noon_to_noon' | 'custom';
  customStartTime: string;
  enableDayNightMode: boolean;
  autoSwitchTheme: boolean;
  seasonalAdjustments: boolean;
}

interface TimezoneSetting {
  propertyId: string;
  propertyName: string;
  timezone: string;
  currentTime: string;
  offset: string;
  daylightSaving: boolean;
}

export const DayNightMode: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'day' | 'night' | 'auto'>('auto');
  const [propertySettings, setPropertySettings] = useState<PropertySettings>({
    propertyName: 'THE PENTOUZ Hotel',
    timezone: 'Asia/Kolkata',
    operationalCycle: 'midnight_to_midnight',
    customStartTime: '06:00',
    enableDayNightMode: true,
    autoSwitchTheme: true,
    seasonalAdjustments: false
  });

  const [operationalHours, setOperationalHours] = useState<OperationalHours[]>([]);
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfiguration[]>([]);
  const [timezoneSettings, setTimezoneSettings] = useState<TimezoneSetting[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const timezones = [
    { value: 'UTC', label: 'UTC - Coordinated Universal Time', offset: '+00:00' },
    { value: 'America/New_York', label: 'Eastern Time (US & Canada)', offset: '-05:00' },
    { value: 'America/Chicago', label: 'Central Time (US & Canada)', offset: '-06:00' },
    { value: 'America/Denver', label: 'Mountain Time (US & Canada)', offset: '-07:00' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)', offset: '-08:00' },
    { value: 'Europe/London', label: 'Greenwich Mean Time', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Central European Time', offset: '+01:00' },
    { value: 'Europe/Moscow', label: 'Moscow Time', offset: '+03:00' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time', offset: '+04:00' },
    { value: 'Asia/Kolkata', label: 'India Standard Time', offset: '+05:30' },
    { value: 'Asia/Singapore', label: 'Singapore Standard Time', offset: '+08:00' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: '+09:00' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: '+10:00' },
    { value: 'Pacific/Auckland', label: 'New Zealand Standard Time', offset: '+12:00' }
  ];

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    initializeSettings();

    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      updateTimezoneClocks();
    }, 60000);

    // Check for auto mode changes
    const modeInterval = setInterval(() => {
      if (currentMode === 'auto' && propertySettings.autoSwitchTheme) {
        checkAutoModeSwitch();
      }
    }, 300000); // Check every 5 minutes

    return () => {
      clearInterval(timeInterval);
      clearInterval(modeInterval);
    };
  }, [currentMode, propertySettings]);

  const initializeSettings = () => {
    // Initialize operational hours
    const defaultOperationalHours: OperationalHours[] = [
      {
        id: 'day-shift',
        name: 'Day Shift',
        startTime: '06:00',
        endTime: '18:00',
        timezone: propertySettings.timezone,
        type: 'day',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
        enabled: true
      },
      {
        id: 'night-shift',
        name: 'Night Shift',
        startTime: '18:00',
        endTime: '06:00',
        timezone: propertySettings.timezone,
        type: 'night',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
        enabled: true
      },
      {
        id: 'business-hours',
        name: 'Business Hours',
        startTime: '09:00',
        endTime: '17:00',
        timezone: propertySettings.timezone,
        type: 'day',
        daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
        enabled: true
      }
    ];

    // Initialize shift configurations
    const defaultShifts: ShiftConfiguration[] = [
      {
        id: 'morning-shift',
        name: 'Morning Shift',
        startTime: '06:00',
        endTime: '14:00',
        staff: 12,
        color: '#FEF3C7', // Light yellow
        permissions: ['check_in', 'check_out', 'room_management', 'guest_services'],
        operationalMode: 'standard',
        breakTimes: [
          { start: '09:30', end: '09:45', type: 'break' },
          { start: '12:00', end: '13:00', type: 'meal' }
        ]
      },
      {
        id: 'afternoon-shift',
        name: 'Afternoon Shift',
        startTime: '14:00',
        endTime: '22:00',
        staff: 10,
        color: '#FED7AA', // Light orange
        permissions: ['check_in', 'check_out', 'room_management', 'guest_services', 'housekeeping'],
        operationalMode: 'standard',
        breakTimes: [
          { start: '17:00', end: '17:15', type: 'break' },
          { start: '19:00', end: '20:00', type: 'meal' }
        ]
      },
      {
        id: 'night-shift',
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        staff: 6,
        color: '#E0E7FF', // Light indigo
        permissions: ['emergency_check_in', 'security', 'maintenance', 'night_audit'],
        operationalMode: 'limited',
        breakTimes: [
          { start: '02:00', end: '02:30', type: 'meal' },
          { start: '05:00', end: '05:15', type: 'break' }
        ]
      }
    ];

    // Initialize timezone settings for multi-property
    const defaultTimezones: TimezoneSetting[] = [
      {
        propertyId: 'prop-1',
        propertyName: 'THE PENTOUZ Delhi',
        timezone: 'Asia/Kolkata',
        currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
        offset: '+05:30',
        daylightSaving: false
      },
      {
        propertyId: 'prop-2',
        propertyName: 'THE PENTOUZ Mumbai',
        timezone: 'Asia/Kolkata',
        currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
        offset: '+05:30',
        daylightSaving: false
      },
      {
        propertyId: 'prop-3',
        propertyName: 'THE PENTOUZ Dubai',
        timezone: 'Asia/Dubai',
        currentTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dubai' }),
        offset: '+04:00',
        daylightSaving: false
      }
    ];

    setOperationalHours(defaultOperationalHours);
    setShiftConfigs(defaultShifts);
    setTimezoneSettings(defaultTimezones);
  };

  const updateTimezoneClocks = () => {
    setTimezoneSettings(prev =>
      prev.map(setting => ({
        ...setting,
        currentTime: new Date().toLocaleTimeString('en-US', { timeZone: setting.timezone })
      }))
    );
  };

  const checkAutoModeSwitch = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Determine if it's day or night based on typical hours
    // Day: 6 AM - 6 PM, Night: 6 PM - 6 AM
    const isDayTime = currentHour >= 6 && currentHour < 18;
    const newMode = isDayTime ? 'day' : 'night';

    if (newMode !== (currentMode === 'auto' ? (isDayTime ? 'day' : 'night') : currentMode)) {
      toast.info(`Automatically switched to ${newMode} mode`);
    }
  };

  const getCurrentShift = () => {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);

    return shiftConfigs.find(shift => {
      const start = shift.startTime;
      const end = shift.endTime;

      // Handle overnight shifts
      if (start > end) {
        return currentTime >= start || currentTime <= end;
      } else {
        return currentTime >= start && currentTime <= end;
      }
    });
  };

  const getOperationalStatus = () => {
    const currentShift = getCurrentShift();
    if (!currentShift) return { status: 'closed', shift: null };

    return {
      status: currentShift.operationalMode === 'emergency' ? 'emergency' : 'open',
      shift: currentShift
    };
  };

  const toggleOperationalHours = (hoursId: string) => {
    setOperationalHours(prev =>
      prev.map(hours =>
        hours.id === hoursId ? { ...hours, enabled: !hours.enabled } : hours
      )
    );
  };

  const addCustomOperationalHours = () => {
    const newHours: OperationalHours = {
      id: `custom-${Date.now()}`,
      name: 'Custom Hours',
      startTime: '09:00',
      endTime: '17:00',
      timezone: propertySettings.timezone,
      type: 'custom',
      daysOfWeek: [1, 2, 3, 4, 5],
      enabled: true
    };

    setOperationalHours(prev => [...prev, newHours]);
    toast.success('Custom operational hours added');
  };

  const updatePropertyTimezone = (timezone: string) => {
    setPropertySettings(prev => ({ ...prev, timezone }));

    // Update all operational hours to use new timezone
    setOperationalHours(prev =>
      prev.map(hours => ({ ...hours, timezone }))
    );

    toast.success('Property timezone updated');
  };

  const getThemeStyles = () => {
    const mode = currentMode === 'auto'
      ? (new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'day' : 'night')
      : currentMode;

    return mode === 'day'
      ? 'bg-gradient-to-br from-yellow-50 to-orange-50'
      : 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white';
  };

  const getModeIcon = () => {
    const mode = currentMode === 'auto'
      ? (new Date().getHours() >= 6 && new Date().getHours() < 18 ? 'day' : 'night')
      : currentMode;

    return mode === 'day' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const operationalStatus = getOperationalStatus();
  const currentShift = getCurrentShift();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {getModeIcon()}
          Day/Night Mode
          <Badge className="bg-indigo-100 text-indigo-800">Phase 3</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Day/Night Mode & Operational Flexibility
            <Badge className="bg-indigo-100 text-indigo-800">
              Innovation Leadership
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Flexible operational hours, shift-based views, and multi-timezone property management
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-lg p-4 mb-4 transition-all ${getThemeStyles()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getModeIcon()}
                <span className="font-medium">
                  {currentMode === 'auto' ? 'Auto Mode' : `${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>

              {currentShift && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {currentShift.name} ({currentShift.staff} staff)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={currentMode === 'day' ? 'default' : 'outline'}
                onClick={() => setCurrentMode('day')}
                className="gap-1"
              >
                <Sun className="h-3 w-3" />
                Day
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'night' ? 'default' : 'outline'}
                onClick={() => setCurrentMode('night')}
                className="gap-1"
              >
                <Moon className="h-3 w-3" />
                Night
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'auto' ? 'default' : 'outline'}
                onClick={() => setCurrentMode('auto')}
                className="gap-1"
              >
                <Timer className="h-3 w-3" />
                Auto
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="hours">Operational Hours</TabsTrigger>
            <TabsTrigger value="timezones">Timezones</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Current Status Overview */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Property Status</p>
                      <p className={`text-2xl font-bold ${
                        operationalStatus.status === 'open' ? 'text-green-600' :
                        operationalStatus.status === 'emergency' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {operationalStatus.status.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {operationalStatus.shift?.name || 'No active shift'}
                      </p>
                    </div>
                    <Building className={`h-8 w-8 ${
                      operationalStatus.status === 'open' ? 'text-green-600' :
                      operationalStatus.status === 'emergency' ? 'text-orange-600' : 'text-red-600'
                    }`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Staff</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {currentShift?.staff || 0}
                      </p>
                      <p className="text-xs text-gray-600">On duty now</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Timezone</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {propertySettings.timezone.split('/')[1]}
                      </p>
                      <p className="text-xs text-gray-600">
                        {timezones.find(tz => tz.value === propertySettings.timezone)?.offset}
                      </p>
                    </div>
                    <Globe className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Current Shift Details */}
            {currentShift && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Shift: {currentShift.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm">Time</Label>
                      <div className="font-medium">
                        {currentShift.startTime} - {currentShift.endTime}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm">Staff Count</Label>
                      <div className="font-medium">{currentShift.staff} members</div>
                    </div>

                    <div>
                      <Label className="text-sm">Mode</Label>
                      <Badge className={
                        currentShift.operationalMode === 'standard' ? 'bg-green-100 text-green-800' :
                        currentShift.operationalMode === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {currentShift.operationalMode.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <Label className="text-sm">Permissions</Label>
                      <div className="text-sm text-gray-600">
                        {currentShift.permissions.length} active
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm">Break Times</Label>
                    <div className="flex gap-2 mt-1">
                      {currentShift.breakTimes.map((breakTime, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {breakTime.start}-{breakTime.end} ({breakTime.type})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multi-Property Time Display */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Property Time Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {timezoneSettings.map((setting) => (
                    <Card key={setting.propertyId} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{setting.propertyName}</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {setting.currentTime}
                            </div>
                            <div className="text-xs text-gray-600">
                              {setting.timezone} ({setting.offset})
                            </div>
                          </div>
                          <div className="text-center">
                            <MapPin className="h-6 w-6 text-gray-400 mx-auto" />
                            {setting.daylightSaving && (
                              <Badge className="text-xs mt-1">DST</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            {/* Shift Configurations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Shift Management
                  <Button size="sm" variant="outline">
                    Add Shift
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shiftConfigs.map((shift) => (
                    <Card key={shift.id} className="border-l-4" style={{ borderLeftColor: shift.color }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-lg">{shift.name}</div>
                            <div className="text-sm text-gray-600">
                              {shift.startTime} - {shift.endTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={
                              shift.operationalMode === 'standard' ? 'bg-green-100 text-green-800' :
                              shift.operationalMode === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {shift.operationalMode.toUpperCase()}
                            </Badge>
                            {shift.id === currentShift?.id && (
                              <Badge className="bg-blue-100 text-blue-800">ACTIVE</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <Label className="text-xs">Staff</Label>
                            <div className="font-medium">{shift.staff} members</div>
                          </div>

                          <div>
                            <Label className="text-xs">Permissions</Label>
                            <div className="text-sm">{shift.permissions.length} active</div>
                          </div>

                          <div>
                            <Label className="text-xs">Breaks</Label>
                            <div className="text-sm">{shift.breakTimes.length} scheduled</div>
                          </div>

                          <div>
                            <Label className="text-xs">Color</Label>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: shift.color }}
                              />
                              <span className="text-sm">{shift.color}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Permissions</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {shift.permissions.map((permission) => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Break Schedule</Label>
                            <div className="flex gap-2 mt-1">
                              {shift.breakTimes.map((breakTime, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {breakTime.start}-{breakTime.end} ({breakTime.type})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            {/* Operational Hours Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Operational Hours
                  <Button size="sm" variant="outline" onClick={addCustomOperationalHours}>
                    Add Custom Hours
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {operationalHours.map((hours) => (
                    <Card key={hours.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{hours.name}</div>
                              <Badge className={`${
                                hours.type === 'day' ? 'bg-yellow-100 text-yellow-800' :
                                hours.type === 'night' ? 'bg-indigo-100 text-indigo-800' :
                                hours.type === 'full_day' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {hours.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {hours.startTime} - {hours.endTime}
                            </div>
                          </div>
                          <Switch
                            checked={hours.enabled}
                            onCheckedChange={() => toggleOperationalHours(hours.id)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Timezone</Label>
                            <div className="text-sm">{hours.timezone}</div>
                          </div>

                          <div>
                            <Label className="text-xs">Active Days</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {hours.daysOfWeek.map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {daysOfWeek[day].substring(0, 3)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timezones" className="space-y-4">
            {/* Timezone Management */}
            <Card>
              <CardHeader>
                <CardTitle>Multi-Property Timezone Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timezoneSettings.map((setting) => (
                    <Card key={setting.propertyId}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm">Property</Label>
                            <div className="font-medium">{setting.propertyName}</div>
                          </div>

                          <div>
                            <Label className="text-sm">Current Time</Label>
                            <div className="font-mono text-lg">{setting.currentTime}</div>
                          </div>

                          <div>
                            <Label className="text-sm">Timezone</Label>
                            <Select value={setting.timezone}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timezones.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-sm">UTC Offset</Label>
                            <div className="font-medium">{setting.offset}</div>
                            {setting.daylightSaving && (
                              <Badge className="mt-1 text-xs">DST Active</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Property Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Property Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Property Name</Label>
                    <Input
                      value={propertySettings.propertyName}
                      onChange={(e) => setPropertySettings(prev => ({ ...prev, propertyName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Timezone</Label>
                    <Select
                      value={propertySettings.timezone}
                      onValueChange={updatePropertyTimezone}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label} ({tz.offset})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Operational Cycle</Label>
                  <Select
                    value={propertySettings.operationalCycle}
                    onValueChange={(value) => setPropertySettings(prev => ({ ...prev, operationalCycle: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="midnight_to_midnight">Midnight to Midnight</SelectItem>
                      <SelectItem value="noon_to_noon">Noon to Noon</SelectItem>
                      <SelectItem value="custom">Custom Start Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {propertySettings.operationalCycle === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Start Time</Label>
                    <Input
                      type="time"
                      value={propertySettings.customStartTime}
                      onChange={(e) => setPropertySettings(prev => ({ ...prev, customStartTime: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Day/Night Mode</Label>
                      <div className="text-sm text-gray-600 mt-1">
                        Automatically adjust interface based on time of day
                      </div>
                    </div>
                    <Switch
                      checked={propertySettings.enableDayNightMode}
                      onCheckedChange={(checked) => setPropertySettings(prev => ({ ...prev, enableDayNightMode: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Switch Theme</Label>
                      <div className="text-sm text-gray-600 mt-1">
                        Automatically switch between light and dark themes
                      </div>
                    </div>
                    <Switch
                      checked={propertySettings.autoSwitchTheme}
                      onCheckedChange={(checked) => setPropertySettings(prev => ({ ...prev, autoSwitchTheme: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Seasonal Adjustments</Label>
                      <div className="text-sm text-gray-600 mt-1">
                        Adjust operational hours based on seasons
                      </div>
                    </div>
                    <Switch
                      checked={propertySettings.seasonalAdjustments}
                      onCheckedChange={(checked) => setPropertySettings(prev => ({ ...prev, seasonalAdjustments: checked }))}
                    />
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