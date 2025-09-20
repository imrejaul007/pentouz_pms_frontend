import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/utils/toast';
import {
  CalendarIcon, ChevronLeft, ChevronRight, Filter, Settings, Maximize2,
  User, Clock, Bed, IndianRupee, AlertTriangle, CheckCircle,
  MoreHorizontal, Move, Copy, Trash2, Bell, Phone, Mail,
  Zap, Star, Crown, UserCheck, UserX, Coffee, Wifi, Users,
  UserPlus, Building2, Plane, Heart, Baby, Building, Briefcase,
  CreditCard, AlertCircle, Shield, Sparkles, TrendingUp, Archive,
  Search, X, Download, Upload, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, formatISO, differenceInDays } from 'date-fns';
import tapeChartService, { TapeChartData, TapeChartView as TapeChartViewType } from '@/services/tapeChartService';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

// Enhanced interfaces with corporate and advanced features
interface EnhancedRoomCell {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'dirty' | 'clean' | 'out_of_order' | 'blocked';
  guestName?: string;
  bookingId?: string;
  checkIn?: string;
  checkOut?: string;
  rate?: number;
  vipStatus?: 'none' | 'vip' | 'svip' | 'corporate';
  specialRequests?: string[];
  amenities?: string[];
  isDragOver?: boolean;
  isSelected?: boolean;
  guestGender?: 'male' | 'female' | 'other' | 'family';
  bookingType?: 'individual' | 'group' | 'corporate' | 'travel_agent' | 'ota';
  corporateAccount?: {
    companyName: string;
    creditLimit: number;
    currentBalance: number;
    paymentTerms: string;
  };
  otaSource?: string;
  groupId?: string;
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'credit';
  aiPrediction?: {
    demandLevel: 'high' | 'medium' | 'low';
    profitabilityScore: number;
    recommendedRate: number;
    confidence: number;
  };
}

interface QuickBookingForm {
  guestName: string;
  email: string;
  phone: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  bookingType: 'individual' | 'group' | 'corporate' | 'travel_agent' | 'ota';
  corporateCompanyId?: string;
  numberOfGuests: number;
  specialRequests?: string;
  rate?: number;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: TapeChartFilters;
  isDefault?: boolean;
}

interface TapeChartFilters {
  bookingTypes: string[];
  roomStatuses: string[];
  paymentStatuses: string[];
  floors: number[];
  roomTypes: string[];
  vipStatuses: string[];
  dateRange?: { from: Date; to: Date };
  searchQuery?: string;
  showOnlyAvailable?: boolean;
  showOnlyCorporate?: boolean;
  showOnlyOverdue?: boolean;
}

