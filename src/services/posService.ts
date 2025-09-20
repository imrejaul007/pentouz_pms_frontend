import { api } from './api';

export interface POSStats {
  todaysSales: number;
  todaysOrders: number;
  activeOrders: number;
  averageOrderValue: number;
}

export interface POSOutlet {
  _id: string;
  outletId: string;
  name: string;
  type: string;
  location: string;
  isActive: boolean;
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  taxSettings: {
    defaultTaxRate: number;
    serviceTaxRate: number;
    gstRate: number;
  };
  paymentMethods: string[];
  settings: {
    allowRoomCharges: boolean;
    requireSignature: boolean;
    printReceipts: boolean;
    allowDiscounts: boolean;
    maxDiscountPercent: number;
  };
}

export interface POSOrder {
  _id: string;
  orderId: string;
  orderNumber: string;
  outlet: {
    _id: string;
    name: string;
    type: string;
  };
  type: string;
  status: string;
  customer: {
    guest?: {
      _id: string;
      name: string;
      email: string;
    };
    roomNumber?: string;
    walkIn?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    modifiers?: Array<{
      name: string;
      option: string;
      price: number;
    }>;
    specialInstructions?: string;
    status: string;
  }>;
  subtotal: number;
  discounts?: Array<{
    type: string;
    description: string;
    amount: number;
    percentage: number;
  }>;
  taxes: {
    serviceTax: number;
    gst: number;
    otherTaxes: number;
    totalTax: number;
  };
  totalAmount: number;
  payment: {
    method: string;
    status: string;
    paidAmount?: number;
    changeGiven?: number;
    paymentDetails?: {
      transactionId?: string;
      cardLast4?: string;
      authCode?: string;
      roomChargeReference?: string;
    };
  };
  staff: {
    server?: {
      _id: string;
      name: string;
    };
    cashier?: {
      _id: string;
      name: string;
    };
  };
  tableNumber?: string;
  deliveryDetails?: {
    address: string;
    deliveryTime?: Date;
    deliveryFee?: number;
  };
  specialRequests?: string;
  orderTime: Date;
  preparedTime?: Date;
  servedTime?: Date;
  completedTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class POSService {
  private baseURL = '/pos';

  // Dashboard
  async getDashboardStats(): Promise<POSStats> {
    const response = await api.get(`${this.baseURL}/dashboard/stats`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch dashboard stats');
  }

  // Outlets
  async getOutlets(): Promise<POSOutlet[]> {
    const response = await api.get(`${this.baseURL}/outlets`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch outlets');
  }

  async createOutlet(outletData: Partial<POSOutlet>): Promise<POSOutlet> {
    const response = await api.post(`${this.baseURL}/outlets`, outletData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to create outlet');
  }

  async updateOutlet(id: string, outletData: Partial<POSOutlet>): Promise<POSOutlet> {
    const response = await api.put(`${this.baseURL}/outlets/${id}`, outletData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to update outlet');
  }

  // Orders
  async getOrders(params?: {
    outlet?: string;
    status?: string;
    date?: string;
    limit?: number;
  }): Promise<POSOrder[]> {
    const searchParams = new URLSearchParams();
    if (params?.outlet) searchParams.append('outlet', params.outlet);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.date) searchParams.append('date', params.date);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await api.get(`${this.baseURL}/orders?${searchParams}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch orders');
  }

  async createOrder(orderData: Partial<POSOrder>): Promise<POSOrder> {
    const response = await api.post(`${this.baseURL}/orders`, orderData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to create order');
  }

  async updateOrderStatus(id: string, status: string): Promise<POSOrder> {
    const response = await api.put(`${this.baseURL}/orders/${id}/status`, { status });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to update order status');
  }

  async processPayment(id: string, paymentData: {
    paymentMethod: string;
    amount: number;
    paymentDetails?: any;
  }): Promise<POSOrder> {
    const response = await api.put(`${this.baseURL}/orders/${id}/payment`, paymentData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to process payment');
  }

  // Menus
  async getMenusByOutlet(outletId: string): Promise<any[]> {
    const response = await api.get(`${this.baseURL}/menus/outlet/${outletId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch menus');
  }

  async createMenu(menuData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/menus`, menuData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to create menu');
  }

  async addMenuItem(menuId: string, itemData: any): Promise<any> {
    const response = await api.post(`${this.baseURL}/menus/${menuId}/items`, itemData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to add menu item');
  }

  // Reports
  async getSalesReport(params?: {
    outlet?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.outlet) searchParams.append('outlet', params.outlet);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const response = await api.get(`${this.baseURL}/reports/sales?${searchParams}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Failed to fetch sales report');
  }
}

export const posService = new POSService();
export default POSService;