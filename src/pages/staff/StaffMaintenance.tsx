import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, CheckCircle, AlertTriangle, RefreshCw, User, Calendar, Flag } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-20 animate-pulse"></div>
            <LoadingSpinner />
          </div>
          <p className="mt-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Loading Maintenance Tasks...
          </p>
        </div>
      </div>
    );
  }

  if (error || !tasks) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="relative group mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Failed to load maintenance data
            </h3>
            <p className="text-gray-600 mb-6">There was an issue loading your maintenance tasks. Please try again.</p>
            <Button onClick={fetchTasks} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl px-6 py-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transform -skew-y-1 shadow-xl rounded-3xl"></div>
          <div className="relative bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-3">
                  <div className="relative group mr-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-3 rounded-full">
                      <Wrench className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Maintenance Management
                    </h1>
                    <p className="text-gray-600 text-lg">Handle maintenance requests and repairs efficiently</p>
                  </div>
                </div>

                {/* Task Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-xl text-center">
                    <div className="text-xl font-bold">{tasks?.urgent.length || 0}</div>
                    <div className="text-xs opacity-90">Urgent</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-2 rounded-xl text-center">
                    <div className="text-xl font-bold">{tasks?.pending.length || 0}</div>
                    <div className="text-xs opacity-90">Pending</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-2 rounded-xl text-center">
                    <div className="text-xl font-bold">{tasks?.inProgress.length || 0}</div>
                    <div className="text-xs opacity-90">In Progress</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-xl text-center">
                    <div className="text-xl font-bold">{tasks?.completed.length || 0}</div>
                    <div className="text-xs opacity-90">Completed</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={fetchTasks}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgent Issues */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Urgent Issues ({tasks.urgent.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tasks.urgent.length > 0 ? (
                    tasks.urgent.map((task) => (
                      <div key={task._id} className="group/task relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-100 to-pink-100 rounded-2xl opacity-70 group-hover/task:opacity-100 transition duration-200"></div>
                        <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <Flag className="h-4 w-4 text-red-500 mr-2" />
                              <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {task.roomId && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  Room {task.roomId.roomNumber}
                                </div>
                              )}
                              <div className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-lg">
                                <Calendar className="h-3 w-3 mr-1" />
                                Reported: {formatTimeAgo(task.createdAt)}
                              </div>
                              {task.assignedBy && (
                                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  By: {task.assignedBy.firstName || 'Admin'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl"
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
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">No urgent issues</p>
                      <p className="text-sm text-gray-500 mt-1">All critical tasks are handled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                    Pending Tasks ({tasks.pending.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tasks.pending.length > 0 ? (
                    tasks.pending.map((task) => (
                      <div key={task._id} className="group/task relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-2xl opacity-70 group-hover/task:opacity-100 transition duration-200"></div>
                        <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <Flag className="h-4 w-4 text-orange-500 mr-2" />
                              <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {task.roomId && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  Room {task.roomId.roomNumber}
                                </div>
                              )}
                              <div className={`flex items-center px-2 py-1 rounded-lg ${task.priority === 'urgent' || task.priority === 'emergency'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'}`}>
                                <Flag className="h-3 w-3 mr-1" />
                                Priority: {task.priority}
                              </div>
                              {task.dueDate && (
                                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-lg">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}
                              {task.assignedBy && (
                                <div className="flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  By: {task.assignedBy.firstName || 'Admin'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl"
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
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">No pending tasks</p>
                      <p className="text-sm text-gray-500 mt-1">All tasks are up to date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* In Progress */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full">
                      <Wrench className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    In Progress ({tasks.inProgress.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tasks.inProgress.length > 0 ? (
                    tasks.inProgress.map((task) => (
                      <div key={task._id} className="group/task relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl opacity-70 group-hover/task:opacity-100 transition duration-200"></div>
                        <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <div className="relative mr-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                              </div>
                              <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {task.roomId && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  Room {task.roomId.roomNumber}
                                </div>
                              )}
                              <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                <Calendar className="h-3 w-3 mr-1" />
                                Started: {formatTimeAgo(task.updatedAt)}
                              </div>
                              {task.assignedBy && (
                                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  By: {task.assignedBy.firstName || 'Admin'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-xl"
                              onClick={() => handleCompleteClick(task)}
                              disabled={actionLoading === task._id}
                            >
                              {actionLoading === task._id ? (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                  Completing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Clock className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">No tasks in progress</p>
                      <p className="text-sm text-gray-500 mt-1">Start working on pending tasks</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completed Today */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Completed Today ({tasks.completed.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tasks.completed.length > 0 ? (
                    tasks.completed.slice(0, 5).map((task) => (
                      <div key={task._id} className="group/task relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl opacity-70 group-hover/task:opacity-100 transition duration-200"></div>
                        <div className="relative flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-102">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description'}</p>

                            <div className="flex flex-wrap gap-2 text-xs">
                              {task.roomId && (
                                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  Room {task.roomId.roomNumber}
                                </div>
                              )}
                              <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                                <Calendar className="h-3 w-3 mr-1" />
                                Completed: {task.completedDate ? formatTimeAgo(task.completedDate) : formatTimeAgo(task.updatedAt)}
                              </div>
                              {task.assignedBy && (
                                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-lg">
                                  <User className="h-3 w-3 mr-1" />
                                  By: {task.assignedBy.firstName || 'Admin'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="relative group mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
                        <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Clock className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-gray-600 font-medium">No completed tasks today</p>
                      <p className="text-sm text-gray-500 mt-1">Tasks you complete will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
}
