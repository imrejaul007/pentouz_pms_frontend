import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Users, Calendar, MapPin, Clock, UserPlus, CheckCircle, XCircle, Plus, Eye } from 'lucide-react';
import { meetUpRequestService } from '../../services/meetUpRequestService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

export default function MeetUpRequestsDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMeetUp, setSelectedMeetUp] = useState<{ targetUserId?: string } | null>(null);

  // Queries
  const { data: meetUpsData, isLoading: meetUpsLoading } = useQuery({
    queryKey: ['meetUpRequests', activeTab, searchTerm],
    queryFn: () => {
      const params = { page: 1, limit: 20 };
      
      switch (activeTab) {
        case 'pending':
          return meetUpRequestService.getPendingRequests(params);
        case 'upcoming':
          return meetUpRequestService.getUpcomingMeetUps(params);
        default:
          return meetUpRequestService.getMeetUpRequests({ ...params, filter: searchTerm });
      }
    }
  });

  const { data: partnersData, isLoading: partnersLoading } = useQuery({
    queryKey: ['meetUpPartners'],
    queryFn: () => meetUpRequestService.searchPartners(),
    enabled: activeTab === 'partners'
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['meetUpStats'],
    queryFn: () => meetUpRequestService.getStats()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: meetUpRequestService.createMeetUpRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetUpRequests'] });
      setIsCreateModalOpen(false);
      toast.success('Meet-up request created successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to create meet-up request';
      console.error('Meet-up creation error:', error);
      toast.error(errorMessage);
    }
  });

  const acceptMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => meetUpRequestService.acceptMeetUpRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetUpRequests'] });
      toast.success('Meet-up request accepted!');
    }
  });

  const declineMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) => meetUpRequestService.declineMeetUpRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetUpRequests'] });
      toast.success('Meet-up request declined');
    }
  });

  const handleCreateMeetUp = (formData) => {
    createMutation.mutate(formData);
  };

  const handleAcceptRequest = (requestId) => {
    acceptMutation.mutate({ requestId, data: { message: '' } });
  };

  const handleDeclineRequest = (requestId) => {
    declineMutation.mutate({ requestId, data: { message: '' } });
  };

  if (meetUpsLoading && activeTab !== 'partners') {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meet-Up Requests</h1>
          <p className="text-gray-600 mt-2">Connect with other guests and organize meet-ups</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Meet-Up
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'partners', label: 'Find Partners' },
            { id: 'stats', label: 'Statistics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search meet-ups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meetUpsData?.meetUps?.map((meetUp) => (
              <MeetUpCard
                key={meetUp._id}
                meetUp={meetUp}
                currentUserId={user?._id}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
              />
            ))}
          </div>

          {meetUpsData?.meetUps?.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meet-ups found</h3>
              <p className="text-gray-600">Create your first meet-up request to get started!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetUpsData?.meetUps?.map((meetUp) => (
            <MeetUpCard
              key={meetUp._id}
              meetUp={meetUp}
              currentUserId={user?._id}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          ))}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetUpsData?.meetUps?.map((meetUp) => (
            <MeetUpCard
              key={meetUp._id}
              meetUp={meetUp}
              currentUserId={user?._id}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          ))}
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="space-y-6">
          {partnersLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {partnersData?.users?.map((partner) => (
                <PartnerCard
                  key={partner._id}
                  partner={partner}
                  onInvite={(partnerId) => {
                    setSelectedMeetUp({ targetUserId: partnerId });
                    setIsCreateModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                             <StatCard
                 title="Total Meet-ups"
                 value={statsData?.totalRequests || 0}
                 icon={Calendar}
                 color="blue"
               />
               <StatCard
                 title="Pending Requests"
                 value={statsData?.pendingRequests || 0}
                 icon={Clock}
                 color="yellow"
               />
               <StatCard
                 title="Upcoming Meet-ups"
                 value={statsData?.upcomingMeetUps || 0}
                 icon={Users}
                 color="green"
               />
               <StatCard
                 title="Completed Meet-ups"
                 value={statsData?.completedRequests || 0}
                 icon={CheckCircle}
                 color="purple"
               />
            </div>
          )}
        </div>
      )}

      {/* Create Meet-Up Modal */}
      {isCreateModalOpen && (
        <CreateMeetUpModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateMeetUp}
          targetUserId={selectedMeetUp?.targetUserId}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// MeetUpCard Component
function MeetUpCard({ meetUp, currentUserId, onAccept, onDecline }) {
  const typeInfo = meetUpRequestService.getMeetUpTypeInfo(meetUp.type);
  const statusInfo = meetUpRequestService.getStatusInfo(meetUp.status);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{meetUp.title}</h3>
              <p className="text-sm text-gray-600">{meetUp.description}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-sm font-medium">
                {meetUpRequestService.formatDateTime(meetUp.proposedDate, meetUp.proposedTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="text-sm font-medium">{meetUp.location.name}</p>
            </div>
          </div>

          {meetUp.status === 'pending' && meetUp.targetUserId._id === currentUserId && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAccept(meetUp._id)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDecline(meetUp._id)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// PartnerCard Component
function PartnerCard({ partner, onInvite }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
            <p className="text-sm text-gray-600">{partner.email}</p>
          </div>
        </div>
                 <Button
           variant="secondary"
           size="sm"
           onClick={() => onInvite(partner._id)}
           className="flex items-center gap-2"
         >
           <UserPlus className="w-4 h-4" />
           Invite
         </Button>
      </div>
    </Card>
  );
}

// StatCard Component
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

// CreateMeetUpModal Component
function CreateMeetUpModal({ onClose, onSubmit, targetUserId, isLoading }) {
  const [formData, setFormData] = useState({
    targetUserId: targetUserId || '',
    hotelId: '',
    type: 'casual',
    title: '',
    description: '',
    proposedDate: new Date().toISOString().split('T')[0], // Set to today's date
    proposedTime: {
      start: '',
      end: ''
    },
    location: {
      type: 'hotel_lobby',
      name: '',
      details: ''
    }
  });
  const [fetchingHotel, setFetchingHotel] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch hotel and users when modal opens
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hotel data
        const hotelResponse = await api.get('/contact/hotels');
        const hotels = hotelResponse.data.data?.hotels || hotelResponse.data.hotels || [];
        
        if (hotels && hotels.length > 0) {
          const hotel = hotels[0];
          const hotelId = hotel.id || hotel._id;
          setFormData(prev => ({ ...prev, hotelId }));
          console.log('Hotel ID set to:', hotelId);
        } else {
          console.error('No hotels found in response');
        }
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
        toast.error('Failed to fetch hotel information');
      } finally {
        setFetchingHotel(false);
      }

      try {
        // Fetch users for dropdown
        const usersResponse = await api.get('/meet-up-requests/search/partners');
        const usersList = usersResponse.data.data?.users || [];
        setUsers(usersList);
        console.log('Users loaded:', usersList.length);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data on submit:', formData); // Debug log
    
    if (!formData.targetUserId) {
      toast.error('Please select a user to meet up with');
      return;
    }
    
    if (!formData.hotelId) {
      console.error('Hotel ID missing:', formData.hotelId); // Debug log
      toast.error('Hotel information is required');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Meet-Up Request</h2>
        
        {(fetchingHotel || loadingUsers) ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">
              {fetchingHotel ? 'Loading hotel information...' : 'Loading users...'}
            </span>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select User
              </label>
              <select
                value={formData.targetUserId}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUserId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user._id || user.id} value={user._id || user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="casual">Casual</option>
                <option value="business">Business</option>
                <option value="social">Social</option>
                <option value="networking">Networking</option>
                <option value="activity">Activity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter meet-up title"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter meet-up description"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={formData.proposedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, proposedDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <Input
                type="time"
                value={formData.proposedTime.start}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  proposedTime: { ...prev.proposedTime, start: e.target.value }
                }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <Input
                type="time"
                value={formData.proposedTime.end}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  proposedTime: { ...prev.proposedTime, end: e.target.value }
                }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Type
              </label>
              <select
                value={formData.location.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, type: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="hotel_lobby">Hotel Lobby</option>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
                <option value="meeting_room">Meeting Room</option>
                <option value="outdoor">Outdoor</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <Input
                value={formData.location.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, name: e.target.value }
                }))}
                placeholder="Enter location name"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
                         <Button
               type="button"
               variant="secondary"
               onClick={onClose}
               disabled={isLoading}
             >
               Cancel
             </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Meet-Up'}
            </Button>
          </div>
        </form>
        )}
      </Card>
    </div>
  );
}
