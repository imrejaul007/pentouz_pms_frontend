import React, { useState, useEffect } from 'react';
import {
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  TrendingUp,
  Users,
  Package,
  ClipboardList,
  Shirt,
  Home,
  Eye,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface AutomationStatus {
  isEnabled: boolean;
  lastProcessed: string;
  totalProcessed: number;
  successRate: number;
  averageTime: number;
}

interface AutomationStep {
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  duration: number;
  details: string;
}

const SimpleAutomationDashboard: React.FC = () => {
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({
    isEnabled: true,
    lastProcessed: '2 hours ago',
    totalProcessed: 45,
    successRate: 98.5,
    averageTime: 12
  });

  const [automationSteps, setAutomationSteps] = useState<AutomationStep[]>([
    {
      name: 'Laundry Processing',
      status: 'completed',
      duration: 5,
      details: '8 items processed, ₹120 total cost'
    },
    {
      name: 'Inventory Assessment',
      status: 'completed',
      duration: 4,
      details: '15 items checked, 2 replaced'
    },
    {
      name: 'Housekeeping Tasks',
      status: 'completed',
      duration: 3,
      details: '3 tasks created and assigned'
    }
  ]);

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'checkout',
      room: 'Room 101',
      guest: 'John Doe',
      time: '2 hours ago',
      status: 'completed',
      duration: 12
    },
    {
      id: 2,
      type: 'checkout',
      room: 'Room 205',
      guest: 'Jane Smith',
      time: '4 hours ago',
      status: 'completed',
      duration: 15
    },
    {
      id: 3,
      type: 'checkout',
      room: 'Room 312',
      guest: 'Bob Johnson',
      time: '6 hours ago',
      status: 'completed',
      duration: 10
    }
  ]);

  const toggleAutomation = () => {
    setAutomationStatus(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Modern Header with Gradient */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Automation Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base mt-2">
                      Monitor and control automatic checkout processing
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={toggleAutomation}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 text-xs sm:text-sm ${
                    automationStatus.isEnabled
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg'
                  }`}
                >
                  {automationStatus.isEnabled ? (
                    <>
                      <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline" />
                      Disable Automation
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline" />
                      Enable Automation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Status Card */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    automationStatus.isEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      automationStatus.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    {automationStatus.isEnabled ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600">System Status</p>
              <p className="text-xs text-gray-500 mt-1">Real-time monitoring</p>
            </div>
          </div>

          {/* Total Processed Card */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{automationStatus.totalProcessed}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Total Processed</p>
              <p className="text-xs text-gray-500 mt-1">All time records</p>
            </div>
          </div>

          {/* Success Rate Card */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{automationStatus.successRate}%</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Success Rate</p>
              <p className="text-xs text-gray-500 mt-1">Performance metric</p>
            </div>
          </div>

          {/* Average Time Card */}
          <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] rounded-3xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{automationStatus.averageTime}m</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600">Avg. Time</p>
              <p className="text-xs text-gray-500 mt-1">Processing duration</p>
            </div>
          </div>
        </div>

        {/* Enhanced Automation Steps - Responsive */}
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Automation Steps</h2>
                <p className="text-white/80 mt-1 text-sm sm:text-base">Current automation process status</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {automationSteps.map((step, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-3 sm:p-4 border border-gray-200/50 hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                  {/* Progress indicator */}
                  <div className="absolute top-0 left-0 h-1 w-full bg-gray-200">
                    <div className={`h-full transition-all duration-1000 ${
                      step.status === 'completed' ? 'w-full bg-gradient-to-r from-green-500 to-emerald-500' :
                      step.status === 'in_progress' ? 'w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500' :
                      step.status === 'pending' ? 'w-1/3 bg-gradient-to-r from-yellow-500 to-amber-500' :
                      'w-0 bg-gradient-to-r from-red-500 to-rose-500'
                    }`}></div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-2">
                    <div className="flex items-center">
                      <div className={`p-2 sm:p-3 rounded-xl ${getStatusColor(step.status)} relative`}>
                        {getStatusIcon(step.status)}
                        {step.status === 'completed' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{step.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            step.status === 'completed' ? 'bg-green-100 text-green-800' :
                            step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {step.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{step.details}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-base sm:text-lg font-bold text-gray-900">{step.duration}m</p>
                      </div>
                      <p className="text-xs text-gray-500">Duration</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Recent Activity - Responsive */}
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Recent Activity</h2>
                <p className="text-white/80 mt-1 text-sm sm:text-base">Latest automation events</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-3 sm:p-4 border border-gray-200/50 hover:shadow-lg transition-all duration-200 relative overflow-hidden group">
                  {/* Timeline indicator */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500 to-transparent"></div>
                  {index < recentActivity.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center">
                      <div className="relative">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                      </div>
                      <div className="ml-3 sm:ml-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">{activity.guest}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {activity.room}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">Checkout automation completed</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Success</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-2 justify-start sm:justify-end">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-base sm:text-lg font-bold text-gray-900">{activity.duration}m</p>
                      </div>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAutomationDashboard;
