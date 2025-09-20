import React, { useState, useEffect } from 'react';
import {
  Package,
  CoffeeIcon,
  Wifi,
  Tv,
  Bath,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bell,
  Star,
  Receipt
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../LoadingSpinner';
import { roomInventoryService } from '../../services/roomInventoryService';
import { formatCurrency } from '../../utils/formatters';

interface RoomServiceWidgetProps {
  bookingId?: string;
  roomId?: string;
  guestId?: string;
  onRequestService?: (serviceType: string, items: any[]) => void;
}

interface RoomServiceSummary {
  availableServices: Array<{
    category: string;
    icon: React.ReactNode;
    name: string;
    description: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      isComplimentary: boolean;
      maxComplimentary: number;
      inStock: boolean;
      description?: string;
    }>;
  }>;
  currentCharges: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isCharged: boolean;
    date: string;
  }>;
  inventoryCharges: Array<{
    itemName: string;
    reason: string;
    cost: number;
    date: string;
  }>;
  totalCharges: number;
  roomCondition: {
    score: number;
    status: string;
    lastInspection: string;
  };
  complimentaryUsage: Array<{
    itemName: string;
    used: number;
    allowed: number;
    remaining: number;
  }>;
}

const serviceCategoryIcons = {
  'minibar': <CoffeeIcon className="w-5 h-5" />,
  'toiletries': <Bath className="w-5 h-5" />,
  'bedding': <Package className="w-5 h-5" />,
  'electronics': <Tv className="w-5 h-5" />,
  'amenities': <Star className="w-5 h-5" />,
  'cleaning': <Package className="w-5 h-5" />
};

export function RoomServiceWidget({
  bookingId,
  roomId,
  guestId,
  onRequestService
}: RoomServiceWidgetProps) {
  const [summary, setSummary] = useState<RoomServiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<Array<{ id: string; quantity: number }>>([]);

  useEffect(() => {
    if (roomId || bookingId) {
      fetchRoomServices();
    }
  }, [roomId, bookingId]);

  const fetchRoomServices = async () => {
    try {
      setLoading(true);
      
      // Fetch real inventory charges if guest ID is available
      let inventoryCharges = [];
      let roomInventoryData = null;
      
      if (guestId) {
        try {
          // Fetch inventory charges for the guest
          const response = await fetch(`/api/v1/daily-inventory-check/guest-charges/${guestId}${bookingId ? `?bookingId=${bookingId}` : ''}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            inventoryCharges = data.data.charges.flatMap((charge: any) => 
              charge.items.map((item: any) => ({
                itemName: item.name,
                reason: item.reason || 'damage',
                cost: item.cost,
                date: charge.date
              }))
            );
          }
        } catch (error) {
          console.error('Failed to fetch inventory charges:', error);
        }
      }

      if (roomId) {
        try {
          // Fetch room inventory data
          const inventoryResponse = await roomInventoryService.getRoomInventory(roomId);
          roomInventoryData = inventoryResponse.data.roomInventory;
        } catch (error) {
          console.error('Failed to fetch room inventory:', error);
        }
      }

      // Generate available services based on room inventory or use mock data
      const mockSummary: RoomServiceSummary = {
        availableServices: [
          {
            category: 'minibar',
            icon: serviceCategoryIcons.minibar,
            name: 'Minibar & Refreshments',
            description: 'Beverages, snacks, and refreshments',
            items: [
              { id: '1', name: 'Bottled Water', price: 0, isComplimentary: true, maxComplimentary: 2, inStock: true },
              { id: '2', name: 'Coffee/Tea Set', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '3', name: 'Premium Wine', price: 25.00, isComplimentary: false, maxComplimentary: 0, inStock: true },
              { id: '4', name: 'Champagne', price: 45.00, isComplimentary: false, maxComplimentary: 0, inStock: true },
              { id: '5', name: 'Gourmet Snacks', price: 15.00, isComplimentary: false, maxComplimentary: 0, inStock: true }
            ]
          },
          {
            category: 'toiletries',
            icon: serviceCategoryIcons.toiletries,
            name: 'Bathroom Amenities',
            description: 'Premium toiletries and bathroom essentials',
            items: [
              { id: '6', name: 'Luxury Towel Set', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '7', name: 'Premium Shampoo', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '8', name: 'Bathrobe', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '9', name: 'Extra Toiletries', price: 12.00, isComplimentary: false, maxComplimentary: 0, inStock: true }
            ]
          },
          {
            category: 'bedding',
            icon: serviceCategoryIcons.bedding,
            name: 'Bedding & Comfort',
            description: 'Additional bedding and comfort items',
            items: [
              { id: '10', name: 'Extra Pillows', price: 0, isComplimentary: true, maxComplimentary: 2, inStock: true },
              { id: '11', name: 'Extra Blankets', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '12', name: 'Premium Bed Sheets', price: 20.00, isComplimentary: false, maxComplimentary: 0, inStock: true }
            ]
          },
          {
            category: 'electronics',
            icon: serviceCategoryIcons.electronics,
            name: 'Electronics & Entertainment',
            description: 'Device charging and entertainment options',
            items: [
              { id: '13', name: 'Phone Charger', price: 0, isComplimentary: true, maxComplimentary: 1, inStock: true },
              { id: '14', name: 'Bluetooth Speaker', price: 15.00, isComplimentary: false, maxComplimentary: 0, inStock: true },
              { id: '15', name: 'HDMI Cable', price: 8.00, isComplimentary: false, maxComplimentary: 0, inStock: true }
            ]
          }
        ],
        currentCharges: [],
        inventoryCharges: inventoryCharges,
        totalCharges: inventoryCharges.reduce((sum, charge) => sum + charge.cost, 0),
        roomCondition: {
          score: roomInventoryData?.conditionScore || 92,
          status: roomInventoryData?.status || 'clean',
          lastInspection: roomInventoryData?.lastInspectionDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        complimentaryUsage: roomInventoryData?.items?.filter((item: any) => item.itemId.isComplimentary)
          .map((item: any) => ({
            itemName: item.itemId.name,
            used: item.itemId.maxComplimentary - (item.currentQuantity || 0),
            allowed: item.itemId.maxComplimentary,
            remaining: item.currentQuantity || 0
          })) || [
          { itemName: 'Bottled Water', used: 1, allowed: 2, remaining: 1 },
          { itemName: 'Coffee/Tea Set', used: 1, allowed: 1, remaining: 0 },
          { itemName: 'Extra Pillows', used: 0, allowed: 2, remaining: 2 }
        ]
      };

      setSummary(mockSummary);
    } catch (error) {
      console.error('Failed to fetch room services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { id: itemId, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prev.filter(item => item.id !== itemId);
      }
    });
  };

  const getCartTotal = () => {
    if (!summary) return 0;
    
    return cart.reduce((total, cartItem) => {
      const item = summary.availableServices
        .flatMap(service => service.items)
        .find(item => item.id === cartItem.id);
      return total + (item ? item.price * cartItem.quantity : 0);
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const requestService = () => {
    if (cart.length === 0 || !summary) return;
    
    const requestItems = cart.map(cartItem => {
      const item = summary.availableServices
        .flatMap(service => service.items)
        .find(item => item.id === cartItem.id);
      return {
        itemId: cartItem.id,
        itemName: item?.name || '',
        quantity: cartItem.quantity,
        unitPrice: item?.price || 0,
        totalPrice: (item?.price || 0) * cartItem.quantity,
        isComplimentary: item?.isComplimentary || false
      };
    });

    onRequestService?.('room_service', requestItems);
    setCart([]);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Package className="mx-auto h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Room Services Unavailable</h3>
          <p className="text-gray-600">Services will be available once you're checked in.</p>
        </div>
      </Card>
    );
  }

  const filteredServices = selectedCategory === 'all' 
    ? summary.availableServices 
    : summary.availableServices.filter(service => service.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Room Condition Status */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <h3 className="font-semibold text-green-900">Room Status: Excellent</h3>
              <p className="text-sm text-green-700">
                Room condition score: {summary.roomCondition.score}/100
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {summary.roomCondition.status}
          </Badge>
        </div>
      </Card>

      {/* Current Charges Summary */}
      {summary.totalCharges > 0 && (
        <div className="space-y-4">
          {/* Room Service Charges */}
          {summary.currentCharges && summary.currentCharges.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <IndianRupee className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Room Service Charges</h3>
                    <p className="text-sm text-blue-700">
                      {formatCurrency(summary.currentCharges.reduce((sum, charge) => sum + charge.totalPrice, 0))}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = '/app/billing'}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  View Details
                </Button>
              </div>
            </Card>
          )}

          {/* Inventory Charges */}
          {summary.inventoryCharges && summary.inventoryCharges.length > 0 && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Inventory Charges</h3>
                    <p className="text-sm text-orange-700">
                      Charges from damaged/missing items: {formatCurrency(summary.inventoryCharges.reduce((sum, charge) => sum + charge.cost, 0))}
                    </p>
                    <div className="mt-2 space-y-1">
                      {summary.inventoryCharges.map((charge, index) => (
                        <div key={index} className="text-xs text-orange-600">
                          • {charge.itemName} - {charge.reason.replace('_', ' ')} ({formatCurrency(charge.cost)})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => window.location.href = '/app/billing'}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  View Details
                </Button>
              </div>
            </Card>
          )}

          {/* Total Summary */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Receipt className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <h3 className="font-semibold text-gray-900">Total Additional Charges</h3>
                  <p className="text-sm text-gray-700">
                    Total amount to be added to your bill
                  </p>
                </div>
              </div>
              <div className="text-right">
                                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCharges)}</p>
                  <p className="text-xs text-gray-500">INR</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Service Categories */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Room Services</h2>
            <p className="text-gray-600">Request additional amenities and services</p>
          </div>
          {getCartItemCount() > 0 && (
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getCartItemCount()} items • {formatCurrency(getCartTotal())}
              </Badge>
              <Button
                onClick={requestService}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                Request Service
              </Button>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Services
          </button>
          {summary.availableServices.map(service => (
            <button
              key={service.category}
              onClick={() => setSelectedCategory(service.category)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                selectedCategory === service.category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {service.icon}
              <span className="ml-2 capitalize">{service.name}</span>
            </button>
          ))}
        </div>

        {/* Service Items */}
        <div className="space-y-6">
          {filteredServices.map(service => (
            <div key={service.category} className="space-y-4">
              <div className="flex items-center space-x-2">
                {service.icon}
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {service.items.map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  const cartQuantity = cartItem?.quantity || 0;
                  
                  return (
                    <Card key={item.id} className="p-4 border-2 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {item.isComplimentary ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Complimentary
                            </Badge>
                          ) : (
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.isComplimentary && item.maxComplimentary > 0 && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-700">
                            Up to {item.maxComplimentary} complimentary per stay
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {cartQuantity > 0 ? (
                            <>
                              <Button
                                onClick={() => removeFromCart(item.id)}
                                size="sm"
                                variant="secondary"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">{cartQuantity}</span>
                              <Button
                                onClick={() => addToCart(item.id)}
                                size="sm"
                                variant="secondary"
                              >
                                +
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => addToCart(item.id)}
                              size="sm"
                              disabled={!item.inStock}
                            >
                              {item.inStock ? 'Add' : 'Out of Stock'}
                            </Button>
                          )}
                        </div>
                        
                        {!item.inStock && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Complimentary Usage Tracker */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complimentary Items Usage</h3>
        <div className="space-y-3">
          {summary.complimentaryUsage.map((usage, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{usage.itemName}</p>
                <p className="text-sm text-gray-600">
                  Used {usage.used} of {usage.allowed} complimentary items
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {usage.remaining} remaining
                </p>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(usage.remaining / usage.allowed) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Service Request History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          <Button
            onClick={() => window.location.href = '/guest/requests'}
            size="sm"
            variant="secondary"
          >
            View All
          </Button>
        </div>

        {summary.currentCharges.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p className="text-gray-500">No recent service requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.currentCharges.map((charge, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{charge.itemName}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {charge.quantity} • {new Date(charge.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(charge.totalPrice)}
                  </p>
                  <Badge variant="secondary" className={
                    charge.isCharged ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }>
                    {charge.isCharged ? 'Charged' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contact Housekeeping */}
      <Card className="p-6 bg-gray-50">
        <div className="text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Assistance?</h3>
          <p className="text-gray-600 mb-4">
            Contact our housekeeping team for any special requests or assistance
          </p>
          <Button
            onClick={() => window.location.href = '/contact'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Contact Housekeeping
          </Button>
        </div>
      </Card>
    </div>
  );
}