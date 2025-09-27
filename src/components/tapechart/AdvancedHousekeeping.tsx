import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/utils/toast';
import {
  Bed, CheckCircle, Clock, Camera, AlertTriangle, Wrench,
  User, MapPin, Star, Timer, Package, ClipboardCheck,
  Settings, Eye, RefreshCw, Award, Zap, Phone
} from 'lucide-react';
import { format, addHours } from 'date-fns';

// Advanced Housekeeping Interfaces
interface InspectionTask {
  id: string;
  name: string;
  category: 'cleaning' | 'maintenance' | 'inventory' | 'amenity';
  required: boolean;
  completed: boolean;
  timeEstimate: number; // minutes
  notes?: string;
  photoRequired: boolean;
  photoTaken?: string;
}

interface RoomInspection {
  id: string;
  roomNumber: string;
  assignedStaff: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: string;
  completedTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  tasks: InspectionTask[];
  overallScore: number;
  issues: MaintenanceIssue[];
  inventory: InventoryItem[];
}

interface MaintenanceIssue {
  id: string;
  roomNumber: string;
  type: 'plumbing' | 'electrical' | 'hvac' | 'furniture' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  status: 'reported' | 'assigned' | 'in_progress' | 'completed';
  estimatedRepairTime?: number;
  photos: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'linens' | 'amenities' | 'supplies' | 'minibar';
  currentStock: number;
  requiredStock: number;
  restockNeeded: boolean;
  lastRestocked?: string;
}

interface StaffPerformance {
  staffId: string;
  name: string;
  role: 'housekeeper' | 'supervisor' | 'maintenance';
  roomsCompleted: number;
  avgCleaningTime: number;
  qualityScore: number;
  efficiency: number;
  issuesReported: number;
}

interface AdvancedHousekeepingProps {}

