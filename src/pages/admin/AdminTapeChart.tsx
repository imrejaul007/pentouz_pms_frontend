import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Bed, 
  Building2, 
  Calendar, 
  Settings, 
  Users,
  AlertCircle,
  Activity,
  TrendingUp
} from 'lucide-react';
import TapeChartView from '../../components/tapechart/TapeChartView';
import RoomBlocks from '../../components/tapechart/RoomBlocks';
import AdvancedReservations from '../../components/tapechart/AdvancedReservations';
import AssignmentRules from '../../components/tapechart/AssignmentRules';
import TapeChartDashboard from '../../components/tapechart/TapeChartDashboard';
import { WaitingListManager } from '../../components/reservations/WaitingListManager';

const AdminTapeChart: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabConfig = [
    {
      value: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Real-time overview',
      color: 'bg-blue-500',
      activeColor: 'bg-blue-600 text-white border-blue-600 shadow-lg',
      notifications: 0
    },
    {
      value: 'tapechart',
      label: 'Tape Chart',
      icon: Bed,
      description: 'Room assignments',
      color: 'bg-green-500',
      activeColor: 'bg-green-600 text-white border-green-600 shadow-lg',
      notifications: 3
    },
    {
      value: 'blocks',
      label: 'Room Blocks',
      icon: Building2,
      description: 'Group bookings',
      color: 'bg-purple-500',
      activeColor: 'bg-purple-600 text-white border-purple-600 shadow-lg',
      notifications: 2
    },
    {
      value: 'reservations',
      label: 'Reservations',
      icon: Calendar,
      description: 'Advanced management',
      color: 'bg-orange-500',
      activeColor: 'bg-orange-600 text-white border-orange-600 shadow-lg',
      notifications: 5
    },
    {
      value: 'rules',
      label: 'Assignment Rules',
      icon: Settings,
      description: 'Auto assignment',
      color: 'bg-gray-500',
      activeColor: 'bg-gray-600 text-white border-gray-600 shadow-lg',
      notifications: 0
    },
    {
      value: 'waitlist',
      label: 'Waitlist',
      icon: Users,
      description: 'Guest queue',
      color: 'bg-red-500',
      activeColor: 'bg-red-600 text-white border-red-600 shadow-lg',
      notifications: 1
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tape Chart Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Professional hotel room management dashboard
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="w-4 h-4" />
              <span>Live Updates</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Enhanced Tab Navigation */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 lg:px-6 py-4">
            {/* Mobile responsive tabs with horizontal scroll */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 md:grid md:grid-cols-6 md:gap-0">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`
                      relative flex flex-col items-center justify-center p-3 sm:p-4 text-xs sm:text-sm
                      transition-all duration-300 ease-in-out rounded-md border-2 border-transparent
                      min-w-[120px] md:min-w-0 whitespace-nowrap
                      hover:bg-gray-100 hover:shadow-md
                      ${isActive 
                        ? '!bg-blue-100 !text-blue-800 border-blue-200 shadow-lg transform scale-105 font-semibold' 
                        : '!text-gray-800 hover:!text-gray-900 !bg-white hover:!bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center mb-1 relative">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? '!text-blue-800' : '!text-gray-600'}`} />
                      {tab.notifications > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center animate-pulse"
                        >
                          {tab.notifications}
                        </Badge>
                      )}
                    </div>
                    <span className={`font-medium text-center leading-tight ${isActive ? '!text-blue-800' : '!text-gray-800'}`}>{tab.label}</span>
                    <span className={`text-xs mt-1 ${isActive ? '!text-blue-700' : '!text-gray-500'}`}>
                      {tab.description}
                    </span>
                  </TabsTrigger>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enhanced Tab Content with smooth transitions */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="dashboard" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <TapeChartDashboard />
            </div>
          </TabsContent>

          <TabsContent value="tapechart" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <Card className="m-4 lg:m-6 border-0 shadow-lg">
                <CardContent className="p-0">
                  <TapeChartView />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="blocks" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <Card className="m-4 lg:m-6 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Room Block Management</h2>
                    <Badge variant="secondary" className="ml-auto">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <RoomBlocks />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <Card className="m-4 lg:m-6 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Advanced Reservations</h2>
                    <Badge variant="default" className="ml-auto bg-orange-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      5 Pending
                    </Badge>
                  </div>
                  <AdvancedReservations />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <Card className="m-4 lg:m-6 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Assignment Rules & Automation</h2>
                    <Badge variant="outline" className="ml-auto">
                      <Settings className="w-3 h-3 mr-1" />
                      Auto-Assign
                    </Badge>
                  </div>
                  <AssignmentRules />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="waitlist" className="m-0 h-full">
            <div className="animate-in fade-in-50 duration-300">
              <Card className="m-4 lg:m-6 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900">Guest Waitlist Management</h2>
                    <Badge variant="destructive" className="ml-auto">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      1 Urgent
                    </Badge>
                  </div>
                  <WaitingListManager />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminTapeChart;