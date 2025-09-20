import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Bell,
  Shield,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { meetUpRequestService, MeetUpRequest } from '../../services/meetUpRequestService';
import { staffMeetUpSupervisionService, SupervisionMeetUp } from '../../services/staffMeetUpSupervisionService';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface StaffMeetUpSupervisionProps {}

export default function StaffMeetUpSupervision({}: StaffMeetUpSupervisionProps) {
  const [activeTab, setActiveTab] = useState('requiring-supervision');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMeetUp, setSelectedMeetUp] = useState<MeetUpRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch meet-ups requiring supervision
  const { data: meetUpsData, isLoading, error } = useQuery({
    queryKey: ['staff-supervision-meetups', currentPage, searchTerm, statusFilter, safetyFilter],
    queryFn: () => meetUpRequestService.getAdminAllMeetUps({
      page: currentPage,
      limit: 20,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get supervision statistics
  const { data: supervisionStats } = useQuery({
    queryKey: ['staff-supervision-stats'],
    queryFn: () => meetUpRequestService.getAdminInsights(),
    refetchInterval: 60000, // Refresh every minute
  });

  const handleViewDetails = (meetUp: MeetUpRequest) => {
    setSelectedMeetUp(meetUp);
    setShowDetailsModal(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSafetyFilter('');
    setCurrentPage(1);
  };

  const getSafetyLevel = (meetUp: MeetUpRequest) => {
    if (!meetUp.safety) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Standard' };

    let score = 0;
    if (meetUp.safety.publicLocation) score += 2;
    if (meetUp.safety.hotelStaffPresent) score += 2;
    if (meetUp.safety.verifiedOnly) score += 1;

    if (score >= 4) {
      return { level: 'high', color: 'bg-green-100 text-green-800', label: 'High Safety' };
    } else if (score >= 2) {
      return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Standard' };
    } else {
      return { level: 'low', color: 'bg-red-100 text-red-800', label: 'Requires Attention' };
    }
  };

  const getSupervisionPriority = (meetUp: MeetUpRequest) => {
    const safety = getSafetyLevel(meetUp);
    const isNighttime = new Date(meetUp.proposedDate).getHours() > 20 || new Date(meetUp.proposedDate).getHours() < 6;
    const isOffSite = meetUp.location.type === 'outdoor' || meetUp.location.type === 'other';

    if (safety.level === 'low' || isNighttime || isOffSite) {
      return { priority: 'high', color: 'bg-red-100 text-red-800', label: 'High Priority' };
    } else if (safety.level === 'medium' || meetUp.participants.maxParticipants > 4) {
      return { priority: 'medium', color: 'bg-yellow-100 text-yellow-800', label: 'Medium Priority' };
    } else {
      return { priority: 'low', color: 'bg-green-100 text-green-800', label: 'Low Priority' };
    }
  };

  const filteredMeetUps = meetUpsData?.meetUps?.filter(meetUp => {
    if (safetyFilter === 'high-risk') {
      const priority = getSupervisionPriority(meetUp);
      return priority.priority === 'high';
    }
    if (safetyFilter === 'staff-required') {
      return meetUp.safety?.hotelStaffPresent === true;
    }
    return true;
  }) || [];

  const tabs = [
    { id: 'requiring-supervision', label: 'Supervision Required', count: filteredMeetUps.filter(m => getSupervisionPriority(m).priority !== 'low').length },
    { id: 'all-meetups', label: 'All Meet-ups', count: filteredMeetUps.length },
    { id: 'safety-alerts', label: 'Safety Alerts', count: filteredMeetUps.filter(m => getSafetyLevel(m).level === 'low').length },
    { id: 'statistics', label: 'Statistics' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading meet-up supervision data</h3>
              <p className="mt-2 text-sm text-red-700">Please try refreshing the page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meet-Up Supervision</h1>
          <p className="text-gray-600 mt-2">Monitor and supervise guest meet-up activities for safety and quality assurance</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['staff-supervision-meetups', 'staff-supervision-stats'] })}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {supervisionStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Meet-ups</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredMeetUps.filter(m => m.status === 'accepted' || m.status === 'pending').length}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">High Priority</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredMeetUps.filter(m => getSupervisionPriority(m).priority === 'high').length}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Staff Required</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredMeetUps.filter(m => m.safety?.hotelStaffPresent).length}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {filteredMeetUps.filter(m => m.status === 'completed' &&
                      new Date(m.updatedAt).toDateString() === new Date().toDateString()).length}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === 'requiring-supervision' || activeTab === 'all-meetups' || activeTab === 'safety-alerts') && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search meet-ups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Safety Filter */}
            <select
              value={safetyFilter}
              onChange={(e) => setSafetyFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Safety Levels</option>
              <option value="high-risk">High Risk</option>
              <option value="staff-required">Staff Required</option>
            </select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Meet-ups List */}
      {(activeTab === 'requiring-supervision' || activeTab === 'all-meetups' || activeTab === 'safety-alerts') && (
        <div className="space-y-4">
          {filteredMeetUps.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Meet-ups Found</h3>
              <p className="text-gray-500">There are no meet-ups matching your current filters.</p>
            </Card>
          ) : (
            filteredMeetUps
              .filter(meetUp => {
                if (activeTab === 'requiring-supervision') {
                  return getSupervisionPriority(meetUp).priority !== 'low';
                }
                if (activeTab === 'safety-alerts') {
                  return getSafetyLevel(meetUp).level === 'low';
                }
                return true;
              })
              .map((meetUp) => {
                const safetyLevel = getSafetyLevel(meetUp);
                const priority = getSupervisionPriority(meetUp);
                const typeInfo = meetUpRequestService.getMeetUpTypeInfo(meetUp.type);
                const statusInfo = meetUpRequestService.getStatusInfo(meetUp.status);

                return (
                  <Card key={meetUp._id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{meetUp.title}</h3>
                          <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{meetUp.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {meetUp.requesterId.name} → {meetUp.targetUserId.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{formatDate(meetUp.proposedDate)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {meetUp.proposedTime.start} - {meetUp.proposedTime.end}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{meetUp.location.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <Badge className={safetyLevel.color}>{safetyLevel.label}</Badge>
                          </div>

                          {meetUp.safety?.hotelStaffPresent && (
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-blue-600 font-medium">Staff Presence Required</span>
                            </div>
                          )}

                          {meetUp.participants.maxParticipants > 4 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-600 font-medium">Large Group ({meetUp.participants.maxParticipants})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(meetUp)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && supervisionStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Users Only:</span>
                  <span className="font-medium">
                    {supervisionStats.safetyInsights.verifiedOnly}/{supervisionStats.safetyInsights.totalRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Public Locations:</span>
                  <span className="font-medium">
                    {supervisionStats.safetyInsights.publicLocation}/{supervisionStats.safetyInsights.totalRequests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Staff Presence:</span>
                  <span className="font-medium">
                    {supervisionStats.safetyInsights.hotelStaffPresent}/{supervisionStats.safetyInsights.totalRequests}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-medium">{supervisionStats.userEngagement.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Users:</span>
                  <span className="font-medium">{supervisionStats.userEngagement.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement Rate:</span>
                  <span className="font-medium">{supervisionStats.userEngagement.engagementRate.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          </div>

          {supervisionStats.riskAssessment.riskyMeetUpDetails.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Potentially Risky Meet-ups:</span>
                  <span className="font-medium text-red-600">{supervisionStats.riskAssessment.potentiallyRiskyMeetUps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequent Requesters:</span>
                  <span className="font-medium">{supervisionStats.riskAssessment.frequentRequesters}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedMeetUp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Meet-up Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedMeetUp.title}</h3>
                <p className="text-gray-600">{selectedMeetUp.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Meet-up Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Type:</span> {meetUpRequestService.getMeetUpTypeInfo(selectedMeetUp.type).label}</div>
                    <div><span className="text-gray-500">Status:</span> {meetUpRequestService.getStatusInfo(selectedMeetUp.status).label}</div>
                    <div><span className="text-gray-500">Date:</span> {formatDate(selectedMeetUp.proposedDate)}</div>
                    <div><span className="text-gray-500">Time:</span> {selectedMeetUp.proposedTime.start} - {selectedMeetUp.proposedTime.end}</div>
                    <div><span className="text-gray-500">Location:</span> {selectedMeetUp.location.name}</div>
                    <div><span className="text-gray-500">Max Participants:</span> {selectedMeetUp.participants.maxParticipants}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Safety Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Safety Level:</span> <Badge className={getSafetyLevel(selectedMeetUp).color}>{getSafetyLevel(selectedMeetUp).label}</Badge></div>
                    <div><span className="text-gray-500">Supervision Priority:</span> <Badge className={getSupervisionPriority(selectedMeetUp).color}>{getSupervisionPriority(selectedMeetUp).label}</Badge></div>
                    <div><span className="text-gray-500">Verified Only:</span> {selectedMeetUp.safety?.verifiedOnly ? 'Yes' : 'No'}</div>
                    <div><span className="text-gray-500">Public Location:</span> {selectedMeetUp.safety?.publicLocation ? 'Yes' : 'No'}</div>
                    <div><span className="text-gray-500">Staff Present:</span> {selectedMeetUp.safety?.hotelStaffPresent ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Participants</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Requester:</span> {selectedMeetUp.requesterId.name} ({selectedMeetUp.requesterId.email})</div>
                  <div><span className="text-gray-500">Target User:</span> {selectedMeetUp.targetUserId.name} ({selectedMeetUp.targetUserId.email})</div>
                  <div><span className="text-gray-500">Hotel:</span> {selectedMeetUp.hotelId.name}</div>
                </div>
              </div>

              {selectedMeetUp.activity && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Activity Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Activity Type:</span> {meetUpRequestService.getActivityTypeInfo(selectedMeetUp.activity.type).label}</div>
                    <div><span className="text-gray-500">Duration:</span> {selectedMeetUp.activity.duration} minutes</div>
                    <div><span className="text-gray-500">Cost:</span> ${selectedMeetUp.activity.cost}</div>
                    <div><span className="text-gray-500">Cost Sharing:</span> {selectedMeetUp.activity.costSharing ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}

              {selectedMeetUp.response && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Status:</span> {selectedMeetUp.response.status}</div>
                    {selectedMeetUp.response.message && (
                      <div><span className="text-gray-500">Message:</span> {selectedMeetUp.response.message}</div>
                    )}
                    {selectedMeetUp.response.respondedAt && (
                      <div><span className="text-gray-500">Responded:</span> {new Date(selectedMeetUp.response.respondedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}