export const AdvancedHousekeeping: React.FC<AdvancedHousekeepingProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('inspections');
  const [roomInspections, setRoomInspections] = useState<RoomInspection[]>([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateMockInspections();
    generateMockMaintenanceIssues();
    generateMockStaffPerformance();
  }, []);

  const generateMockInspections = () => {
    const staffNames = ['Sarah Wilson', 'Mike Chen', 'Lisa Rodriguez', 'David Kim'];
    const roomNumbers = ['101', '102', '201', '202', '301', '302'];

    const inspectionTemplates: InspectionTask[] = [
      { id: 'task-1', name: 'Make beds with fresh linens', category: 'cleaning', required: true, completed: false, timeEstimate: 5, photoRequired: false },
      { id: 'task-2', name: 'Clean bathroom thoroughly', category: 'cleaning', required: true, completed: false, timeEstimate: 15, photoRequired: true },
      { id: 'task-3', name: 'Vacuum carpets and floors', category: 'cleaning', required: true, completed: false, timeEstimate: 10, photoRequired: false },
      { id: 'task-4', name: 'Dust all surfaces', category: 'cleaning', required: true, completed: false, timeEstimate: 8, photoRequired: false },
      { id: 'task-5', name: 'Restock minibar', category: 'inventory', required: true, completed: false, timeEstimate: 5, photoRequired: false },
      { id: 'task-6', name: 'Check AC/heating functionality', category: 'maintenance', required: true, completed: false, timeEstimate: 3, photoRequired: false },
      { id: 'task-7', name: 'Replace towels and amenities', category: 'amenity', required: true, completed: false, timeEstimate: 5, photoRequired: false },
      { id: 'task-8', name: 'Test all electrical fixtures', category: 'maintenance', required: false, completed: false, timeEstimate: 5, photoRequired: false }
    ];

    const inspections: RoomInspection[] = roomNumbers.map((room, index) => {
      const staff = staffNames[index % staffNames.length];
      const status = ['pending', 'in_progress', 'completed', 'failed'][Math.floor(Math.random() * 4)] as any;
      const startTime = status !== 'pending' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined;
      const estimatedDuration = 45 + Math.floor(Math.random() * 30);
      const actualDuration = status === 'completed' ? estimatedDuration + Math.floor(Math.random() * 20) - 10 : undefined;

      const tasks = inspectionTemplates.map(task => ({
        ...task,
        id: `${task.id}-${room}`,
        completed: status === 'completed' ? Math.random() > 0.1 : Math.random() > 0.7,
        photoTaken: task.photoRequired && Math.random() > 0.5 ? `photo-${task.id}-${room}.jpg` : undefined
      }));

      return {
        id: `inspection-${room}`,
        roomNumber: room,
        assignedStaff: staff,
        status,
        startTime,
        completedTime: status === 'completed' ? addHours(new Date(startTime!), 1).toISOString() : undefined,
        estimatedDuration,
        actualDuration,
        tasks,
        overallScore: Math.round(85 + Math.random() * 15),
        issues: [],
        inventory: [
          { id: `inv-1-${room}`, name: 'Towels', category: 'linens', currentStock: 4, requiredStock: 4, restockNeeded: false },
          { id: `inv-2-${room}`, name: 'Shampoo', category: 'amenities', currentStock: 2, requiredStock: 3, restockNeeded: true },
          { id: `inv-3-${room}`, name: 'Coffee pods', category: 'minibar', currentStock: 6, requiredStock: 8, restockNeeded: true }
        ]
      };
    });

    setRoomInspections(inspections);
  };

  const generateMockMaintenanceIssues = () => {
    const issues: MaintenanceIssue[] = [
      {
        id: 'maint-001',
        roomNumber: '205',
        type: 'plumbing',
        priority: 'high',
        description: 'Bathroom faucet leaking',
        reportedBy: 'Sarah Wilson',
        reportedAt: new Date(Date.now() - 7200000).toISOString(),
        assignedTo: 'Mike Maintenance',
        status: 'in_progress',
        estimatedRepairTime: 60,
        photos: ['leak-photo-1.jpg', 'leak-photo-2.jpg']
      },
      {
        id: 'maint-002',
        roomNumber: '301',
        type: 'electrical',
        priority: 'medium',
        description: 'Bedside lamp not working',
        reportedBy: 'Lisa Rodriguez',
        reportedAt: new Date(Date.now() - 3600000).toISOString(),
        status: 'assigned',
        assignedTo: 'John Electrician',
        estimatedRepairTime: 30,
        photos: ['lamp-issue.jpg']
      },
      {
        id: 'maint-003',
        roomNumber: '102',
        type: 'hvac',
        priority: 'urgent',
        description: 'AC not cooling properly',
        reportedBy: 'David Kim',
        reportedAt: new Date(Date.now() - 1800000).toISOString(),
        status: 'reported',
        estimatedRepairTime: 120,
        photos: []
      }
    ];

    setMaintenanceIssues(issues);
  };

  const generateMockStaffPerformance = () => {
    const staff: StaffPerformance[] = [
      {
        staffId: 'staff-001',
        name: 'Sarah Wilson',
        role: 'housekeeper',
        roomsCompleted: 12,
        avgCleaningTime: 42,
        qualityScore: 94,
        efficiency: 87,
        issuesReported: 3
      },
      {
        staffId: 'staff-002',
        name: 'Mike Chen',
        role: 'housekeeper',
        roomsCompleted: 15,
        avgCleaningTime: 38,
        qualityScore: 91,
        efficiency: 92,
        issuesReported: 2
      },
      {
        staffId: 'staff-003',
        name: 'Lisa Rodriguez',
        role: 'supervisor',
        roomsCompleted: 8,
        avgCleaningTime: 35,
        qualityScore: 96,
        efficiency: 89,
        issuesReported: 5
      }
    ];

    setStaffPerformance(staff);
  };

  const handleCompleteTask = (inspectionId: string, taskId: string) => {
    setRoomInspections(prev => prev.map(inspection =>
      inspection.id === inspectionId ? {
        ...inspection,
        tasks: inspection.tasks.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      } : inspection
    ));
  };

  const handleStartInspection = async (inspectionId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setRoomInspections(prev => prev.map(inspection =>
        inspection.id === inspectionId ? {
          ...inspection,
          status: 'in_progress',
          startTime: new Date().toISOString()
        } : inspection
      ));

      toast.success('Room inspection started');
    } catch (error) {
      toast.error('Failed to start inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteInspection = async (inspectionId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setRoomInspections(prev => prev.map(inspection =>
        inspection.id === inspectionId ? {
          ...inspection,
          status: 'completed',
          completedTime: new Date().toISOString(),
          actualDuration: Math.floor(Math.random() * 20) + inspection.estimatedDuration
        } : inspection
      ));

      toast.success('Room inspection completed successfully');
    } catch (error) {
      toast.error('Failed to complete inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = (roomNumber: string) => {
    toast.success(`Maintenance issue reporting form opened for room ${roomNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'plumbing': return <Wrench className="h-4 w-4 text-blue-600" />;
      case 'electrical': return <Zap className="h-4 w-4 text-yellow-600" />;
      case 'hvac': return <Settings className="h-4 w-4 text-purple-600" />;
      case 'furniture': return <Bed className="h-4 w-4 text-brown-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
        >
          <ClipboardCheck className="h-4 w-4 mr-2 text-blue-600" />
          Housekeeping+
          <Badge
            variant="secondary"
            className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
          >
            Pro
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            Advanced Housekeeping & Maintenance
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              Smart Workflows
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Comprehensive inspection workflows, maintenance tracking, and staff performance management
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inspections" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Inspections
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {roomInspections.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-green-600">Completed Today</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">
                    {roomInspections.filter(r => r.status === 'in_progress').length}
                  </p>
                  <p className="text-sm text-blue-600">In Progress</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <Timer className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">
                    {Math.round(roomInspections.reduce((acc, r) => acc + (r.actualDuration || r.estimatedDuration), 0) / roomInspections.length)}
                  </p>
                  <p className="text-sm text-yellow-600">Avg Time (min)</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {Math.round(roomInspections.reduce((acc, r) => acc + r.overallScore, 0) / roomInspections.length)}%
                  </p>
                  <p className="text-sm text-purple-600">Quality Score</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {roomInspections.map((inspection) => (
                <Card key={inspection.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Bed className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Room {inspection.roomNumber}</h4>
                          <p className="text-sm text-gray-600">Assigned to {inspection.assignedStaff}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(inspection.status)}>
                              {inspection.status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Est: {inspection.estimatedDuration} min
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(inspection.tasks.filter(t => t.completed).length / inspection.tasks.length) * 100}
                              className="w-20 h-2"
                            />
                            <span className="text-sm font-medium">
                              {inspection.tasks.filter(t => t.completed).length}/{inspection.tasks.length}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Tasks completed</p>
                        </div>

                        <div className="flex gap-2">
                          {inspection.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartInspection(inspection.id)}
                              disabled={loading}
                            >
                              <Timer className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {inspection.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteInspection(inspection.id)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReportIssue(inspection.roomNumber)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Report Issue
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm mb-2">Inspection Tasks</h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {inspection.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleCompleteTask(inspection.id, task.id)}
                                disabled={inspection.status === 'completed'}
                              />
                              <div className="flex-1">
                                <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                  {task.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {task.category}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{task.timeEstimate}min</span>
                                  {task.photoRequired && (
                                    <Camera className="h-3 w-3 text-blue-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-sm mb-2">Room Inventory</h5>
                        <div className="space-y-2">
                          {inspection.inventory.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.category}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-medium ${
                                  item.restockNeeded ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {item.currentStock}/{item.requiredStock}
                                </span>
                                {item.restockNeeded && (
                                  <Badge className="ml-2 text-xs bg-red-100 text-red-700">
                                    Restock
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Maintenance Issues</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700">
                  {maintenanceIssues.filter(i => i.priority === 'urgent').length} Urgent
                </Badge>
                <Badge className="bg-orange-100 text-orange-700">
                  {maintenanceIssues.filter(i => i.priority === 'high').length} High
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {maintenanceIssues.map((issue) => (
                <Card key={issue.id} className={`transition-all hover:shadow-md border-l-4 ${
                  issue.priority === 'urgent' ? 'border-l-red-500' :
                  issue.priority === 'high' ? 'border-l-orange-500' :
                  issue.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getTypeIcon(issue.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">Room {issue.roomNumber}</h4>
                          <p className="text-sm text-gray-600">{issue.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getPriorityColor(issue.priority)}>
                              {issue.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">Reported by</p>
                        <p className="font-medium">{issue.reportedBy}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(issue.reportedAt), 'MMM dd, HH:mm')}
                        </p>
                        {issue.estimatedRepairTime && (
                          <p className="text-xs text-blue-600 mt-1">
                            Est: {issue.estimatedRepairTime} min
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {issue.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-500" />
                            <span className="text-sm text-gray-600">Assigned to {issue.assignedTo}</span>
                          </div>
                        )}
                        {issue.photos.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3 text-blue-500" />
                            <span className="text-sm text-blue-600">{issue.photos.length} photos</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inventory Management</h3>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500">
                <Package className="h-4 w-4 mr-2" />
                Generate Restock Report
              </Button>
            </div>

            <div className="grid gap-4">
              {roomInspections.map((inspection) => (
                <Card key={`inv-${inspection.id}`} className="transition-all hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Room {inspection.roomNumber} Inventory</h4>
                      <Badge variant="outline">
                        {inspection.inventory.filter(i => i.restockNeeded).length} items need restock
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {inspection.inventory.map((item) => (
                        <div key={item.id} className={`p-3 rounded-lg border ${
                          item.restockNeeded ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold ${
                                item.restockNeeded ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {item.currentStock}/{item.requiredStock}
                              </span>
                              {item.restockNeeded && (
                                <p className="text-xs text-red-600 mt-1">Restock needed</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Staff Performance Analytics</h3>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Metrics
              </Button>
            </div>

            <div className="grid gap-4">
              {staffPerformance.map((staff) => (
                <Card key={staff.staffId} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{staff.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {staff.role}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {staff.roomsCompleted} rooms completed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Avg Time</p>
                          <p className="font-bold text-blue-600">{staff.avgCleaningTime}min</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quality</p>
                          <p className="font-bold text-green-600">{staff.qualityScore}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Efficiency</p>
                          <p className="font-bold text-purple-600">{staff.efficiency}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Issues</p>
                          <p className="font-bold text-orange-600">{staff.issuesReported}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                        <Progress value={staff.qualityScore} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Efficiency</p>
                        <Progress value={staff.efficiency} className="h-2" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Overall Performance</p>
                        <Progress value={(staff.qualityScore + staff.efficiency) / 2} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};