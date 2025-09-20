import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TaskCompletionModal, getDefaultSteps } from '../../components/staff/TaskCompletionModal';
import { maintenanceService, MaintenanceTask } from '../../services/maintenanceService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface GroupedTasks {
  urgent: MaintenanceTask[];
  pending: MaintenanceTask[];
  inProgress: MaintenanceTask[];
  completed: MaintenanceTask[];
}

export default function StaffMaintenance() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<GroupedTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);


  const fetchTasks = async () => {
    console.log('📋 Fetching maintenance tasks...');
    try {
      setLoading(true);
      setError(null);
      const groupedTasks = await maintenanceService.getTasksGrouped();
      console.log('✅ Tasks fetched and set:', groupedTasks);
      setTasks(groupedTasks);
    } catch (err) {
      console.error('❌ Failed to fetch maintenance tasks:', {
        error: err.response?.data || err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      });

      let errorMessage = 'Failed to load maintenance tasks';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view maintenance tasks.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    console.log('🚀 Starting maintenance task:', taskId);
    try {
      setActionLoading(taskId);
      console.log('🔄 Calling maintenanceService.startTask...');
      const result = await maintenanceService.startTask(taskId);
      console.log('✅ Task started successfully:', result);

      console.log('🔄 Refreshing tasks data...');
      await fetchTasks(); // Refresh data

      toast.success('Task started successfully!');
      console.log('✅ Task start flow completed');
    } catch (err) {
      console.error('❌ Failed to start task:', {
        taskId,
        error: err.response?.data || err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        stack: err.stack
      });

      // More specific error messages
      let errorMessage = 'Failed to start task. Please try again.';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Task not found. It may have been deleted.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteClick = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setShowCompletionModal(true);
  };

  const handleCompleteTask = async (completedSteps: string[]) => {
    if (!selectedTask) return;

    try {
      setActionLoading(selectedTask._id);
      await maintenanceService.completeTask(selectedTask._id, {
        completedSteps: completedSteps,
        completedAt: new Date().toISOString()
      });
      await fetchTasks(); // Refresh data
      setShowCompletionModal(false);
      setSelectedTask(null);
      console.log('Task completed successfully');
    } catch (err) {
      console.error('Failed to complete task:', err);
      setError('Failed to complete task. Please try again.');
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !tasks) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load maintenance data</h3>
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Maintenance Management</h1>
            <p className="text-gray-600">Handle maintenance requests and repairs</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={fetchTasks} variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Urgent Issues ({tasks.urgent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.urgent.length > 0 ? (
                tasks.urgent.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      {task.roomId && (
                        <p className="text-xs text-gray-500">Room {task.roomId.roomNumber}</p>
                      )}
                      <p className="text-xs text-red-600">Reported: {formatTimeAgo(task.createdAt)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleStartTask(task._id)}
                      disabled={actionLoading === task._id}
                    >
                      {actionLoading === task._id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        'Attend Now'
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No urgent issues</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Pending Tasks ({tasks.pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.pending.length > 0 ? (
                tasks.pending.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      {task.roomId && (
                        <p className="text-xs text-gray-500">Room {task.roomId.roomNumber}</p>
                      )}
                      <p className={`text-xs ${getPriorityColor(task.priority)}`}>
                        Priority: {task.priority}
                        {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleStartTask(task._id)}
                      disabled={actionLoading === task._id}
                    >
                      {actionLoading === task._id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        'Start Task'
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p>No pending tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2 text-blue-600" />
              In Progress ({tasks.inProgress.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.inProgress.length > 0 ? (
                tasks.inProgress.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      {task.roomId && (
                        <p className="text-xs text-gray-500">Room {task.roomId.roomNumber}</p>
                      )}
                      <p className="text-xs text-blue-600">Started: {formatTimeAgo(task.updatedAt)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCompleteClick(task)}
                      disabled={actionLoading === task._id}
                    >
                      {actionLoading === task._id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        'Complete'
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No tasks in progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Completed Today ({tasks.completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.completed.length > 0 ? (
                tasks.completed.slice(0, 5).map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      {task.roomId && (
                        <p className="text-xs text-gray-500">Room {task.roomId.roomNumber}</p>
                      )}
                      <p className="text-xs text-green-600">
                        Completed: {task.completedDate ? formatTimeAgo(task.completedDate) : formatTimeAgo(task.updatedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-700">Completed</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p>No completed tasks today</p>
                </div>
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
          title="Complete Maintenance Task"
          taskName={`${selectedTask.roomId?.roomNumber ? `Room ${selectedTask.roomId.roomNumber} - ` : ''}${selectedTask.title}`}
          steps={getDefaultSteps('maintenance', selectedTask.category)}
          loading={actionLoading === selectedTask._id}
        />
      )}
    </div>
  );
}
