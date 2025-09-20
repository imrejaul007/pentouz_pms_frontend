export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'guest' | 'staff' | 'admin';
  hotelId?: string;
  preferences?: {
    bedType?: string;
    floor?: string;
    smokingAllowed?: boolean;
    other?: string;
  };
  loyalty?: {
    points: number;
    tier: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  user: User;
}