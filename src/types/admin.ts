export interface HousekeepingTask {
  _id: string;
  hotelId: string;
  roomId: {
    _id: string;
    roomNumber: string;
    type: string;
    floor: number;
  };
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'deep_clean' | 'checkout_clean';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedToUserId?: {
    _id: string;
    name: string;
  };
  estimatedDuration: number;
  startedAt?: string;
  completedAt?: string;
  actualDuration?: number;
  notes?: string;
  supplies: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  hotelId: string;
  name: string;
  sku: string;
  category: 'linens' | 'toiletries' | 'cleaning' | 'maintenance' | 'food_beverage' | 'other';
  quantity: number;
  unit: 'pieces' | 'bottles' | 'rolls' | 'kg' | 'liters' | 'sets';
  minimumThreshold: number;
  maximumCapacity: number;
  costPerUnit?: number;
  supplier?: {
    name: string;
    contact: string;
    email: string;
  };
  location?: {
    building?: string;
    floor?: string;
    room?: string;
    shelf?: string;
  };
  // Automated Reorder System
  reorderSettings?: {
    autoReorderEnabled: boolean;
    reorderPoint?: number;
    reorderQuantity?: number;
    preferredSupplier?: {
      name?: string;
      contact?: string;
      email?: string;
      leadTime?: number;
    };
    lastReorderDate?: string;
    reorderHistory?: {
      date: string;
      quantity: number;
      supplier: string;
      estimatedCost?: number;
      actualCost?: number;
      status: 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled' | 'rejected';
      approvedBy?: string;
      orderDate?: string;
      expectedDeliveryDate?: string;
      actualDeliveryDate?: string;
      notes?: string;
      alertId?: string;
    }[];
  };
  // Virtual fields
  needsReorder?: boolean;
  reorderUrgency?: number;
  estimatedReorderCost?: number;
  isUrgentReorder?: boolean;
  requests: {
    _id: string;
    userId: string;
    quantity: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
    requestedAt: string;
  }[];
  lastRestocked?: string;
  expiryDate?: string;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderAlert {
  _id: string;
  hotelId: string;
  inventoryItemId: {
    _id: string;
    name: string;
    category: string;
    currentStock: number;
  };
  alertType: 'low_stock' | 'critical_stock' | 'reorder_needed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost?: number;
  supplierInfo?: {
    name?: string;
    contact?: string;
    email?: string;
    leadTime?: number;
  };
  urgencyScore: number;
  expectedDeliveryDate?: string;
  acknowledgedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  acknowledgedAt?: string;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolvedAt?: string;
  dismissedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  dismissedAt?: string;
  notes?: string;
  emailsSent?: {
    recipient: string;
    sentAt: string;
    type: 'alert' | 'reminder' | 'escalation';
  }[];
  lastEmailSent?: string;
  reorderRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueData {
  date: string;
  totalRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
}

export interface OccupancyData {
  occupancyRate: number;
  totalRoomNights: number;
  totalPossibleRoomNights: number;
  totalRooms: number;
  periodDays: number;
}

export interface AdminBooking {
  _id: string;
  hotelId: {
    _id: string;
    name: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
    } | string;
  };
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  bookingNumber: string;
  rooms: {
    roomId: {
      _id: string;
      roomNumber: string;
      type: string;
    };
    rate: number;
  }[];
  checkIn: string;
  checkOut: string;
  nights: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  totalAmount: number;
  currency: string;
  stripePaymentId?: string;
  guestDetails: {
    adults: number;
    children: number;
    specialRequests?: string;
  };
  extras?: {
    name: string;
    price: number;
    quantity: number;
  }[];
  source: 'direct' | 'booking_com' | 'expedia' | 'airbnb';
  roomType?: 'single' | 'double' | 'suite' | 'deluxe'; // Room type preference for room-type bookings
  cancellationReason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  checkIn?: string;
  checkOut?: string;
  source?: string;
  hotelId?: string;
  page?: number;
  limit?: number;
}

export interface BookingStats {
  total: number;
  totalRevenue: number;
  averageBookingValue: number;
  pending: number;
  confirmed: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
}