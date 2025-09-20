import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/utils/toast';
import {
  CalendarIcon, ChevronLeft, ChevronRight, Filter, Settings, Maximize2,
  User, Clock, Bed, IndianRupee, AlertTriangle, CheckCircle,
  MoreHorizontal, Move, Copy, Trash2, Bell, Phone, Mail,
  Zap, Star, Crown, UserCheck, UserX, Coffee, Wifi, Users,
  UserPlus, Building2, Plane, Heart, Baby, RefreshCw
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, formatISO } from 'date-fns';
import tapeChartService, { TapeChartData, TapeChartView as TapeChartViewType } from '@/services/tapeChartService';
import { formatCurrency } from '@/utils/currencyUtils';
import { dragDropManager, DraggedReservation, DropTarget } from '@/utils/DragDropManager';
import ReservationSidebar from './ReservationSidebar';
import CollapsibleSidebar from '@/components/ui/CollapsibleSidebar';
import GlobalSearch from '@/components/ui/GlobalSearch';
import LiveChatWidget from '@/components/ui/LiveChatWidget';
import NotificationSystem from '@/components/ui/NotificationSystem';
import ReservationWorkflowPanel from './ReservationWorkflowPanel';
import VIPGuestManager from './VIPGuestManager';
import { UpgradeProcessor } from './UpgradeProcessor';
import { SpecialRequestTracker } from './SpecialRequestTracker';
import { WaitlistProcessor } from './WaitlistProcessor';
import BlockManagementPanel from './BlockManagementPanel';

interface RoomCell {
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
  // New fields for task.md requirements
  guestGender?: 'male' | 'female' | 'other' | 'family';
  bookingType?: 'individual' | 'group' | 'corporate' | 'travel_agent';
  aiPrediction?: {
    demandLevel: 'high' | 'medium' | 'low';
    profitabilityScore: number; // 0-100
    recommendedRate: number;
    confidence: number; // 0-100
  };
  preferences?: {
    roomTemp?: number;
    pillow?: string;
    wakeUpCall?: boolean;
    newspaper?: boolean;
  };
}

interface TimelineCell {
  date: string;
  status: string;
  guestName?: string;
  bookingId?: string;
  rate?: number;
  isWeekend?: boolean;
  isToday?: boolean;
  isBlockedDate?: boolean;
}

// DraggedReservation is now imported from DragDropManager

interface DragState {
  isDragging: boolean;
  draggedItems: DraggedReservation[];
  dragPreview: HTMLElement | null;
  operationId: string | null;
}

interface ConflictIndicator {
  roomId: string;
  date: string;
  conflictType: 'locked' | 'occupied' | 'maintenance' | 'unsuitable';
  message: string;
  suggestions: string[];
}