const EnhancedTapeChartView: React.FC = () => {
  // State management
  const [chartData, setChartData] = useState<TapeChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range management
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));
  
  // Enhanced drag-and-drop state
  const [draggedReservation, setDraggedReservation] = useState<any>(null);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ roomId: string; date: string } | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);
  const [quickBookingData, setQuickBookingData] = useState<Partial<QuickBookingForm>>({});
  
  // Advanced filtering
  const [filters, setFilters] = useState<TapeChartFilters>({
    bookingTypes: [],
    roomStatuses: [],
    paymentStatuses: [],
    floors: [],
    roomTypes: [],
    vipStatuses: [],
    showOnlyAvailable: false,
    showOnlyCorporate: false,
    showOnlyOverdue: false
  });
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([
    { id: '1', name: 'Available Rooms', filters: { ...filters, showOnlyAvailable: true } },
    { id: '2', name: 'Corporate Bookings', filters: { ...filters, showOnlyCorporate: true } },
    { id: '3', name: 'Overdue Payments', filters: { ...filters, showOnlyOverdue: true } }
  ]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Visual indicators
  const [highlightCorporate, setHighlightCorporate] = useState(true);
  const [showPaymentStatus, setShowPaymentStatus] = useState(true);
  const [showAIPredictions, setShowAIPredictions] = useState(false);

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [startDate, endDate, filters]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const data = await tapeChartService.getChartData({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        ...filters
      });
      setChartData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load tape chart data');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced drag-and-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, reservation: any) => {
    setDraggedReservation(reservation);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-blue-500 text-white px-3 py-2 rounded shadow-lg';
    dragImage.innerHTML = `<div class="font-semibold">${reservation.guestName}</div><div class="text-sm">${reservation.nights} nights</div>`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 25);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, roomId: string, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragPreview({ roomId, date });
    
    // Visual feedback for valid/invalid drop zones
    const isValidDrop = checkValidDrop(roomId, date);
    e.currentTarget.classList.toggle('bg-green-100', isValidDrop);
    e.currentTarget.classList.toggle('bg-red-100', !isValidDrop);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, roomId: string, date: string) => {
    e.preventDefault();
    setIsDragging(false);
    setDragPreview(null);
    
    if (!draggedReservation) return;
    
    // Check for conflicts
    const isValid = checkValidDrop(roomId, date);
    if (!isValid) {
      toast.error('This room is not available for the selected dates');
      return;
    }
    
    // Show quick booking form for new reservations
    if (!draggedReservation.bookingId) {
      setQuickBookingData({
        ...draggedReservation,
        checkIn: date,
        checkOut: addDays(parseISO(date), draggedReservation.nights || 1).toISOString()
      });
      setShowQuickBooking(true);
      return;
    }
    
    // Move existing reservation
    try {
      await tapeChartService.moveReservation(draggedReservation.bookingId, roomId, date);
      toast.success('Reservation moved successfully');
      fetchChartData();
    } catch (error) {
      toast.error('Failed to move reservation');
    }
  }, [draggedReservation]);

  const checkValidDrop = (roomId: string, date: string): boolean => {
    // Implementation of conflict checking
    if (!chartData || !draggedReservation) return false;
    
    const checkIn = parseISO(date);
    const checkOut = addDays(checkIn, draggedReservation.nights || 1);
    
    // Check room availability for the date range
    // This would check against existing bookings in chartData
    return true; // Simplified for now
  };

  // Multi-room selection with Shift+Click
  const handleRoomClick = useCallback((e: React.MouseEvent, roomId: string) => {
    if (e.shiftKey) {
      const newSelection = new Set(selectedRooms);
      if (newSelection.has(roomId)) {
        newSelection.delete(roomId);
      } else {
        newSelection.add(roomId);
      }
      setSelectedRooms(newSelection);
    } else {
      setSelectedRooms(new Set([roomId]));
    }
  }, [selectedRooms]);

  // Quick booking submission
  const handleQuickBookingSubmit = async () => {
    try {
      await tapeChartService.createQuickBooking(quickBookingData);
      toast.success('Booking created successfully');
      setShowQuickBooking(false);
      setQuickBookingData({});
      fetchChartData();
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  // Filter management
  const applyFilterPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  const saveFilterPreset = () => {
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: prompt('Enter preset name:') || 'Custom Filter',
      filters: { ...filters }
    };
    setFilterPresets([...filterPresets, newPreset]);
    toast.success('Filter preset saved');
  };

  // Get booking type icon
  const getBookingTypeIcon = (bookingType?: string) => {
    switch (bookingType) {
      case 'corporate':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'group':
        return <Users className="w-4 h-4 text-green-600" />;
      case 'travel_agent':
        return <Plane className="w-4 h-4 text-purple-600" />;
      case 'ota':
        return <Wifi className="w-4 h-4 text-orange-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get payment status indicator
  const getPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 text-xs">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
      case 'partial':
        return <Badge className="bg-orange-100 text-orange-800 text-xs">Partial</Badge>;
      case 'credit':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Credit</Badge>;
      default:
        return null;
    }
  };

  // Render room cell with enhanced indicators
  const renderRoomCell = (room: EnhancedRoomCell, date: Date) => {
    const isToday = isSameDay(date, new Date());
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isSelected = selectedRooms.has(room.roomId);
    const isCorporate = room.bookingType === 'corporate';
    
    return (
      <div
        key={`${room.roomId}-${format(date, 'yyyy-MM-dd')}`}
        className={cn(
          'relative min-h-[60px] border border-gray-200 p-1 transition-all cursor-pointer',
          {
            'bg-green-50': room.status === 'available',
            'bg-blue-50': room.status === 'occupied',
            'bg-yellow-50': room.status === 'reserved',
            'bg-red-50': room.status === 'maintenance',
            'bg-gray-50': room.status === 'blocked',
            'border-blue-500 border-2': isToday,
            'bg-gray-100': isWeekend,
            'ring-2 ring-blue-400': isSelected,
            'ring-2 ring-yellow-400 ring-offset-1': isCorporate && highlightCorporate,
            'opacity-50': isDragging && dragPreview?.roomId === room.roomId
          }
        )}
        onClick={(e) => handleRoomClick(e, room.roomId)}
        onDragOver={(e) => handleDragOver(e, room.roomId, format(date, 'yyyy-MM-dd'))}
        onDrop={(e) => handleDrop(e, room.roomId, format(date, 'yyyy-MM-dd'))}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('bg-green-100', 'bg-red-100');
        }}
      >
        {room.bookingId && (
          <div
            className="h-full flex flex-col justify-between"
            draggable
            onDragStart={(e) => handleDragStart(e, {
              bookingId: room.bookingId,
              guestName: room.guestName,
              nights: differenceInDays(parseISO(room.checkOut!), parseISO(room.checkIn!))
            })}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {getBookingTypeIcon(room.bookingType)}
                <span className="text-xs font-medium truncate">{room.guestName}</span>
              </div>
              {room.vipStatus && room.vipStatus !== 'none' && (
                <Crown className={cn('w-4 h-4', {
                  'text-yellow-500': room.vipStatus === 'vip',
                  'text-purple-500': room.vipStatus === 'svip',
                  'text-blue-500': room.vipStatus === 'corporate'
                })} />
              )}
            </div>
            
            {showPaymentStatus && (
              <div className="mt-1">
                {getPaymentStatusBadge(room.paymentStatus)}
              </div>
            )}
            
            {isCorporate && room.corporateAccount && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 mt-1">
                    <Building className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-600 truncate">
                      {room.corporateAccount.companyName}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <div>Credit Limit: {formatCurrency(room.corporateAccount.creditLimit)}</div>
                    <div>Current Balance: {formatCurrency(room.corporateAccount.currentBalance)}</div>
                    <div>Terms: {room.corporateAccount.paymentTerms}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
            
            {showAIPredictions && room.aiPrediction && (
              <div className="mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-purple-600">
                  {room.aiPrediction.profitabilityScore}% profit
                </span>
              </div>
            )}
          </div>
        )}
        
        {room.status === 'available' && showAIPredictions && room.aiPrediction && (
          <div className="text-center">
            <div className={cn('text-xs font-medium', {
              'text-red-600': room.aiPrediction.demandLevel === 'high',
              'text-yellow-600': room.aiPrediction.demandLevel === 'medium',
              'text-green-600': room.aiPrediction.demandLevel === 'low'
            })}>
              {room.aiPrediction.demandLevel.toUpperCase()} demand
            </div>
            <div className="text-xs text-gray-600">
              Rec: {formatCurrency(room.aiPrediction.recommendedRate)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with controls */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Enhanced Tape Chart
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {/* Visual indicators toggle */}
                <div className="flex items-center gap-2 px-3 py-1 border rounded-lg">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        size="sm"
                        variant={highlightCorporate ? 'default' : 'outline'}
                        onClick={() => setHighlightCorporate(!highlightCorporate)}
                      >
                        <Building className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle corporate booking highlights</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        size="sm"
                        variant={showPaymentStatus ? 'default' : 'outline'}
                        onClick={() => setShowPaymentStatus(!showPaymentStatus)}
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle payment status badges</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        size="sm"
                        variant={showAIPredictions ? 'default' : 'outline'}
                        onClick={() => setShowAIPredictions(!showAIPredictions)}
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle AI predictions</TooltipContent>
                  </Tooltip>
                </div>
                
                {/* Filter button */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {Object.values(filters).some(f => 
                    (Array.isArray(f) && f.length > 0) || (typeof f === 'boolean' && f)
                  ) && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1">
                      Active
                    </Badge>
                  )}
                </Button>
                
                {/* Refresh button */}
                <Button variant="outline" onClick={fetchChartData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Date range selector */}
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(subDays(startDate, 7));
                  setEndDate(subDays(endDate, 7));
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={(range: any) => {
                      if (range?.from) setStartDate(range.from);
                      if (range?.to) setEndDate(range.to);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(addDays(startDate, 7));
                  setEndDate(addDays(endDate, 7));
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStartDate(new Date());
                  setEndDate(addDays(new Date(), 14));
                }}
              >
                Today
              </Button>
            </div>
          </CardHeader>
        </Card>
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Filter presets */}
                <div className="col-span-full">
                  <Label>Quick Filters</Label>
                  <div className="flex gap-2 mt-2">
                    {filterPresets.map(preset => (
                      <Button
                        key={preset.id}
                        size="sm"
                        variant="outline"
                        onClick={() => applyFilterPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                    ))}
                    <Button size="sm" variant="outline" onClick={saveFilterPreset}>
                      <Plus className="w-4 h-4 mr-1" />
                      Save Current
                    </Button>
                  </div>
                </div>
                
                {/* Booking Type Filter */}
                <div>
                  <Label>Booking Type</Label>
                  <div className="space-y-2 mt-2">
                    {['individual', 'group', 'corporate', 'travel_agent', 'ota'].map(type => (
                      <div key={type} className="flex items-center">
                        <Checkbox
                          checked={filters.bookingTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ ...filters, bookingTypes: [...filters.bookingTypes, type] });
                            } else {
                              setFilters({ 
                                ...filters, 
                                bookingTypes: filters.bookingTypes.filter(t => t !== type) 
                              });
                            }
                          }}
                        />
                        <label className="ml-2 text-sm capitalize">{type.replace('_', ' ')}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Room Status Filter */}
                <div>
                  <Label>Room Status</Label>
                  <div className="space-y-2 mt-2">
                    {['available', 'occupied', 'reserved', 'maintenance', 'dirty', 'clean'].map(status => (
                      <div key={status} className="flex items-center">
                        <Checkbox
                          checked={filters.roomStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ ...filters, roomStatuses: [...filters.roomStatuses, status] });
                            } else {
                              setFilters({ 
                                ...filters, 
                                roomStatuses: filters.roomStatuses.filter(s => s !== status) 
                              });
                            }
                          }}
                        />
                        <label className="ml-2 text-sm capitalize">{status}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Payment Status Filter */}
                <div>
                  <Label>Payment Status</Label>
                  <div className="space-y-2 mt-2">
                    {['paid', 'pending', 'partial', 'credit'].map(status => (
                      <div key={status} className="flex items-center">
                        <Checkbox
                          checked={filters.paymentStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ ...filters, paymentStatuses: [...filters.paymentStatuses, status] });
                            } else {
                              setFilters({ 
                                ...filters, 
                                paymentStatuses: filters.paymentStatuses.filter(s => s !== status) 
                              });
                            }
                          }}
                        />
                        <label className="ml-2 text-sm capitalize">{status}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick toggles */}
                <div>
                  <Label>Quick Toggles</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center">
                      <Checkbox
                        checked={filters.showOnlyAvailable}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, showOnlyAvailable: !!checked })
                        }
                      />
                      <label className="ml-2 text-sm">Show only available</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox
                        checked={filters.showOnlyCorporate}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, showOnlyCorporate: !!checked })
                        }
                      />
                      <label className="ml-2 text-sm">Show only corporate</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox
                        checked={filters.showOnlyOverdue}
                        onCheckedChange={(checked) => 
                          setFilters({ ...filters, showOnlyOverdue: !!checked })
                        }
                      />
                      <label className="ml-2 text-sm">Show only overdue</label>
                    </div>
                  </div>
                </div>
                
                {/* Search */}
                <div className="col-span-full">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by guest name, booking ID, room number..."
                    value={filters.searchQuery || ''}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="mt-2"
                  />
                </div>
                
                {/* Actions */}
                <div className="col-span-full flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      bookingTypes: [],
                      roomStatuses: [],
                      paymentStatuses: [],
                      floors: [],
                      roomTypes: [],
                      vipStatuses: [],
                      showOnlyAvailable: false,
                      showOnlyCorporate: false,
                      showOnlyOverdue: false
                    })}
                  >
                    Clear All
                  </Button>
                  <Button onClick={fetchChartData}>Apply Filters</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main tape chart - placeholder for actual implementation */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p>Loading tape chart...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-auto" ref={chartContainerRef}>
                {/* Tape chart grid would go here */}
                <div className="min-w-[1200px] p-4">
                  <p className="text-gray-600">Enhanced tape chart grid with drag-and-drop functionality</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Features: Multi-room selection (Shift+Click), Visual drag preview, 
                    Quick booking on drop, Corporate booking indicators, Payment status badges
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Booking Dialog */}
        <Dialog open={showQuickBooking} onOpenChange={setShowQuickBooking}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Booking</DialogTitle>
              <DialogDescription>
                Create a new booking by dragging to the desired room and dates
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <Input
                    value={quickBookingData.guestName || ''}
                    onChange={(e) => setQuickBookingData({ 
                      ...quickBookingData, 
                      guestName: e.target.value 
                    })}
                    placeholder="Enter guest name"
                  />
                </div>
                
                <div>
                  <Label>Booking Type</Label>
                  <Select
                    value={quickBookingData.bookingType || 'individual'}
                    onValueChange={(value: any) => setQuickBookingData({ 
                      ...quickBookingData, 
                      bookingType: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="travel_agent">Travel Agent</SelectItem>
                      <SelectItem value="ota">OTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {quickBookingData.bookingType === 'corporate' && (
                <div>
                  <Label>Corporate Account</Label>
                  <Select
                    value={quickBookingData.corporateCompanyId || ''}
                    onValueChange={(value) => setQuickBookingData({ 
                      ...quickBookingData, 
                      corporateCompanyId: value 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ABC Corporation</SelectItem>
                      <SelectItem value="2">XYZ Industries</SelectItem>
                      <SelectItem value="3">Tech Solutions Inc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={quickBookingData.email || ''}
                    onChange={(e) => setQuickBookingData({ 
                      ...quickBookingData, 
                      email: e.target.value 
                    })}
                    placeholder="guest@example.com"
                  />
                </div>
                
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={quickBookingData.phone || ''}
                    onChange={(e) => setQuickBookingData({ 
                      ...quickBookingData, 
                      phone: e.target.value 
                    })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              
              <div>
                <Label>Special Requests</Label>
                <Input
                  value={quickBookingData.specialRequests || ''}
                  onChange={(e) => setQuickBookingData({ 
                    ...quickBookingData, 
                    specialRequests: e.target.value 
                  })}
                  placeholder="Any special requirements..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuickBooking(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickBookingSubmit}>
                Create Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-300 rounded" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-50 border border-yellow-300 rounded" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Corporate</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span>Group</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-purple-600" />
                <span>Travel Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span>VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <span>Payment Status</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedTapeChartView;