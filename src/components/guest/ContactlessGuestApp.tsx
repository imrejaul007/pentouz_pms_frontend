import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone,
  QrCode,
  Key,
  Wifi,
  Car,
  Utensils,
  Heart,
  ConciergeBell,
  MessageSquare,
  MapPin,
  Clock,
  Star,
  CreditCard,
  CheckCircle,
  Bell,
  Camera,
  Settings,
  User,
  Calendar,
  Receipt,
  Coffee,
  Dumbbell,
  Navigation,
  Phone,
  Mail,
  AlertCircle,
  Download,
  Share2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface GuestProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  loyaltyTier: string;
  preferences: {
    roomTemp: number;
    wakeUpCall: string;
    pillow: string;
    newspaper: string;
    housekeeping: string;
  };
  keylessEntry: boolean;
  notifications: boolean;
}

interface ServiceRequest {
  id: string;
  service: string;
  category: string;
  description: string;
  requestTime: string;
  status: 'pending' | 'in_progress' | 'completed';
  estimatedTime?: string;
  priority: 'low' | 'medium' | 'high';
}

interface DigitalKey {
  id: string;
  roomNumber: string;
  isActive: boolean;
  expiresAt: string;
  accessCount: number;
  lastUsed?: string;
}

interface HotelService {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
  available: boolean;
  hours: string;
  price?: number;
}

export const ContactlessGuestApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [digitalKey, setDigitalKey] = useState<DigitalKey | null>(null);
  const [hotelServices, setHotelServices] = useState<HotelService[]>([]);
  const [newRequest, setNewRequest] = useState({ service: '', description: '', category: '' });
  const [qrCodeScanned, setQrCodeScanned] = useState(false);

  const mockGuestProfile: GuestProfile = {
    id: 'G001',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    roomNumber: '1205',
    checkIn: '2024-12-01',
    checkOut: '2024-12-05',
    loyaltyTier: 'Gold',
    preferences: {
      roomTemp: 22,
      wakeUpCall: '07:00',
      pillow: 'Soft',
      newspaper: 'Wall Street Journal',
      housekeeping: '14:00'
    },
    keylessEntry: true,
    notifications: true
  };

  const mockServiceRequests: ServiceRequest[] = [
    {
      id: 'SR001',
      service: 'Room Service',
      category: 'F&B',
      description: 'Continental breakfast for 2',
      requestTime: '2024-12-01T08:30:00',
      status: 'completed',
      priority: 'medium'
    },
    {
      id: 'SR002',
      service: 'Housekeeping',
      category: 'Room',
      description: 'Extra towels and pillows',
      requestTime: '2024-12-01T14:15:00',
      status: 'in_progress',
      estimatedTime: '15 mins',
      priority: 'low'
    },
    {
      id: 'SR003',
      service: 'Concierge',
      category: 'Concierge',
      description: 'Restaurant reservation for tonight at 7 PM',
      requestTime: '2024-12-01T16:45:00',
      status: 'pending',
      priority: 'high'
    }
  ];

  const mockDigitalKey: DigitalKey = {
    id: 'DK001',
    roomNumber: '1205',
    isActive: true,
    expiresAt: '2024-12-05T12:00:00',
    accessCount: 12,
    lastUsed: '2024-12-01T20:30:00'
  };

  const mockHotelServices: HotelService[] = [
    {
      id: 'HS001',
      name: 'Room Service',
      category: 'F&B',
      description: '24/7 dining delivered to your room',
      icon: Utensils,
      available: true,
      hours: '24/7'
    },
    {
      id: 'HS002',
      name: 'Spa & Wellness',
      category: 'Spa',
      description: 'Rejuvenating treatments and therapies',
      icon: Heart,
      available: true,
      hours: '9:00 AM - 10:00 PM',
      price: 150
    },
    {
      id: 'HS003',
      name: 'Concierge',
      category: 'Concierge',
      description: 'Local recommendations and bookings',
      icon: ConciergeBell,
      available: true,
      hours: '24/7'
    },
    {
      id: 'HS004',
      name: 'Valet Parking',
      category: 'Parking',
      description: 'Premium parking service',
      icon: Car,
      available: true,
      hours: '24/7',
      price: 35
    },
    {
      id: 'HS005',
      name: 'Fitness Center',
      category: 'Fitness',
      description: 'State-of-the-art gym equipment',
      icon: Dumbbell,
      available: true,
      hours: '5:00 AM - 11:00 PM'
    },
    {
      id: 'HS006',
      name: 'Business Center',
      category: 'Business',
      description: 'Printing, copying, and meeting rooms',
      icon: Settings,
      available: true,
      hours: '24/7'
    }
  ];

  useEffect(() => {
    setGuestProfile(mockGuestProfile);
    setServiceRequests(mockServiceRequests);
    setDigitalKey(mockDigitalKey);
    setHotelServices(mockHotelServices);
  }, []);

  const requestService = () => {
    if (!newRequest.service || !newRequest.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const request: ServiceRequest = {
      id: `SR${String(serviceRequests.length + 1).padStart(3, '0')}`,
      service: newRequest.service,
      category: newRequest.category,
      description: newRequest.description,
      requestTime: new Date().toISOString(),
      status: 'pending',
      priority: 'medium'
    };

    setServiceRequests([...serviceRequests, request]);
    setNewRequest({ service: '', description: '', category: '' });
    
    toast({
      title: "Service Requested",
      description: "Your request has been submitted to our staff"
    });
  };

  const activateDigitalKey = () => {
    if (digitalKey) {
      setDigitalKey({ ...digitalKey, isActive: true, lastUsed: new Date().toISOString() });
      toast({
        title: "Digital Key Activated",
        description: "Your room key is now active"
      });
    }
  };

  const scanQRCode = () => {
    setQrCodeScanned(true);
    toast({
      title: "QR Code Scanned",
      description: "Accessing hotel menu/information"
    });
  };

  const updatePreferences = (key: string, value: any) => {
    if (guestProfile) {
      setGuestProfile({
        ...guestProfile,
        preferences: {
          ...guestProfile.preferences,
          [key]: value
        }
      });
      
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {guestProfile?.name}</h2>
              <p className="text-blue-100">Room {guestProfile?.roomNumber} • {guestProfile?.loyaltyTier} Member</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Check-out</div>
              <div className="text-lg font-semibold">{guestProfile?.checkOut}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('key')}
            >
              <Key className="h-6 w-6" />
              <span>Digital Key</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('services')}
            >
              <ConciergeBell className="h-6 w-6" />
              <span>Services</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={scanQRCode}
            >
              <QrCode className="h-6 w-6" />
              <span>Scan QR</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="h-6 w-6" />
              <span>Chat</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceRequests.slice(0, 3).map(request => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{request.service}</div>
                  <div className="text-sm text-muted-foreground">{request.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(request.status) as any}>
                    {request.status}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hotel Services */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {hotelServices.slice(0, 6).map(service => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="p-3 border rounded-lg text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.hours}</div>
                  {service.price && (
                    <div className="text-xs font-medium text-green-600">${service.price}</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDigitalKeyTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Digital Room Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          {digitalKey && (
            <div className="space-y-6">
              {/* Key Status */}
              <div className="text-center">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl ${
                  digitalKey.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  <Key className="h-16 w-16" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold">Room {digitalKey.roomNumber}</div>
                  <Badge variant={digitalKey.isActive ? 'default' : 'secondary'} className="mt-2">
                    {digitalKey.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Expires</div>
                    <div className="font-medium">{new Date(digitalKey.expiresAt).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Last Used</div>
                    <div className="font-medium">
                      {digitalKey.lastUsed 
                        ? new Date(digitalKey.lastUsed).toLocaleTimeString()
                        : 'Never'
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Actions */}
              <div className="space-y-3">
                <Button
                  onClick={activateDigitalKey}
                  disabled={digitalKey.isActive}
                  className="w-full"
                >
                  <Key className="mr-2 h-4 w-4" />
                  {digitalKey.isActive ? 'Key Active' : 'Activate Key'}
                </Button>
                <Button variant="outline" className="w-full">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Access
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Add to Wallet
                </Button>
              </div>

              {/* Access History */}
              <Card>
                <CardHeader>
                  <CardTitle>Access History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Access Count</span>
                      <span className="font-medium">{digitalKey.accessCount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Key usage is tracked for security purposes
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-6">
      {/* Service Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={newRequest.service}
            onValueChange={(value) => setNewRequest({...newRequest, service: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service..." />
            </SelectTrigger>
            <SelectContent>
              {hotelServices.map(service => (
                <SelectItem key={service.id} value={service.name}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Describe your request..."
            value={newRequest.description}
            onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
          />
          <Button onClick={requestService} className="w-full">
            <ConciergeBell className="mr-2 h-4 w-4" />
            Submit Request
          </Button>
        </CardContent>
      </Card>

      {/* Available Services */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {hotelServices.map(service => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="flex items-center p-4 border rounded-lg">
                  <Icon className="h-8 w-8 mr-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">{service.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {service.hours}
                      {service.price && ` • $${service.price}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={service.available ? 'default' : 'secondary'}>
                      {service.available ? 'Available' : 'Closed'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceRequests.map(request => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{request.service}</div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(request.status) as any}>
                      {request.status}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{request.description}</div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Requested: {new Date(request.requestTime).toLocaleString()}</span>
                  {request.estimatedTime && <span>ETA: {request.estimatedTime}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      {guestProfile && (
        <>
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={guestProfile.name} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input value={guestProfile.email} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={guestProfile.phone} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Loyalty Tier</label>
                  <Input value={guestProfile.loyaltyTier} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Room Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Room Temperature (°C)</label>
                  <Input
                    type="number"
                    value={guestProfile.preferences.roomTemp}
                    onChange={(e) => updatePreferences('roomTemp', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Wake-up Call</label>
                  <Input
                    type="time"
                    value={guestProfile.preferences.wakeUpCall}
                    onChange={(e) => updatePreferences('wakeUpCall', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pillow Type</label>
                  <Select
                    value={guestProfile.preferences.pillow}
                    onValueChange={(value) => updatePreferences('pillow', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Soft">Soft</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Firm">Firm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Newspaper</label>
                  <Select
                    value={guestProfile.preferences.newspaper}
                    onValueChange={(value) => updatePreferences('newspaper', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Wall Street Journal">Wall Street Journal</SelectItem>
                      <SelectItem value="USA Today">USA Today</SelectItem>
                      <SelectItem value="Local Paper">Local Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Housekeeping Time</label>
                  <Input
                    type="time"
                    value={guestProfile.preferences.housekeeping}
                    onChange={(e) => updatePreferences('housekeeping', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive updates about your requests and hotel services
                    </div>
                  </div>
                  <Button
                    variant={guestProfile.notifications ? 'default' : 'outline'}
                    onClick={() => setGuestProfile({
                      ...guestProfile,
                      notifications: !guestProfile.notifications
                    })}
                  >
                    {guestProfile.notifications ? 'On' : 'Off'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Keyless Entry</div>
                    <div className="text-sm text-muted-foreground">
                      Use your phone as a room key
                    </div>
                  </div>
                  <Button
                    variant={guestProfile.keylessEntry ? 'default' : 'outline'}
                    onClick={() => setGuestProfile({
                      ...guestProfile,
                      keylessEntry: !guestProfile.keylessEntry
                    })}
                  >
                    {guestProfile.keylessEntry ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Guest Services Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 border rounded-lg p-4 overflow-y-auto bg-muted/20">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                  H
                </div>
                <div className="flex-1">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm">Hello! How can I assist you today?</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Hotel Staff • 2:30 PM</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                  J
                </div>
                <div className="flex-1">
                  <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm">Hi! I'd like to request extra towels for my room.</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 text-right">You • 2:32 PM</div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                  H
                </div>
                <div className="flex-1">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm">Of course! I'll send housekeeping to room {guestProfile?.roomNumber} with extra towels within the next 15 minutes.</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Hotel Staff • 2:33 PM</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Input placeholder="Type your message..." className="flex-1" />
            <Button>
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Phone className="h-6 w-6" />
              <span>Call Front Desk</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <ConciergeBell className="h-6 w-6" />
              <span>Concierge</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <AlertCircle className="h-6 w-6" />
              <span>Emergency</span>
            </Button>
            <Button variant="outline" className="h-16 flex-col space-y-2">
              <Car className="h-6 w-6" />
              <span>Valet</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const tabs = [
    { id: 'home', name: 'Home', icon: Smartphone },
    { id: 'key', name: 'Digital Key', icon: Key },
    { id: 'services', name: 'Services', icon: ConciergeBell },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'chat', name: 'Chat', icon: MessageSquare }
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* App Content */}
      <div className="pb-20 px-4 pt-6">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'key' && renderDigitalKeyTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'chat' && renderChatTab()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t">
        <div className="flex justify-around py-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};