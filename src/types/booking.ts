export interface Room {
  _id: string;
  hotelId: string;
  roomNumber: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  baseRate: number;
  currentRate: number;
  status: 'vacant' | 'occupied' | 'dirty' | 'maintenance' | 'out_of_order';
  floor?: number;
  capacity: number;
  amenities: string[];
  images: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  hotelId: string;
  userId: string;
  bookingNumber: string;
  rooms: {
    roomId: Room;
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
  createdAt: string;
  updatedAt: string;
}

export interface BookingFilters {
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  adults?: number;
  children?: number;
}

export interface CreateBookingRequest {
  hotelId?: string;
  roomIds?: string[];
  roomId?: string; // Single room ID (will be converted to roomIds array)
  checkIn: string;
  checkOut: string;
  guestDetails: {
    adults: number;
    children: number;
    specialRequests?: string;
  };
  roomType?: 'single' | 'double' | 'suite' | 'deluxe'; // Room type preference for room-type bookings
  totalAmount: number;
  currency?: string;
  idempotencyKey?: string;
}