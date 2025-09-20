import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TaskCompletionModal, getDefaultSteps } from '../../components/staff/TaskCompletionModal';
import InventoryConsumptionForm from '../../components/staff/InventoryConsumptionForm';
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  MapPin,
  User,
  RefreshCw,
  Calendar,
  CheckSquare,
  Wifi,
  WifiOff,
  Package
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { housekeepingService, HousekeepingTask } from '../../services/housekeepingService';
import { useRealTime } from '../../services/realTimeService';
import { toast } from 'react-hot-toast';

export default function StaffHousekeeping() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryTaskId, setInventoryTaskId] = useState<string | null>(null);

  // Real-time connection
  const { connectionState, connect, disconnect, on, off, isConnected } = useRealTime();

  useEffect(() => {
    fetchTasks();
  }, []);

  // Real-time connection setup
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!isConnected || !user?._id) return;
    
    const handleTaskAssigned = (data: any) => {
      console.log('Real-time housekeeping task assigned:', data);
      if (data.assignedToUserId === user._id) {
        fetchTasks();
        toast.success(`New housekeeping task assigned: ${data.title}!`);
      }
    };
    
    const handleTaskUpdate = (data: any) => {
      console.log('Real-time housekeeping task updated:', data);
      if (data.assignedToUserId === user._id) {
        fetchTasks();
        if (data.status === 'cancelled') {
          toast.error(`Task cancelled: ${data.title}`);
        } else {
          toast.success(`Task updated: ${data.title}`);
        }
      }
    };
    
    on('housekeeping:task_assigned', handleTaskAssigned);
    on('housekeeping:task_updated', handleTaskUpdate);
    on('housekeeping:status_changed', handleTaskUpdate);
    
    return () => {
      off('housekeeping:task_assigned', handleTaskAssigned);
      off('housekeeping:task_updated', handleTaskUpdate);
      off('housekeeping:status_changed', handleTaskUpdate);
    };
  }, [isConnected, on, off, user?._id]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await housekeepingService.getTasks(user?._id);
      setTasks(data.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Unable to connect to server. Please check your internet connection.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdating(true);
      await housekeepingService.updateTaskStatus(taskId, newStatus);
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteClick = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setShowCompletionModal(true);
  };

  const handleCompleteTask = async (completedSteps: string[]) => {
    if (!selectedTask) return;

    try {
      setUpdating(true);
      await housekeepingService.completeTask(selectedTask._id, {
        status: 'completed',
        completedSteps: completedSteps,
        completedAt: new Date().toISOString()
      });
      await fetchTasks();
      setShowCompletionModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'cleaning': return <ClipboardCheck className="w-4 h-4" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      case 'inspection': return <CheckSquare className="w-4 h-4" />;
      default: return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Tasks</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTasks} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Housekeeping Tasks</h1>
          <p className="text-gray-600">Manage your assigned room cleaning and maintenance tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? (
              <><Wifi className="w-3 h-3 mr-1" /> Live Updates</>
            ) : (
              <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
            )}
          </div>
          <Button onClick={fetchTasks} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-lg font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-gray-900">{pendingTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Play className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-lg font-semibold text-gray-900">{inProgressTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">{completedTasks.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Pending Tasks ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending tasks</p>
              ) : (
                pendingTasks.map(task => (
                  <div key={task._id} className={`p-3 rounded-lg border ${getPriorityColor(task.priority)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getTaskTypeIcon(task.taskType)}
                          <p className="font-medium ml-2">{task.roomId.roomNumber}</p>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {task.taskType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.title}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{task.estimatedDuration} min</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => updateTaskStatus(task._id, 'in_progress')}
                        disabled={updating}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2 text-yellow-600" />
              In Progress ({inProgressTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inProgressTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No tasks in progress</p>
              ) : (
                inProgressTasks.map(task => (
                  <div key={task._id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getTaskTypeIcon(task.taskType)}
                          <p className="font-medium ml-2">{task.roomId.roomNumber}</p>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {task.taskType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.title}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Started {new Date(task.startedAt!).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInventoryTaskId(task._id);
                            setShowInventoryModal(true);
                          }}
                          disabled={updating}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Log Items
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteClick(task)}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Completed ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {completedTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No completed tasks</p>
              ) : (
                completedTasks.map(task => (
                  <div key={task._id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getTaskTypeIcon(task.taskType)}
                          <p className="font-medium ml-2">{task.roomId.roomNumber}</p>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {task.taskType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.title}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>
                            Completed {new Date(task.completedAt!).toLocaleTimeString()}
                            {task.actualDuration && ` (${task.actualDuration} min)`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Completion Modal */}
      {selectedTask && (
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedTask(null);
          }}
          onComplete={handleCompleteTask}
          title="Complete Housekeeping Task"
          taskName={`${selectedTask.roomId.roomNumber} - ${selectedTask.title}`}
          steps={getDefaultSteps('housekeeping', selectedTask.taskType)}
          loading={updating}
        />
      )}

      {/* Inventory Consumption Modal */}
      {showInventoryModal && inventoryTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Log Inventory Consumption</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInventoryModal(false);
                    setInventoryTaskId(null);
                  }}
                >
                  Close
                </Button>
              </div>

              <InventoryConsumptionForm
                mode="housekeeping"
                taskId={inventoryTaskId}
                roomId={tasks.find(t => t._id === inventoryTaskId)?.roomId._id}
                onSuccess={() => {
                  setShowInventoryModal(false);
                  setInventoryTaskId(null);
                  toast.success('Inventory consumption logged successfully!');
                  fetchTasks(); // Refresh tasks to show updated data
                }}
                onCancel={() => {
                  setShowInventoryModal(false);
                  setInventoryTaskId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}