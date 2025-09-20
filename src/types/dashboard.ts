// Dashboard Types for Admin Frontend
export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// Real-time Dashboard Types
export interface TotalStats {
  totalGuests: number;
  totalHotels: number;
  totalBookings: number;
  totalRooms: number;
}

export interface TodayStats {
  newBookings: number;
  checkIns: number;
  checkOuts: number;
  newServiceRequests: number;
}

export interface MonthlyStats {
  monthlyBookings: number;
  monthlyRevenue: number;
}

export interface OccupancyOverview {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  availableRooms: number;
  outOfOrderRooms: number;
}

export interface RevenueOverview {
  totalRevenue: number;
  todayRevenue: number;
  averageBookingValue: number;
  revenueGrowth: number;
}

export interface GuestService {
  _id: string;
  serviceType: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  requestDate: string;
  userId: {
    _id: string;
    name: string;
  };
  roomId: {
    _id: string;
    roomNumber: string;
  };
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount: number;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  rooms: {
    roomId: {
      _id: string;
      roomNumber: string;
      type: string;
    };
    rate: number;
  }[];
}

export interface Alert {
  id: string;
  type: 'incident' | 'maintenance' | 'finance' | 'service' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  title: string;
  message: string;
  timestamp?: string; // Keep for backward compatibility
  createdAt?: string; // Backend sends this
  hotel?: string;
  guest?: string;
  action?: string;
  actionUrl?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  database: 'connected' | 'disconnected' | 'slow';
  api: 'operational' | 'degraded' | 'down';
  storage: 'normal' | 'high' | 'critical';
}

export interface RealTimeDashboard {
  totalStats: TotalStats;
  todayStats: TodayStats;
  monthlyStats: MonthlyStats;
  monthly: {
    bookings: number;
    revenue: number;
  };
  occupancy: {
    rate: number;
    occupied: number;
    available: number;
    total: number;
    roomStatus: any;
  };
  overview: {
    totalGuests: number;
    totalHotels: number;
    totalBookings: number;
    totalRooms: number;
    occupancyRate: number;
  };
  guestSatisfaction: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: any;
    monthlyReviews: number;
  };
  revenue: {
    trend: any[];
    today: number;
    monthly: number;
    averageDailyRate: number;
  };
  today: {
    newBookings: number;
    checkIns: number;
    checkOuts: number;
    serviceRequests: number;
    revenue: number;
  };
  operations: any;
  recentActivity: any;
  alerts: any;
  communication: any;
  lastUpdated: string;
}

// KPI Types
export interface KPIData {
  totalRevenue: number;
  totalBookings: number;
  averageOccupancy: number;
  guestSatisfaction: number;
  totalRooms: number;
  activeGuests: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingMaintenance: number;
  activeIncidents: number;
  revenueGrowth: number;
  bookingGrowth: number;
  occupancyGrowth: number;
  satisfactionGrowth: number;
}

// Occupancy Types
export interface RoomStatus {
  _id: string;
  roomNumber: string;
  floor: number;
  type: string;
  status: 'occupied' | 'vacant_dirty' | 'vacant_clean' | 'out_of_order' | 'maintenance';
  currentBooking: Booking | null;
  nextBooking: Booking | null;
  housekeepingStatus: 'pending' | 'in_progress' | 'completed';
  maintenanceRequired: boolean;
}

export interface FloorOccupancy {
  floor: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  outOfOrderRooms: number;
  occupancyRate: number;
}

export interface OccupancyData {
  overallMetrics: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    cleaningRooms: number;
    maintenanceRooms: number;
    outOfOrderRooms: number;
    occupancyRate: number;
    availabilityRate: number;
  };
  floorMetrics: {
    _id: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    outOfOrderRooms: number;
    occupancyRate: number;
    rooms: {
      _id: string;
      roomNumber: string;
      type: string;
      status: string;
      isOccupied: boolean;
    }[];
  }[];
  roomTypeDistribution: {
    [roomType: string]: {
      total: number;
      occupied: number;
      available: number;
      cleaning: number;
      maintenance: number;
    };
  };
  rooms: any[];
  todaySchedule: {
    checkouts: any[];
    checkins: any[];
  };
  housekeepingStatus: any[];
  lastUpdated: string;
}

// Revenue Types
export interface RevenueBySource {
  source: string;
  amount: number;
  percentage: number;
  bookings: number;
}

export interface RevenueByRoomType {
  roomType: string;
  revenue: number;
  percentage: number;
  bookings: number;
  averageRate: number;
}

export interface RevenueTimeSeries {
  date: string;
  revenue: number;
  bookings: number;
  averageRate: number;
}