const TapeChartView: React.FC = () => {
  const [chartData, setChartData] = useState<TapeChartData | null>(null);
  const [views, setViews] = useState<TapeChartViewType[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range management
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // UI state
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<DraggedReservation | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItems: [],
    dragPreview: null,
    operationId: null
  });
  const [conflictIndicators, setConflictIndicators] = useState<Map<string, ConflictIndicator>>(new Map());
  const [roomSuggestions, setRoomSuggestions] = useState<Map<string, any[]>>(new Map());
  const [showFilters, setShowFilters] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [showGuestNames, setShowGuestNames] = useState(true);
  const [showRates, setShowRates] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  
  // Refresh trigger for sidebar
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    floors: [] as number[],
    roomTypes: [] as string[],
    statuses: [] as string[],
    buildings: [] as string[],
    wings: [] as string[]
  });
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    roomId: string;
    visible: boolean;
  }>({ x: 0, y: 0, roomId: '', visible: false });

  // Block creation mode
  const [blockCreationMode, setBlockCreationMode] = useState(false);
  const [selectedRoomsForBlock, setSelectedRoomsForBlock] = useState<Set<string>>(new Set());

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(600);

  // Helper functions for task.md visual indicators
  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'male': return <User className="h-3 w-3 text-blue-600" />;
      case 'female': return <UserCheck className="h-3 w-3 text-pink-600" />;
      case 'family': return <Users className="h-3 w-3 text-green-600" />;
      case 'other': return <Heart className="h-3 w-3 text-purple-600" />;
      default: return null;
    }
  };

  const getBookingTypeIcon = (bookingType?: string) => {
    switch (bookingType) {
      case 'individual': return <User className="h-3 w-3 text-gray-600" />;
      case 'group': return <Users className="h-3 w-3 text-orange-600" />;
      case 'corporate': return <Building2 className="h-3 w-3 text-blue-700" />;
      case 'travel_agent': return <Plane className="h-3 w-3 text-indigo-600" />;
      default: return <User className="h-3 w-3 text-gray-400" />;
    }
  };

  const getBookingTypeColor = (bookingType?: string) => {
    switch (bookingType) {
      case 'individual': return 'bg-gray-100 border-gray-300';
      case 'group': return 'bg-orange-100 border-orange-300';
      case 'corporate': return 'bg-blue-100 border-blue-300';
      case 'travel_agent': return 'bg-indigo-100 border-indigo-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getProfitabilityRoomColor = (timelineData: any, status: string) => {
    // If room is available, show AI prediction profitability colors
    if (status === 'available' && timelineData?.aiPrediction) {
      const score = timelineData.aiPrediction.profitabilityScore;
      if (score >= 80) return 'bg-green-50 border-green-300 hover:bg-green-100';
      if (score >= 60) return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100';
      return 'bg-red-50 border-red-300 hover:bg-red-100';
    }
    
    // For occupied rooms, enhance booking type colors with profitability hints
    if (status !== 'available' && timelineData?.bookingType) {
      const baseColor = getBookingTypeColor(timelineData.bookingType);
      // Add slight gradient for high-value bookings
      if (timelineData.rate && timelineData.rate > 15000) {
        return baseColor.replace('100', '200').replace('300', '400');
      }
      return baseColor;
    }
    
    // Fallback to original status color
    return getStatusColor(status);
  };

  const getRoomNotifications = (roomNumber: string, timelineData: any) => {
    const notifications = [];
    
    // Housekeeping notifications
    if (timelineData?.status === 'dirty') {
      notifications.push({ type: 'housekeeping', priority: 'high', message: 'Room needs cleaning' });
    }
    
    // Maintenance notifications
    if (timelineData?.status === 'maintenance') {
      notifications.push({ type: 'maintenance', priority: 'high', message: 'Under maintenance' });
    }
    
    // VIP guest notifications
    if (timelineData?.vipStatus === 'svip' || timelineData?.vipStatus === 'vip') {
      notifications.push({ type: 'vip', priority: 'medium', message: 'VIP guest' });
    }
    
    // Special requests notifications
    if (timelineData?.specialRequests?.length > 0) {
      notifications.push({ type: 'request', priority: 'medium', message: 'Special requests' });
    }
    
    // AI prediction alerts for high demand
    if (timelineData?.aiPrediction?.demandLevel === 'high' && timelineData?.status === 'available') {
      notifications.push({ type: 'demand', priority: 'low', message: 'High demand period' });
    }
    
    return notifications;
  };

  const getNotificationBadge = (notifications: any[]) => {
    if (notifications.length === 0) return null;
    
    const highPriority = notifications.filter(n => n.priority === 'high').length;
    const hasNotifications = notifications.length > 0;
    
    return (
      <div className="absolute -top-1 -right-1 z-10">
        {highPriority > 0 ? (
          <div className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {highPriority}
          </div>
        ) : hasNotifications ? (
          <div className="bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {notifications.length}
          </div>
        ) : null}
      </div>
    );
  };

  const getAIPredictionIndicator = (aiPrediction?: RoomCell['aiPrediction']) => {
    if (!aiPrediction) return null;
    
    const getDemandColor = (level: string) => {
      switch (level) {
        case 'high': return 'text-red-500';
        case 'medium': return 'text-yellow-500';
        case 'low': return 'text-green-500';
        default: return 'text-gray-400';
      }
    };

    const getProfitabilityColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-yellow-600';
      if (score >= 40) return 'text-orange-600';
      return 'text-red-600';
    };

    return (
      <div className="flex items-center space-x-1">
        <Zap className={`h-3 w-3 ${getDemandColor(aiPrediction.demandLevel)}`} />
        <span className={`text-xs font-medium ${getProfitabilityColor(aiPrediction.profitabilityScore)}`}>
          {aiPrediction.profitabilityScore}%
        </span>
      </div>
    );
  };

  const getVipIcon = (vipStatus?: string) => {
    switch (vipStatus) {
      case 'vip': return <Star className="h-3 w-3 text-yellow-500" />;
      case 'svip': return <Crown className="h-3 w-3 text-gold-500" />;
      case 'corporate': return <Building2 className="h-3 w-3 text-blue-600" />;
      default: return null;
    }
  };

  const getPreferenceIcons = (preferences?: any) => {
    if (!preferences) return null;
    return (
      <div className="flex gap-1 mt-1">
        {preferences.wakeUpCall && <Bell className="h-2 w-2 text-orange-500" />}
        {preferences.newspaper && <Coffee className="h-2 w-2 text-brown-500" />}
        {preferences.roomTemp && <Zap className="h-2 w-2 text-blue-400" />}
      </div>
    );
  };

  useEffect(() => {
    fetchViews();
  }, []);

  useEffect(() => {
    if (selectedView) {
      fetchChartData();
    }
  }, [selectedView, startDate, endDate]);

  // Auto-refresh every 30 seconds to keep data updated
  useEffect(() => {
    if (!selectedView) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing tape chart data...');
      fetchChartData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedView, startDate, endDate]);

  const fetchViews = async () => {
    try {
      console.log('Fetching tape chart views...');
      const response = await tapeChartService.getTapeChartViews();
      console.log('Views response:', response);
      setViews(response.data || []);
      if (response.data?.length > 0) {
        console.log('Setting selected view to:', response.data[0]._id);
        setSelectedView(response.data[0]._id);
      } else {
        console.log('No views found');
      }
    } catch (err: any) {
      console.error('Views fetch error:', err);
      setError(err.message || 'Failed to fetch views');
      toast.error('Failed to load tape chart views');
    }
  };

  const fetchChartData = async () => {
    if (!selectedView) {
      console.log('No selectedView, skipping chart data fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching chart data for view:', selectedView, 'dates:', startDate, endDate);
      const response = await tapeChartService.generateTapeChartData(selectedView, {
        startDate: formatISO(startDate, { representation: 'date' }),
        endDate: formatISO(endDate, { representation: 'date' })
      });
      console.log('Chart data response:', response);
      setChartData(response);
      setError(null);
    } catch (err: any) {
      console.error('Chart data fetch error:', err);
      setError(err.message || 'Failed to fetch chart data');
      toast.error('Failed to load tape chart data');
    } finally {
      setLoading(false);
    }
  };

  const getDatesInRange = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const getStatusColor = (status: string): string => {
    const colors = {
      available: 'bg-green-50 text-green-900 border-green-300 hover:bg-green-100',
      occupied: 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100',
      reserved: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100',
      maintenance: 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100',
      dirty: 'bg-orange-50 text-orange-900 border-orange-300 hover:bg-orange-100',
      clean: 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100',
      out_of_order: 'bg-gray-50 text-gray-900 border-gray-300 hover:bg-gray-100',
      blocked: 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100',
      checkout: 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100',
      checkin: 'bg-cyan-50 text-cyan-900 border-cyan-300 hover:bg-cyan-100'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      available: <CheckCircle className="w-3 h-3 text-green-600" />,
      occupied: <User className="w-3 h-3 text-red-600" />,
      reserved: <Clock className="w-3 h-3 text-amber-600" />,
      maintenance: <AlertTriangle className="w-3 h-3 text-purple-600" />,
      dirty: <AlertTriangle className="w-3 h-3 text-orange-600" />,
      clean: <CheckCircle className="w-3 h-3 text-blue-600" />,
      out_of_order: <UserX className="w-3 h-3 text-gray-600" />,
      blocked: <UserX className="w-3 h-3 text-indigo-600" />,
      checkout: <UserCheck className="w-3 h-3 text-teal-600" />,
      checkin: <UserCheck className="w-3 h-3 text-cyan-600" />
    };
    return icons[status as keyof typeof icons] || icons.available;
  };




  const getBookingTypeIndicator = (bookingType?: string) => {
    const indicators = {
      individual: { color: 'bg-blue-500', label: 'IND' },
      group: { color: 'bg-green-500', label: 'GRP' },
      travel_agent: { color: 'bg-orange-500', label: 'TA' },
      corporate: { color: 'bg-purple-500', label: 'CORP' },
      online: { color: 'bg-cyan-500', label: 'OTA' },
      walk_in: { color: 'bg-gray-500', label: 'WI' }
    };
    
    const indicator = indicators[bookingType as keyof typeof indicators];
    if (!indicator) return null;
    
    return (
      <div className={`absolute bottom-1 left-1 ${indicator.color} text-white text-xs px-1 rounded-sm font-bold`}>
        {indicator.label}
      </div>
    );
  };

  const handleDragStart = (e: React.DragEvent, reservation: DraggedReservation) => {
    setDraggedItem(reservation);
    e.dataTransfer.effectAllowed = 'move';

    // Get selected reservations for batch operations
    const selectedIds = dragDropManager.getSelectedReservations();
    let draggedReservations: DraggedReservation[];

    if (selectedIds.length > 0 && selectedIds.includes(reservation.id)) {
      // If the dragged reservation is part of a selection, drag all selected
      draggedReservations = [reservation]; // Start with the clicked one
      // TODO: Add other selected reservations from the sidebar data
    } else {
      // Single reservation drag
      draggedReservations = [reservation];
    }

    // Determine operation type based on selection
    const operationType = selectedIds.length > 1 ? 'batch_assign' : 'assign';

    // Start drag operation
    const operationId = dragDropManager.startDragOperation(draggedReservations, operationType);

    // Create enhanced drag image
    const dragImage = dragDropManager.createDragImage(draggedReservations);
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Update drag state
    setDragState({
      isDragging: true,
      draggedItems: draggedReservations,
      dragPreview: dragImage,
      operationId
    });

    // Clean up drag image
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);

    // Clear any existing conflict indicators
    setConflictIndicators(new Map());

    // Generate room suggestions for the dragged reservation
    generateRoomSuggestions(reservation);

    console.log(`🚀 Drag started: ${operationType} with ${draggedReservations.length} reservation(s)`);
  };

  const handleDragOver = async (e: React.DragEvent, cellId: string) => {
    e.preventDefault();

    if (!dragState.isDragging || dragState.draggedItems.length === 0) return;

    const [roomNumber, dateStr] = cellId.split('-');
    const room = chartData?.rooms?.find(r => r.config.roomNumber === roomNumber);

    if (!room) return;

    // Create drop target
    const dropTarget: DropTarget = {
      roomId: room.room?._id || room.config.roomId,
      roomNumber: room.config.roomNumber,
      date: dateStr,
      isAvailable: true
    };

    // Check for conflicts
    const reservation = dragState.draggedItems[0];
    const conflictCheck = await dragDropManager.checkRoomAvailability(
      dropTarget.roomId,
      dropTarget.date,
      reservation
    );

    if (!conflictCheck.isAvailable) {
      e.dataTransfer.dropEffect = 'none';
      setConflictIndicators(prev => {
        const newMap = new Map(prev);
        newMap.set(cellId, {
          roomId: dropTarget.roomId,
          date: dropTarget.date,
          conflictType: conflictCheck.conflictReason?.includes('locked') ? 'locked' : 'occupied',
          message: conflictCheck.conflictReason || 'Conflict detected',
          suggestions: conflictCheck.suggestions || []
        });
        return newMap;
      });
    } else {
      e.dataTransfer.dropEffect = 'move';
      // Clear any previous conflict for this cell
      setConflictIndicators(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellId);
        return newMap;
      });
    }

    setDragOverCell(cellId);
    dragDropManager.registerDropZone(cellId, dropTarget);
  };

  const handleDragLeave = (e: React.DragEvent, cellId?: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverCell(null);

      // Clear conflict indicators for this cell
      if (cellId) {
        setConflictIndicators(prev => {
          const newMap = new Map(prev);
          newMap.delete(cellId);
          return newMap;
        });
        dragDropManager.unregisterDropZone(cellId);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, roomId: string, date: string, roomNumber?: string) => {
    e.preventDefault();

    if (!dragState.isDragging || dragState.draggedItems.length === 0) {
      console.log('No drag operation in progress');
      return;
    }

    const cellId = `${roomNumber || roomId}-${date}`;
    const dropTarget = dragDropManager.getDropZone(cellId);

    if (!dropTarget) {
      console.log('No drop target registered for cell:', cellId);
      return;
    }

    // Check for conflicts one more time
    const hasConflict = conflictIndicators.has(cellId);
    if (hasConflict) {
      const conflict = conflictIndicators.get(cellId)!;
      const proceedAnyway = window.confirm(
        `⚠️ Conflict detected: ${conflict.message}\n\nSuggestions:\n${conflict.suggestions.join('\n')}\n\nProceed anyway?`
      );

      if (!proceedAnyway) {
        endDragOperation();
        return;
      }
    }

    // Show confirmation for moves
    const reservationsText = dragState.draggedItems.length === 1
      ? `${dragState.draggedItems[0].guestName}'s reservation`
      : `${dragState.draggedItems.length} reservations`;

    const confirmed = window.confirm(
      `Move ${reservationsText} to room ${roomNumber || roomId} for ${date}?`
    );

    if (!confirmed) {
      endDragOperation();
      return;
    }

    try {
      const result = await dragDropManager.executeAssignment(
        dragState.draggedItems,
        dropTarget,
        {
          notes: `Moved via enhanced drag & drop to room ${roomNumber || roomId} for ${date}`,
          moveReason: 'Staff reassignment via enhanced tape chart',
          sendNotification: true,
          lockRoom: true
        }
      );

      if (result.success) {
        fetchChartData();
        setRefreshTrigger(prev => prev + 1);
      }

    } catch (err: any) {
      console.error('Enhanced room assignment error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to move reservation');
    } finally {
      endDragOperation();
    }
  };

  const handleRoomSelect = (roomId: string) => {
    const newSelection = new Set(selectedRooms);
    if (newSelection.has(roomId)) {
      newSelection.delete(roomId);
    } else {
      newSelection.add(roomId);
    }
    setSelectedRooms(newSelection);
  };

  const handleRightClick = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      roomId,
      visible: true
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Enhanced drag & drop helper functions
  const generateRoomSuggestions = async (reservation: DraggedReservation) => {
    try {
      const suggestions = await dragDropManager.getSuggestedRooms(reservation);
      const suggestionMap = new Map();

      suggestions.forEach(suggestion => {
        const cellId = `${suggestion.roomNumber}-${format(startDate, 'yyyy-MM-dd')}`;
        suggestionMap.set(cellId, suggestion);
      });

      setRoomSuggestions(suggestionMap);
    } catch (error) {
      console.error('Error generating room suggestions:', error);
    }
  };

  const endDragOperation = () => {
    dragDropManager.endDragOperation();
    setDragState({
      isDragging: false,
      draggedItems: [],
      dragPreview: null,
      operationId: null
    });
    setDraggedItem(null);
    setDragOverCell(null);
    setConflictIndicators(new Map());
    setRoomSuggestions(new Map());
  };

  // Cleanup drag state on component unmount or when drag ends unexpectedly
  useEffect(() => {
    const handleDragEnd = () => {
      if (dragState.isDragging) {
        console.log('Drag operation ended unexpectedly, cleaning up...');
        endDragOperation();
      }
    };

    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('mouseup', handleDragEnd);
      dragDropManager.cleanup();
    };
  }, [dragState.isDragging]);

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await tapeChartService.updateRoomStatus(roomId, {
        status: newStatus,
        notes: `Status changed to ${newStatus} via tape chart`,
        changeReason: 'Manual update'
      });
      toast.success(`Room ${roomId} status updated to ${newStatus}`);
      fetchChartData();
      hideContextMenu();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  const handleCreateBlockFromSelection = async () => {
    try {
      if (selectedRoomsForBlock.size === 0) {
        toast.error('Please select rooms to create a block');
        return;
      }

      const roomIds = Array.from(selectedRoomsForBlock);
      // This would typically open a modal or form for block creation
      // For now, we'll just show a placeholder
      toast.info(`Creating block with ${roomIds.length} rooms`);

      // Reset selection and exit block mode
      setSelectedRoomsForBlock(new Set());
      setBlockCreationMode(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create block');
    }
  };

  const toggleBlockCreationMode = () => {
    setBlockCreationMode(!blockCreationMode);
    if (blockCreationMode) {
      // Exiting block mode, clear selections
      setSelectedRoomsForBlock(new Set());
    }
  };

  const renderRoomCell = (room: any, date: Date) => {
    const cellId = `${room.config.roomNumber}-${format(date, 'yyyy-MM-dd')}`;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = isSameDay(date, new Date());
    const isDragOver = dragOverCell === cellId;
    const hasConflict = conflictIndicators.has(cellId);
    const conflict = conflictIndicators.get(cellId);
    const isRecommended = roomSuggestions.has(cellId);
    
    // Find timeline data for this date
    const timelineData = room.timeline.find((t: any) => 
      isSameDay(parseISO(t.date), date)
    );
    
    const status = timelineData?.status || 'available';
    const guestName = timelineData?.guestName;
    const rate = timelineData?.rate;
    
    return (
      <div
        key={cellId}
        className={`
          relative min-h-[${compactView ? '32px' : '48px'}] border border-gray-200
          ${getProfitabilityRoomColor(timelineData, status)}
          ${isDragOver && !hasConflict ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-400' : ''}
          ${isDragOver && hasConflict ? 'ring-2 ring-red-500 bg-red-50 border-red-400' : ''}
          ${isRecommended ? 'ring-1 ring-green-400 bg-green-50' : ''}
          ${isToday ? 'ring-1 ring-blue-300' : ''}
          ${isWeekend ? 'bg-opacity-60' : ''}
          transition-all duration-150 cursor-pointer hover:shadow-sm
          ${dragState.isDragging ? 'hover:ring-2 hover:ring-blue-300' : ''}
        `}
        onDragOver={(e) => handleDragOver(e, cellId)}
        onDragLeave={(e) => handleDragLeave(e, cellId)}
        onDrop={(e) => handleDrop(e, room.room?._id || room.config.roomId, format(date, 'yyyy-MM-dd'), room.config.roomNumber)}
        onClick={() => handleRoomSelect(room.config._id)}
        onContextMenu={(e) => handleRightClick(e, room.config._id)}
      >
        {/* Status indicator */}
        <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(status).replace('bg-', 'bg-').replace('-50', '-500')}`} />
        
        {/* Status icon */}
        <div className="absolute top-1 left-1">
          {getStatusIcon(status)}
        </div>
        
        {/* Notification badges */}
        {getNotificationBadge(getRoomNotifications(room.config.roomNumber, timelineData))}
        
        {/* Enhanced drag drop indicators */}
        {isDragOver && !hasConflict && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-75 border-2 border-dashed border-blue-400">
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Drop to assign
            </div>
          </div>
        )}

        {/* Conflict indicator */}
        {isDragOver && hasConflict && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-90 border-2 border-dashed border-red-400">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {conflict?.conflictType === 'locked' ? 'Room Locked' : 'Conflict!'}
            </div>
          </div>
        )}

        {/* Recommendation indicator */}
        {isRecommended && !isDragOver && (
          <div className="absolute top-1 right-1">
            <div className="bg-green-500 text-white rounded-full p-1 text-xs">
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-1 pl-5 text-xs">
          {showGuestNames && guestName && (
            <div className="space-y-1">
              <div className="font-medium truncate flex items-center gap-1">
                {getGenderIcon(timelineData?.gender)}
                {getVipIcon(timelineData?.vipStatus)}
                {getBookingTypeIcon(timelineData?.bookingType)}
                {guestName}
              </div>
              <div className="flex items-center justify-between">
                {getPreferenceIcons(timelineData?.preferences)}
                {getAIPredictionIndicator(timelineData?.aiPrediction)}
              </div>
              {timelineData?.bookingType && (
                <div className="text-xs opacity-75 capitalize">
                  {timelineData.bookingType.replace('_', ' ')}
                </div>
              )}
            </div>
          )}
          
          {showRates && rate && (
            <div className="text-gray-600 font-mono">
              {formatCurrency(rate)}
            </div>
          )}
          
          {timelineData?.bookingId && (
            <div className="text-gray-500 text-xs opacity-75">
              #{timelineData.bookingId.slice(-6)}
            </div>
          )}
        </div>
        
        {/* Special indicators */}
        {timelineData?.specialRequests?.length > 0 && (
          <Bell className="absolute top-1 right-1 w-3 h-3 text-orange-500" />
        )}
        
        {status === 'maintenance' && (
          <AlertTriangle className="absolute bottom-1 right-1 w-3 h-3 text-red-500" />
        )}
        
        {status === 'clean' && (
          <CheckCircle className="absolute bottom-1 right-1 w-3 h-3 text-green-500" />
        )}
        
        {/* Booking type indicator */}
        {timelineData?.bookingType && getBookingTypeIndicator(timelineData.bookingType)}
      </div>
    );
  };

  const renderRoomRow = (room: any, index: number) => {
    const isSelected = selectedRooms.has(room.config._id);
    
    return (
      <div key={room.config._id} className="flex min-w-fit border-b border-gray-200">
        {/* Room header */}
        <div className={`
          sticky left-0 z-10 bg-white border-r border-gray-300 p-2
          min-w-[150px] flex flex-col justify-center
          ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
        `}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{room.config.roomNumber}</div>
              <div className="text-xs text-gray-500">{room.config.roomType}</div>
              <div className="text-xs text-gray-400">Floor {room.config.floor}</div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(room.currentStatus).replace('bg-', 'bg-').replace('-100', '-500')}`} />
              <Badge variant="outline" className="text-xs px-1">
                {room.currentStatus}
              </Badge>
            </div>
          </div>
          
          {room.room?.amenities?.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {room.room.amenities.includes('wifi') && <Wifi className="w-3 h-3 text-gray-400" />}
              {room.room.amenities.includes('coffee') && <Coffee className="w-3 h-3 text-gray-400" />}
            </div>
          )}
        </div>
        
        {/* Timeline cells */}
        <div className="flex flex-1">
          {getDatesInRange.map(date => renderRoomCell(room, date))}
        </div>
      </div>
    );
  };

  if (loading && !chartData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen flex overflow-x-auto" onClick={hideContextMenu}>
        {/* Collapsible Menu Sidebar */}
        <CollapsibleSidebar
          isCollapsed={isMenuCollapsed}
          onToggle={() => setIsMenuCollapsed(!isMenuCollapsed)}
          className="h-full border-r border-gray-200"
        />
        
        {/* Reservations Sidebar */}
        {showSidebar && (
          <div className="w-80 border-r border-gray-200 bg-gray-50">
            <ReservationSidebar
              onDragStart={handleDragStart}
              selectedDate={startDate}
              isCompact={compactView}
              refreshTrigger={refreshTrigger}
              className="h-full"
            />
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 p-4 space-y-4 flex flex-col min-w-fit">
        {/* Header */}
        <Card className="flex-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="w-5 h-5" />
                  Interactive Tape Chart
                  {selectedRooms.size > 0 && (
                    <Badge variant="secondary">
                      {selectedRooms.size} room{selectedRooms.size !== 1 ? 's' : ''} selected
                    </Badge>
                  )}
                </CardTitle>
              </div>
              
              {/* Global Search */}
              <div className="flex-1 max-w-md mx-8">
                <GlobalSearch
                  onResultSelect={(result) => {
                    console.log('Selected:', result);
                    // Handle navigation to selected result
                  }}
                  placeholder="Search reservations, guests, rooms..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Batch operation controls */}
                {dragDropManager.getSelectionCount() > 1 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {dragDropManager.getSelectionCount()} selected for batch assignment
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        dragDropManager.clearSelection();
                        setRefreshTrigger(prev => prev + 1);
                      }}
                      className="h-6 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      Clear
                    </Button>
                  </div>
                )}

              </div>
              
              <div className="flex items-center gap-2">
                <Select value={selectedView} onValueChange={setSelectedView}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    {views.map(view => (
                      <SelectItem key={view._id} value={view._id}>
                        {view.viewName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const newStart = subDays(startDate, 7);
                          const newEnd = subDays(endDate, 7);
                          setStartDate(newStart);
                          setEndDate(newEnd);
                        }}>
                          Previous Week
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const today = new Date();
                          setStartDate(today);
                          setEndDate(addDays(today, 7));
                        }}>
                          This Week
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const newStart = addDays(startDate, 7);
                          const newEnd = addDays(endDate, 7);
                          setStartDate(newStart);
                          setEndDate(newEnd);
                        }}>
                          Next Week
                        </Button>
                      </div>
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from) setStartDate(range.from);
                          if (range?.to) setEndDate(range.to);
                          setDateRange(range || {});
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant={showSidebar ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSidebar(!showSidebar)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Sidebar
                  </Button>
                  
                  <Button
                    variant={compactView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCompactView(!compactView)}
                  >
                    Compact
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔄 Manual refresh triggered');
                      fetchChartData();
                    }}
                    title="Refresh tape chart data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>

                  {/* Undo button for drag operations */}
                  {dragDropManager.canUndo() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dragDropManager.undoLastOperation()}
                      title="Undo last operation"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </Button>
                  )}

                  {/* Drag operation status */}
                  {dragState.isDragging && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-700 font-medium">
                        Dragging {dragState.draggedItems.length} reservation{dragState.draggedItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Block creation controls */}
                  {blockCreationMode && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">
                        Block Mode: {selectedRoomsForBlock.size} room{selectedRoomsForBlock.size !== 1 ? 's' : ''} selected
                      </span>
                      {selectedRoomsForBlock.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreateBlockFromSelection}
                          className="h-6 px-2 text-xs border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          Create Block
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleBlockCreationMode}
                        className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {/* Advanced Enterprise Features */}
                  <div className="flex items-center gap-2">
                    <ReservationWorkflowPanel />
                    <VIPGuestManager />
                    <UpgradeProcessor />
                    <SpecialRequestTracker />
                    <WaitlistProcessor />
                    <BlockManagementPanel />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowGuestNames(!showGuestNames)}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          {showGuestNames ? 'Hide' : 'Show'} Guest Names
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowRates(!showRates)}>
                          <IndianRupee className="w-4 h-4 mr-2" />
                          {showRates ? 'Hide' : 'Show'} Rates
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={fetchChartData}>
                          <Zap className="w-4 h-4 mr-2" />
                          Refresh Data
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Chart summary */}
            {chartData?.summary && (
              <div className="pt-3 space-y-3">
                {/* Main stats row */}
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-800">{chartData.summary.totalRooms}</div>
                    <div className="text-xs text-gray-600">Total Rooms</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-800">{chartData.summary.occupiedRooms}</div>
                    <div className="text-xs text-red-600">Occupied</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-800">{chartData.summary.availableRooms}</div>
                    <div className="text-xs text-green-600">Available</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-800">{chartData.summary.reservedRooms}</div>
                    <div className="text-xs text-amber-600">Reserved</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-800">{chartData.summary.maintenanceRooms}</div>
                    <div className="text-xs text-purple-600">Maintenance</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-800">{chartData.summary.occupancyRate.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600">Occupancy</div>
                  </div>
                </div>

                {/* Occupancy progress bar */}
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-500 ease-out"
                    style={{ width: `${chartData.summary.occupancyRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>Target: 85%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>
        
        {/* Main chart */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full">
            <div className="w-full h-full overflow-auto" ref={chartRef}>
              <div className="min-w-fit">
                {/* Date header */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-300">
                  <div className="flex min-w-fit">
                  <div className="sticky left-0 z-30 bg-gray-50 border-r border-gray-300 min-w-[150px] p-3">
                    <div className="font-medium">Room</div>
                  </div>
                  {getDatesInRange.map(date => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isToday = isSameDay(date, new Date());
                    
                    return (
                      <div
                        key={format(date, 'yyyy-MM-dd')}
                        className={`
                          min-w-[120px] p-2 border-r border-gray-200 text-center
                          ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                          ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                        `}
                      >
                        <div className="font-medium text-sm">
                          {format(date, 'EEE')}
                        </div>
                        <div className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          {format(date, 'MMM dd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
                {/* Room rows */}
                <div className="divide-y divide-gray-200">
                  {chartData?.rooms?.map((room, index) => (
                    <div key={room.room?._id || `room-${index}`}>
                      {renderRoomRow(room, index)}
                    </div>
                  ))}
                </div>

                {(!chartData?.rooms || chartData.rooms.length === 0) && (
                  <div className="p-8 text-center text-gray-500">
                    <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No room data available</p>
                    <p className="text-sm">Try selecting a different view or date range</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Enhanced Context Menu */}
        {contextMenu.visible && (
          <div
            className="fixed z-50 bg-white rounded-md shadow-xl border border-gray-200 py-1 min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
          >
            <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
              Room {contextMenu.roomId}
            </div>
            
            {/* Quick Actions Section */}
            <div className="py-1 border-b">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Quick Actions</div>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <UserPlus className="mr-2 h-4 w-4 text-blue-600" />
                Check In Guest
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <UserX className="mr-2 h-4 w-4 text-red-600" />
                Check Out Guest
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Calendar className="mr-2 h-4 w-4 text-green-600" />
                New Reservation
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Copy className="mr-2 h-4 w-4 text-orange-600" />
                Duplicate Booking
              </button>
            </div>

            {/* Housekeeping Section */}
            <div className="py-1 border-b">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Housekeeping</div>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50" 
                      onClick={() => handleStatusChange(contextMenu.roomId, 'clean')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Mark Clean
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => handleStatusChange(contextMenu.roomId, 'dirty')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                Mark Dirty
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Settings className="mr-2 h-4 w-4 text-blue-600" />
                Inspect Required
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => handleStatusChange(contextMenu.roomId, 'maintenance')}>
                <Zap className="mr-2 h-4 w-4 text-red-600" />
                Maintenance
              </button>
            </div>

            {/* Guest Services Section */}
            <div className="py-1 border-b">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Guest Services</div>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Phone className="mr-2 h-4 w-4 text-blue-600" />
                Call Guest
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Mail className="mr-2 h-4 w-4 text-green-600" />
                Send Message
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Coffee className="mr-2 h-4 w-4 text-orange-600" />
                Room Service
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Star className="mr-2 h-4 w-4 text-yellow-600" />
                VIP Services
              </button>
            </div>

            {/* Management Section */}
            <div className="py-1">
              <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">Management</div>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Move className="mr-2 h-4 w-4 text-purple-600" />
                Move Guest
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <IndianRupee className="mr-2 h-4 w-4 text-green-600" />
                Billing Details
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                <Users className="mr-2 h-4 w-4 text-indigo-600" />
                Group Management
              </button>
              <button className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Booking
              </button>
            </div>
          </div>
        )}
        </div>
        
        {/* Live Chat Widget */}
        <LiveChatWidget position="bottom-right" />
        
        {/* Notification System */}
        <NotificationSystem position="top-right" soundEnabled={true} />
      </div>
    </TooltipProvider>
  );
};

export default TapeChartView;