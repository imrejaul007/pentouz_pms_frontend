import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Plus,
  Eye,
  Edit,
  Play,
  CheckSquare,
  X,
  User,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Save,
  Wifi,
  WifiOff,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { DataTable } from '../../components/dashboard/DataTable';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import HousekeepingInventoryDashboard from '../../components/admin/HousekeepingInventoryDashboard';
import { adminService } from '../../services/adminService';
import { HousekeepingTask } from '../../types/admin';
import { formatNumber, getStatusColor } from '../../utils/dashboardUtils';
import { useRealTime } from '../../services/realTimeService';
import { toast } from 'react-hot-toast';

interface HousekeepingFilters {
  status?: string;
  taskType?: string;
  priority?: string;
  roomId?: string;
  assignedToUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
  createdDateFrom?: string;
  createdDateTo?: string;
  completedDateFrom?: string;
  completedDateTo?: string;
  estimatedDurationMin?: number;
  estimatedDurationMax?: number;
}

interface HousekeepingStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  avgDuration: number;
}

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminHousekeeping() {
  // State
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [stats, setStats] = useState<HousekeepingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Real-time connection
  const { connectionState, connect, disconnect, on, off, isConnected } = useRealTime();
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskType: 'cleaning' as 'cleaning' | 'maintenance' | 'inspection' | 'deep_clean' | 'checkout_clean',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    roomId: '',
    estimatedDuration: 30,
    notes: '',
    supplies: [{ name: '', quantity: 1, unit: 'pieces' }]
  });
  const [filters, setFilters] = useState<HousekeepingFilters>({
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await adminService.getHousekeepingTasks(filters);
      console.log('Full response from getHousekeepingTasks:', response);
      
      setTasks(response.data.tasks || []);
      
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching housekeeping tasks:', error);
      console.error('Error details:', error.response?.data);
      
      // Show error to user
      const errorMessage = error.response?.data?.message || 'Failed to fetch housekeeping tasks';
      console.error('Housekeeping API error:', errorMessage);
      
      // Set empty tasks array on error
        setTasks([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await adminService.getHousekeepingStats();
      const statsData = response.data.stats;
      
      // Transform stats to match our interface
      const transformedStats: HousekeepingStats = {
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgDuration: 0
      };

      if (Array.isArray(statsData)) {
        statsData.forEach((stat: any) => {
          transformedStats.total += stat.count;
          switch (stat._id) {
            case 'pending':
              transformedStats.pending = stat.count;
              break;
            case 'assigned':
              transformedStats.assigned = stat.count;
              break;
            case 'in_progress':
              transformedStats.inProgress = stat.count;
              break;
            case 'completed':
              transformedStats.completed = stat.count;
              break;
            case 'cancelled':
              transformedStats.cancelled = stat.count;
              break;
          }
          if (stat.avgDuration) {
            transformedStats.avgDuration = stat.avgDuration;
          }
        });
      }

      setStats(transformedStats);
    } catch (error) {
      console.error('Error fetching housekeeping stats:', error);
      console.error('Stats error details:', error.response?.data);
      
      // Set empty stats on error
      setStats({
        total: 0,
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        avgDuration: 0
      });
      toast.error('Failed to fetch housekeeping statistics');
    }
  };

  // Fetch staff members
  const fetchStaffMembers = async () => {
    try {
      // Fetch only staff members (role: 'staff') from the API
      const response = await adminService.getUsers({ role: 'staff' });
      const staffUsers = response.data.users || [];
      
      // Transform the data to match our StaffMember interface
      const transformedStaff: StaffMember[] = staffUsers.map((user: any) => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }));
      
      setStaffMembers(transformedStaff);
    } catch (error) {
      console.error('Error fetching staff members:', error);
      setStaffMembers([]);
      toast.error('Failed to fetch staff members');
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      // Fetch rooms from the API
      const response = await fetch('/api/v1/rooms?limit=100');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data.rooms || []);
      } else {
        console.error('Failed to fetch rooms:', response.statusText);
        setRooms([]);
        toast.error('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      toast.error('Error fetching rooms');
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchStaffMembers();
    fetchRooms();
  }, [filters]);

  // Real-time connection setup
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!isConnected) return;
    
    const handleTaskCreate = (data: any) => {
      console.log('Real-time housekeeping task created:', data);
      fetchTasks();
      fetchStats();
      toast.success('New housekeeping task created!');
    };
    
    const handleTaskUpdate = (data: any) => {
      console.log('Real-time housekeeping task updated:', data);
      fetchTasks();
      fetchStats();
      toast.success(`Housekeeping task ${data.status === 'completed' ? 'completed' : 'updated'}!`);
    };
    
    const handleTaskAssigned = (data: any) => {
      console.log('Real-time housekeeping task assigned:', data);
      fetchTasks();
      fetchStats();
      toast.success(`Task assigned to ${data.assignedToName || 'staff member'}!`);
    };
    
    on('housekeeping:task_created', handleTaskCreate);
    on('housekeeping:task_updated', handleTaskUpdate);
    on('housekeeping:task_assigned', handleTaskAssigned);
    on('housekeeping:status_changed', handleTaskUpdate);
    
    return () => {
      off('housekeeping:task_created', handleTaskCreate);
      off('housekeeping:task_updated', handleTaskUpdate);
      off('housekeeping:task_assigned', handleTaskAssigned);
      off('housekeeping:status_changed', handleTaskUpdate);
    };
  }, [isConnected, on, off]);

  // Handle status update
  const handleStatusUpdate = async (taskId: string, newStatus: 'assigned' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      setUpdating(true);
      await adminService.updateHousekeepingTask(taskId, { status: newStatus });
      await fetchTasks();
      await fetchStats();
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      const errorMessage = error.response?.data?.message || 'Error updating task status. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Handle staff assignment
  const handleAssignStaff = async (taskId: string, staffId: string) => {
    try {
      setUpdating(true);
      console.log('Assigning staff to task:', { taskId, staffId });
      
      // Validate task ID format (24 character hex string)
      if (!/^[0-9a-fA-F]{24}$/.test(taskId)) {
        console.error('Invalid task ID format:', taskId);
        alert('Invalid task ID format. Please try refreshing the page.');
        return;
      }
      
      const selectedStaff = staffMembers.find(staff => staff._id === staffId);
      console.log('Selected staff:', selectedStaff);
      
      if (!selectedStaff) {
        console.error('Selected staff not found:', staffId);
        alert('Selected staff member not found. Please try again.');
        return;
      }
      
      const updateData = { 
        status: 'assigned' as const,
        assignedToUserId: staffId,
        assignedTo: staffId
      } as any;
      console.log('Update data:', updateData);
      
             console.log('About to call updateHousekeepingTask with:', { taskId, updateData });
       const updateResponse = await adminService.updateHousekeepingTask(taskId, updateData);
       console.log('Update response:', updateResponse);
       
       await fetchTasks();
       await fetchStats();
       setShowAssignmentModal(false);
       setSelectedStaffId('');
       toast.success('Task assigned to staff successfully!');
    } catch (error) {
      console.error('Error assigning staff:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error assigning staff. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Open assignment modal
  const openAssignmentModal = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setShowAssignmentModal(true);
  };

  // Handle task creation
  const handleCreateTask = async (taskData: any) => {
    try {
      setUpdating(true);
      
      // Filter out empty supplies
      const cleanedTaskData = {
        ...taskData,
        supplies: taskData.supplies.filter((supply: any) => supply.name && supply.name.trim() !== '')
      };
      
                    console.log('Creating task with data:', cleanedTaskData);
       
       // Validate that roomId exists in our rooms list
       const selectedRoom = rooms.find(room => room._id === cleanedTaskData.roomId);
       if (!selectedRoom) {
         console.error('Selected room not found in rooms list:', cleanedTaskData.roomId);
         alert('Please select a valid room');
         return;
       }
       
       console.log('Selected room:', selectedRoom);
       console.log('Room ID being sent:', cleanedTaskData.roomId);
      
      await adminService.createHousekeepingTask(cleanedTaskData);
      await fetchTasks();
      await fetchStats();
      setShowCreateModal(false);
      resetFormData();
      toast.success('Housekeeping task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      // Show more detailed error information
      const errorMessage = error.response?.data?.message || 'Error creating task. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      taskType: 'cleaning',
      priority: 'medium',
      roomId: '',
      estimatedDuration: 30,
      notes: '',
      supplies: [{ name: '', quantity: 1, unit: 'pieces' }]
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: filters.limit || 10
    });
    setSearchTerm('');
  };

  // Apply filters
  const applyFilters = (newFilters: Partial<HousekeepingFilters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Add supply item
  const addSupplyItem = () => {
    setFormData({
      ...formData,
      supplies: [...formData.supplies, { name: '', quantity: 1, unit: 'pieces' }]
    });
  };

  // Remove supply item
  const removeSupplyItem = (index: number) => {
    const newSupplies = formData.supplies.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      supplies: newSupplies
    });
  };

  // Update supply item
  const updateSupplyItem = (index: number, field: string, value: any) => {
    const newSupplies = [...formData.supplies];
    newSupplies[index] = { ...newSupplies[index], [field]: value };
    setFormData({
      ...formData,
      supplies: newSupplies
    });
  };

  // Table columns
  const columns: Array<{
    key: keyof HousekeepingTask | 'actions';
    header: string;
    render?: (value: any, row: HousekeepingTask) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
  }> = [
    {
      key: 'title',
      header: 'Task',
      render: (value: string, row: HousekeepingTask) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.taskType.replace('_', ' ')}</div>
        </div>
      )
    },
    {
      key: 'roomId',
      header: 'Room',
      render: (value: any) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
          {value ? (
            <>
              <span className="font-medium">{value.roomNumber}</span>
              <span className="text-sm text-gray-500 ml-1">({value.type})</span>
            </>
          ) : (
            <span className="text-gray-500">No room assigned</span>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (value: string) => (
        <StatusBadge 
          status={value} 
          variant="pill" 
          size="sm"
          className={
            value === 'urgent' ? 'bg-red-100 text-red-800' :
            value === 'high' ? 'bg-orange-100 text-orange-800' :
            value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }
        />
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <StatusBadge status={value} variant="pill" size="sm" />
      )
    },
         {
       key: 'assignedToUserId',
       header: 'Assigned To',
       render: (value: any, row: HousekeepingTask) => {
         console.log('Rendering assignedTo:', { value, assignedToUserId: row.assignedToUserId, staffMembers });
         
         // Check both assignedTo and assignedToUserId for backward compatibility
         const assignedValue = value || row.assignedToUserId;
         
         let staffName = 'Unassigned';
         if (assignedValue) {
           if (typeof assignedValue === 'string') {
             // If it's just a string (user ID), find the staff member
             const staff = staffMembers.find(staff => staff._id === assignedValue);
             staffName = staff ? staff.name : 'Unknown Staff';
             console.log('Found staff for ID:', assignedValue, staff);
           } else if (assignedValue.name) {
             // If it's a populated object, use the name
             staffName = assignedValue.name;
           }
         }
         
         return (
           <div className="flex items-center">
             <User className="h-4 w-4 text-gray-400 mr-1" />
             <span className={assignedValue ? 'text-gray-900' : 'text-gray-500'}>
               {staffName}
             </span>
           </div>
         );
       }
     },
    {
      key: 'estimatedDuration',
      header: 'Duration',
      render: (value: number) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          <span>{value} min</span>
        </div>
      ),
      align: 'center' as const
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (value: string) => (
        <div className="text-sm">
          {format(parseISO(value), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: HousekeepingTask) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTask(row);
              setShowDetailsModal(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAssignmentModal(row)}
                disabled={updating}
              >
                <User className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusUpdate(row._id, 'cancelled')}
                disabled={updating}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          {row.status === 'assigned' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate(row._id, 'in_progress')}
              disabled={updating}
            >
              <Play className="h-4 w-4 text-green-600" />
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate(row._id, 'completed')}
              disabled={updating}
            >
              <CheckSquare className="h-4 w-4 text-green-600" />
            </Button>
          )}
        </div>
      ),
      align: 'center' as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent leading-tight">
                Housekeeping Management
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium">
                Manage cleaning tasks and room maintenance with real-time updates
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className={`flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium shadow-sm ${
            isConnected 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
          }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            {isConnected ? (
                <><Wifi className="w-3 h-3 mr-1" /> Live Connected</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
            )}
          </div>
            <div className="flex gap-2">
          <Button
                variant="outline"
            onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none text-xs sm:text-sm border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
          >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create New Task</span>
                <span className="sm:hidden">New Task</span>
          </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Total Tasks</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(stats?.total || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-yellow-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-md">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(stats?.pending || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">In Progress</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(stats?.inProgress || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-3 lg:ml-4">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Completed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(stats?.completed || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Filters */}
      {showFilters && (
        <Card className="bg-white border-0 shadow-xl">
          <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Filter className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Status
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Task Type
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  value={filters.taskType || ''}
                  onChange={(e) => setFilters({ ...filters, taskType: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Types</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="deep_clean">Deep Clean</option>
                  <option value="checkout_clean">Checkout Clean</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Priority
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all duration-200"
                  value={filters.priority || ''}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined, page: 1 })}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Room Number
                </label>
                <Input
                  type="text"
                  placeholder="Enter room number"
                  value={filters.roomId || ''}
                  onChange={(e) => setFilters({ ...filters, roomId: e.target.value || undefined, page: 1 })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  Assigned To
                </label>
                <Input
                  type="text"
                  placeholder="Enter staff name"
                  value={filters.assignedToUserId || ''}
                  onChange={(e) => setFilters({ ...filters, assignedToUserId: e.target.value || undefined, page: 1 })}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      <Card className="mb-4 shadow-lg">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs sm:text-sm border-gray-300 hover:bg-gray-50"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              {Object.keys(filters).some(key => key !== 'page' && key !== 'limit' && filters[key as keyof HousekeepingFilters]) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-600 font-medium">
                {pagination.total} total tasks
              </div>
              {Object.keys(filters).some(key => key !== 'page' && key !== 'limit' && filters[key as keyof HousekeepingFilters]) && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-gray-500">Active filters:</span>
                  {filters.status && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                      Status: {filters.status}
                    </span>
                  )}
                  {filters.taskType && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                      Type: {filters.taskType}
                    </span>
                  )}
                  {filters.priority && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium">
                      Priority: {filters.priority}
                    </span>
                  )}
                  {filters.assignedToUserId && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium">
                      {filters.assignedToUserId === 'unassigned' ? 'Unassigned' : 'Assigned'}
                    </span>
                  )}
                  {filters.roomId && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                      Room: {rooms.find(r => r._id === filters.roomId)?.roomNumber || 'Unknown'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => applyFilters({ status: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Task Type Filter */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Task Type</label>
                <select
                  value={filters.taskType || ''}
                  onChange={(e) => applyFilters({ taskType: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="deep_clean">Deep Clean</option>
                  <option value="checkout_clean">Checkout Clean</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => applyFilters({ priority: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assigned Staff Filter */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  value={filters.assignedToUserId || ''}
                  onChange={(e) => applyFilters({ assignedToUserId: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="">All Staff</option>
                  <option value="unassigned">Unassigned</option>
                  {staffMembers.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Filter */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Room</label>
                <select
                  value={filters.roomId || ''}
                  onChange={(e) => applyFilters({ roomId: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                >
                  <option value="">All Rooms</option>
                  {rooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      Room {room.roomNumber} ({room.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Created Date From */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Created From</label>
                <input
                  type="date"
                  value={filters.createdDateFrom || ''}
                  onChange={(e) => applyFilters({ createdDateFrom: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              {/* Created Date To */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Created To</label>
                <input
                  type="date"
                  value={filters.createdDateTo || ''}
                  onChange={(e) => applyFilters({ createdDateTo: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              {/* Completed Date From */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Completed From</label>
                <input
                  type="date"
                  value={filters.completedDateFrom || ''}
                  onChange={(e) => applyFilters({ completedDateFrom: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              {/* Completed Date To */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Completed To</label>
                <input
                  type="date"
                  value={filters.completedDateTo || ''}
                  onChange={(e) => applyFilters({ completedDateTo: e.target.value || undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              {/* Duration Range */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Min Duration (min)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.estimatedDurationMin || ''}
                  onChange={(e) => applyFilters({ estimatedDurationMin: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">Max Duration (min)</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.estimatedDurationMax || ''}
                  onChange={(e) => applyFilters({ estimatedDurationMax: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="h-4 w-4" />
              Tasks Management
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              Inventory Analytics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tasks">
          {/* Tasks Table */}
          <Card className="overflow-hidden bg-white border-0 shadow-xl">
            <CardHeader className="pb-3 px-4 sm:px-6 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Housekeeping Tasks</CardTitle>
                </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative">
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 text-sm border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select
                value={filters.limit || 10}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                className="border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
          
          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-sm font-medium text-gray-600 mr-2">Quick filters:</span>
            <Button
              variant={filters.status === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyFilters({ status: filters.status === 'pending' ? undefined : 'pending' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.status === 'pending' 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md' 
                  : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              }`}
            >
              Pending ({stats?.pending || 0})
            </Button>
            <Button
              variant={filters.status === 'assigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyFilters({ status: filters.status === 'assigned' ? undefined : 'assigned' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.status === 'assigned' 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
                  : 'border-blue-300 text-blue-700 hover:bg-blue-50'
              }`}
            >
              Assigned ({stats?.assigned || 0})
            </Button>
            <Button
              variant={filters.status === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyFilters({ status: filters.status === 'in_progress' ? undefined : 'in_progress' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.status === 'in_progress' 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
                  : 'border-orange-300 text-orange-700 hover:bg-orange-50'
              }`}
            >
              In Progress ({stats?.inProgress || 0})
            </Button>
            <Button
              variant={filters.status === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyFilters({ status: filters.status === 'completed' ? undefined : 'completed' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.status === 'completed' 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              Completed ({stats?.completed || 0})
            </Button>
            <Button
              variant={filters.assignedToUserId === 'unassigned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyFilters({ assignedToUserId: filters.assignedToUserId === 'unassigned' ? undefined : 'unassigned' })}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                filters.assignedToUserId === 'unassigned' 
                  ? 'bg-gray-500 hover:bg-gray-600 text-white shadow-md' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Unassigned
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-sm text-gray-500">Loading tasks...</p>
                      </div>
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 sm:px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Calendar className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500">No housekeeping tasks found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks.map((task, index) => (
                    <tr
                      key={task._id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 border-b border-gray-100"
                      onClick={() => {
          setSelectedTask(task);
          setShowDetailsModal(true);
        }}
                    >
                      {columns.map((column, colIndex) => {
                        const value = column.key === 'actions' ? null : task[column.key as keyof HousekeepingTask];
                        return (
                          <td
                            key={colIndex}
                            className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900"
                          >
                            {column.render ? column.render(value, task) : (value ? String(value) : '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Server-side Pagination */}
          {pagination && pagination.total > (filters.limit || 10) && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing <span className="font-semibold text-blue-600">{((pagination.current - 1) * (filters.limit || 10)) + 1}</span> to <span className="font-semibold text-blue-600">{Math.min(pagination.current * (filters.limit || 10), pagination.total)}</span> of <span className="font-semibold text-blue-600">{pagination.total}</span> results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.current - 1) })}
                  disabled={pagination.current === 1 || loading}
                  className="text-sm px-3 sm:px-4 py-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    'Previous'
                  )}
                </Button>
                <div className="hidden sm:flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={pagination.current === pageNumber ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilters({ ...filters, page: pageNumber })}
                        disabled={loading}
                        className={`text-sm min-w-[40px] transition-all duration-200 ${
                          pagination.current === pageNumber 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                <div className="sm:hidden text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border shadow-sm">
                  {pagination.current} / {pagination.pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.pages, pagination.current + 1) })}
                  disabled={pagination.current === pagination.pages || loading}
                  className="text-sm px-3 sm:px-4 py-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    'Next'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <HousekeepingInventoryDashboard />
        </TabsContent>
      </Tabs>

      {/* Staff Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setSelectedStaffId('');
        }}
        title="Assign Task to Staff"
      >
        <div className="space-y-4 sm:space-y-5">
          {selectedTask && (
            <div className="border-b border-gray-200 pb-3 sm:pb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                 {selectedTask.roomId ? `Room ${selectedTask.roomId.roomNumber}` : 'No room assigned'} - {selectedTask.taskType.replace('_', ' ')}
               </p>
             </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-3">ASSIGNED TO</label>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
              {staffMembers.map((staff) => (
                <div
                  key={staff._id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedStaffId === staff._id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedStaffId(staff._id)}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-3" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{staff.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">{staff.email}</div>
                  </div>
                  {selectedStaffId === staff._id && (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAssignmentModal(false);
                setSelectedStaffId('');
              }}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedStaffId && selectedTask) {
                  handleAssignStaff(selectedTask._id, selectedStaffId);
                }
              }}
              disabled={!selectedStaffId || updating}
              className="w-full sm:w-auto text-sm bg-blue-600 hover:bg-blue-700"
            >
              Assign Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetFormData();
        }}
        title="Create New Housekeeping Task"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <Input
                type="text"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Room *</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm"
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              >
                <option value="">Select a room</option>
                {rooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.roomNumber} - {room.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm"
                value={formData.taskType}
                onChange={(e) => setFormData({ ...formData, taskType: e.target.value as any })}
              >
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
                <option value="inspection">Inspection</option>
                <option value="deep_clean">Deep Clean</option>
                <option value="checkout_clean">Checkout Clean</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 text-sm"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
              <Input
                type="number"
                placeholder="30"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 30 })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 h-16 sm:h-20 resize-none text-sm"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-2 sm:px-3 py-2 h-16 sm:h-20 resize-none text-sm"
              placeholder="Enter additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Supplies */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Supplies Required</label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addSupplyItem}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Add Supply
              </Button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {formData.supplies.map((supply, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Supply name"
                      value={supply.name}
                      onChange={(e) => updateSupplyItem(index, 'name', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={supply.quantity}
                      onChange={(e) => updateSupplyItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <select
                      className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
                      value={supply.unit}
                      onChange={(e) => updateSupplyItem(index, 'unit', e.target.value)}
                    >
                      <option value="pieces">Pieces</option>
                      <option value="bottles">Bottles</option>
                      <option value="rolls">Rolls</option>
                      <option value="kg">Kilograms</option>
                      <option value="liters">Liters</option>
                      <option value="sets">Sets</option>
                    </select>
                  </div>
                  {formData.supplies.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSupplyItem(index)}
                      className="w-full sm:w-auto p-2"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetFormData();
              }}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateTask(formData)}
              disabled={updating || !formData.title || !formData.roomId}
              className="w-full sm:w-auto text-sm"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Create Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTask(null);
          }}
          title="Task Details"
        >
          <div className="space-y-4 sm:space-y-6">
            {/* Task Header */}
            <div className="border-b border-gray-200 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedTask.taskType.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={selectedTask.status} variant="pill" />
              </div>
            </div>

            {/* Task Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                                 <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Room</label>
                   <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                     {selectedTask.roomId ? (
                       <>
                        <span className="font-medium text-sm sm:text-base">{selectedTask.roomId.roomNumber}</span>
                        <span className="text-gray-500 ml-1 sm:ml-2 text-xs sm:text-sm">({selectedTask.roomId.type})</span>
                       </>
                     ) : (
                      <span className="text-gray-500 text-sm sm:text-base">No room assigned</span>
                     )}
                   </div>
                 </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Priority</label>
                  <div className="mt-1">
                    <StatusBadge 
                      status={selectedTask.priority} 
                      variant="pill" 
                      size="sm"
                      className={
                        selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }
                    />
                  </div>
                </div>

                                 <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Assigned To</label>
                   <div className="flex items-center mt-1">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                    <span className={`text-sm sm:text-base ${selectedTask.assignedToUserId ? 'text-gray-900' : 'text-gray-500'}`}>
                       {(() => {
                         const assignedValue = selectedTask.assignedToUserId;
                         console.log('Task details - assignedValue:', assignedValue, 'type:', typeof assignedValue);
                         
                         if (!assignedValue) return 'Unassigned';
                         if (typeof assignedValue === 'string') {
                           const staff = staffMembers.find(staff => staff._id === assignedValue);
                           console.log('Found staff in details:', staff);
                           return staff ? staff.name : 'Unknown Staff';
                         } else if (assignedValue && assignedValue.name) {
                           return assignedValue.name;
                         }
                         
                         return 'Unknown Staff';
                       })()}
                     </span>
                   </div>
                 </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Estimated Duration</label>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                    <span className="text-sm sm:text-base">{selectedTask.estimatedDuration} minutes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">Created</label>
                  <div className="mt-1 text-xs sm:text-sm text-gray-900">
                    {format(parseISO(selectedTask.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>

                {selectedTask.startedAt && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Started</label>
                    <div className="mt-1 text-xs sm:text-sm text-gray-900">
                      {format(parseISO(selectedTask.startedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                )}

                {selectedTask.completedAt && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Completed</label>
                    <div className="mt-1 text-xs sm:text-sm text-gray-900">
                      {format(parseISO(selectedTask.completedAt), 'MMM dd, yyyy HH:mm')}
                    </div>
                  </div>
                )}

                {selectedTask.actualDuration && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Actual Duration</label>
                    <div className="mt-1 text-xs sm:text-sm text-gray-900">
                      {selectedTask.actualDuration} minutes
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1 text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-md">
                  {selectedTask.description}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedTask.notes && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Notes</label>
                <div className="mt-1 text-xs sm:text-sm text-gray-900 bg-gray-50 p-2 sm:p-3 rounded-md">
                  {selectedTask.notes}
                </div>
              </div>
            )}

            {/* Supplies */}
            {selectedTask.supplies && selectedTask.supplies.length > 0 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Supplies Required</label>
                <div className="mt-2 space-y-2">
                  {selectedTask.supplies.map((supply, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-md">
                      <span className="text-xs sm:text-sm font-medium">{supply.name}</span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {supply.quantity} {supply.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTask(null);
                }}
                className="w-full sm:w-auto text-sm"
              >
                Close
              </Button>
              {selectedTask.status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      openAssignmentModal(selectedTask);
                      setShowDetailsModal(false);
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto text-sm"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Assign
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleStatusUpdate(selectedTask._id, 'cancelled');
                      setShowDetailsModal(false);
                      setSelectedTask(null);
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto text-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {selectedTask.status === 'assigned' && (
                <Button
                  onClick={() => {
                    handleStatusUpdate(selectedTask._id, 'in_progress');
                    setShowDetailsModal(false);
                    setSelectedTask(null);
                  }}
                  disabled={updating}
                  className="w-full sm:w-auto text-sm"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Start Task
                </Button>
              )}
              {selectedTask.status === 'in_progress' && (
                <Button
                  onClick={() => {
                    handleStatusUpdate(selectedTask._id, 'completed');
                    setShowDetailsModal(false);
                    setSelectedTask(null);
                  }}
                  disabled={updating}
                  className="w-full sm:w-auto text-sm"
                >
                  <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