export interface PaymentStatusBreakdown {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface RevenueData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
    revenueGrowth: number;
    bookingGrowth: number;
  };
  timeSeries: RevenueTimeSeries[];
  bySource: RevenueBySource[];
  byRoomType: RevenueByRoomType[];
  byPaymentStatus: PaymentStatusBreakdown[];
  periodComparison: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  };
  forecast: {
    date: string;
    projectedRevenue: number;
  }[];
}

// Staff Performance Types
export interface StaffMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  email: string;
}

export interface TaskPerformance {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  averageCompletionTime: number;
  onTimeCompletion: number;
}

export interface StaffPerformanceData {
  overview: {
    totalStaff: number;
    activeToday: number;
    totalTasksToday: number;
    completedTasksToday: number;
    averagePerformanceScore: number;
  };
  byDepartment: {
    department: string;
    staffCount: number;
    tasks: TaskPerformance;
    performanceScore: number;
  }[];
  topPerformers: {
    staff: StaffMember;
    tasks: TaskPerformance;
    performanceScore: number;
  }[];
  taskDistribution: {
    taskType: string;
    total: number;
    completed: number;
    pending: number;
    averageTime: number;
  }[];
}

// Guest Satisfaction Types
export interface ReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
}

export interface CategoryRatings {
  category: string;
  averageRating: number;
  totalReviews: number;
  trend: number;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  commonWords: {
    word: string;
    count: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }[];
}

export interface GuestSatisfactionData {
  overview: ReviewSummary;
  categories: CategoryRatings[];
  sentiment: SentimentAnalysis;
  recentReviews: {
    _id: string;
    userId: {
      name: string;
    };
    rating: number;
    title: string;
    content: string;
    categories: {
      cleanliness: number;
      service: number;
      location: number;
      value: number;
    };
    reviewDate: string;
  }[];
  trends: {
    date: string;
    averageRating: number;
    totalReviews: number;
  }[];
}

// Operations Types
export interface HousekeepingOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  averageCompletionTime: number;
}

export interface MaintenanceOverview {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  urgentTasks: number;
  averageResolutionTime: number;
}

export interface OperationsData {
  housekeeping: HousekeepingOverview & {
    byStatus: {
      status: string;
      count: number;
    }[];
    byPriority: {
      priority: string;
      count: number;
    }[];
    recentTasks: any[];
  };
  maintenance: MaintenanceOverview & {
    byType: {
      type: string;
      count: number;
    }[];
    byPriority: {
      priority: string;
      count: number;
    }[];
    recentTasks: any[];
  };
  incidents: {
    total: number;
    open: number;
    resolved: number;
    bySeverity: {
      severity: string;
      count: number;
    }[];
    recent: any[];
  };
}

// Marketing Types
export interface CampaignPerformance {
  _id: string;
  subject: string;
  type: string;
  status: string;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  conversions: number;
  revenue: number;
  roi: number;
}

export interface MarketingData {
  overview: {
    totalCommunications: number;
    totalOpens: number;
    totalClicks: number;
    averageOpenRate: number;
    averageClickRate: number;
    totalConversions: number;
    totalRevenue: number;
    averageROI: number;
  };
  campaigns: CampaignPerformance[];
  channels: {
    channel: string;
    sent: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  }[];
  templates: {
    _id: string;
    name: string;
    usageCount: number;
    performance: {
      avgOpenRate: number;
      avgClickRate: number;
    };
  }[];
}

// Alerts Types
export interface AlertsData {
  alerts: Alert[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  lastUpdated: string;
}

// System Health Types
export interface SystemComponent {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  lastCheck: string;
  responseTime?: number;
  errorRate?: number;
  details?: any;
}

export interface SystemHealthData {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    lastUpdated: string;
  };
  components: SystemComponent[];
  metrics: {
    totalBookings: number;
    totalRooms: number;
    totalUsers: number;
    totalReviews: number;
    totalCommunications: number;
    systemUptime: number;
    averageResponseTime: number;
  };
}

// Reports Types
export interface ReportData {
  reportType: string;
  generatedAt: string;
  parameters: {
    hotelId: string;
    startDate: string;
    endDate: string;
    groupBy: string;
    filters: any;
  };
  summary: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
    keyMetrics: {
      [key: string]: number | string;
    };
  };
  data: any;
  charts: {
    type: string;
    title: string;
    data: any[];
    config: any;
  }[];
}

// Common filter types
export interface DateRange {
  start: string;
  end: string;
}

export interface DashboardFilters {
  hotelId?: string;
  dateRange?: DateRange;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  refreshInterval?: number;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: number;
}

export interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

// Export types
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  filename: string;
  data: any;
  columns?: string[];
  title?: string;
}