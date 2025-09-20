import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Building, Plus, Edit, Trash2, Users, Home, BarChart3, MapPin, Settings } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import HotelAreaForm from '../../components/admin/HotelAreaForm';
import HotelLayoutVisualizer from '../../components/admin/HotelLayoutVisualizer';

interface HotelArea {
  _id: string;
  areaName: string;
  areaCode: string;
  areaType: string;
  status: string;
  totalRooms: number;
  availableRooms: number;
  hierarchyLevel: number;
  fullPath: string;
  parentAreaId?: {
    _id: string;
    areaName: string;
    areaCode: string;
  };
  assignedStaff: Array<{
    staffId: {
      firstName: string;
      lastName: string;
      role: string;
    };
    role: string;
    shift: string;
    isActive: boolean;
  }>;
  statistics: {
    averageOccupancy: number;
    averageRate: number;
    totalRevenue: number;
    guestSatisfactionScore: number;
    maintenanceRequestCount: number;
  };
  displaySettings: {
    color: string;
    icon: string;
    displayOrder: number;
    showInPublicAreas: boolean;
  };
  auditInfo: {
    createdBy: {
      firstName: string;
      lastName: string;
    };
    createdAt: string;
    updatedAt: string;
  };
}

interface AreaSummary {
  totalAreas: number;
  activeAreas: number;
  totalRooms: number;
  availableRooms: number;
  averageOccupancy: number;
  totalRevenue: number;
  maintenanceRequests: number;
}

const AdminHotelAreas: React.FC = () => {
  const [areas, setAreas] = useState<HotelArea[]>([]);
  const [summary, setSummary] = useState<AreaSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [editingArea, setEditingArea] = useState<HotelArea | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    areaType: '',
    status: '',
    parentAreaId: '',
    sortBy: 'displaySettings.displayOrder',
    sortOrder: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const areaTypes = [
    { value: 'building', label: 'Building', icon: Building },
    { value: 'wing', label: 'Wing', icon: Home },
    { value: 'floor', label: 'Floor', icon: Home },
    { value: 'section', label: 'Section', icon: MapPin },
    { value: 'block', label: 'Block', icon: Building },
    { value: 'tower', label: 'Tower', icon: Building },
    { value: 'annex', label: 'Annex', icon: Building },
    { value: 'pavilion', label: 'Pavilion', icon: Building }
  ];

  const statusTypes = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'under_renovation', label: 'Under Renovation', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'under_construction', label: 'Under Construction', color: 'bg-blue-100 text-blue-800' },
    { value: 'closed', label: 'Closed', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchAreas();
    fetchAreaStatistics();
  }, [filters, currentPage, showHierarchy]);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        includeStats: 'true',
        includeHierarchy: showHierarchy.toString(),
        ...filters
      });

      const response = await fetch(`/api/v1/hotel-areas/${localStorage.getItem('hotelId')}/areas?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAreas(data.data.areas);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching hotel areas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaStatistics = async () => {
    try {
      const response = await fetch(`/api/v1/hotel-areas/${localStorage.getItem('hotelId')}/areas/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching area statistics:', error);
    }
  };

  const handleCreateArea = () => {
    setEditingArea(null);
    setShowForm(true);
  };

  const handleEditArea = (area: HotelArea) => {
    setEditingArea(area);
    setShowForm(true);
  };

  const handleDeleteArea = async (areaId: string) => {
    if (window.confirm('Are you sure you want to delete this area? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/v1/hotel-areas/areas/${areaId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchAreas();
        }
      } catch (error) {
        console.error('Error deleting area:', error);
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedAreas.length === 0) return;

    try {
      const response = await fetch(`/api/v1/hotel-areas/${localStorage.getItem('hotelId')}/areas/bulk-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          areaIds: selectedAreas,
          status
        })
      });

      if (response.ok) {
        setSelectedAreas([]);
        fetchAreas();
      }
    } catch (error) {
      console.error('Error updating areas:', error);
    }
  };

  const getAreaTypeIcon = (type: string) => {
    const areaType = areaTypes.find(t => t.value === type);
    return areaType ? areaType.icon : Building;
  };

  const getStatusColor = (status: string) => {
    const statusType = statusTypes.find(s => s.value === status);
    return statusType ? statusType.color : 'bg-gray-100 text-gray-800';
  };

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return 'text-red-600';
    if (occupancy >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculateOccupancyRate = (area: HotelArea) => {
    return area.totalRooms > 0 ? ((area.totalRooms - area.availableRooms) / area.totalRooms) * 100 : 0;
  };

  const renderHierarchyTree = (areas: HotelArea[], level = 0) => {
    return areas.map((area) => (
      <div key={area._id} className={`ml-${level * 4}`}>
        <div className="flex items-center justify-between p-3 border rounded-md mb-2 bg-white shadow-sm">
          <div className="flex items-center space-x-3">
            {React.createElement(getAreaTypeIcon(area.areaType), { className: "w-5 h-5 text-blue-600" })}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{area.areaName}</span>
                <span className="text-sm text-gray-500">({area.areaCode})</span>
                <Badge className={getStatusColor(area.status)}>
                  {area.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {area.totalRooms} rooms • {calculateOccupancyRate(area).toFixed(1)}% occupied
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleEditArea(area)} variant="outline" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
            <Button onClick={() => handleDeleteArea(area._id)} variant="outline" size="sm" className="text-red-600 hover:text-red-800">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {(area as any).children && renderHierarchyTree((area as any).children, level + 1)}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Areas</h1>
          <p className="text-gray-600">Manage hotel physical areas and layout</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowVisualizer(true)} variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Layout View
          </Button>
          <Button onClick={() => setShowHierarchy(!showHierarchy)} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            {showHierarchy ? 'Table View' : 'Hierarchy View'}
          </Button>
          <Button onClick={handleCreateArea} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Area
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">{summary.totalAreas}</div>
                  <div className="text-sm text-gray-600">Total Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.activeAreas}</div>
                  <div className="text-sm text-gray-600">Active Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{summary.totalRooms}</div>
                  <div className="text-sm text-gray-600">Total Rooms</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {summary.averageOccupancy ? summary.averageOccupancy.toFixed(1) : '0'}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Occupancy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search areas..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select value={filters.areaType} onValueChange={(value) => setFilters({ ...filters, areaType: value })}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Area Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {areaTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {statusTypes.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAreas.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedAreas.length} area(s) selected
              </span>
              <div className="flex space-x-2">
                <Button onClick={() => handleBulkStatusUpdate('active')} variant="outline" size="sm">
                  Activate
                </Button>
                <Button onClick={() => handleBulkStatusUpdate('inactive')} variant="outline" size="sm">
                  Deactivate
                </Button>
                <Button onClick={() => handleBulkStatusUpdate('under_renovation')} variant="outline" size="sm">
                  Under Renovation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Areas Display */}
      <Card>
        <CardContent className="p-0">
          {showHierarchy ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Area Hierarchy</h3>
              {areas.length > 0 ? renderHierarchyTree(areas) : (
                <div className="text-center text-gray-500 py-8">
                  No areas found. Create your first area to get started.
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAreas(areas.map(a => a._id));
                        } else {
                          setSelectedAreas([]);
                        }
                      }}
                      checked={selectedAreas.length === areas.length && areas.length > 0}
                    />
                  </TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAreas([...selectedAreas, area._id]);
                          } else {
                            setSelectedAreas(selectedAreas.filter(id => id !== area._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {React.createElement(getAreaTypeIcon(area.areaType), { className: "w-5 h-5 text-blue-600" })}
                        <div>
                          <div className="font-medium">{area.areaName}</div>
                          <div className="text-sm text-gray-500">{area.areaCode}</div>
                          {area.fullPath && area.hierarchyLevel > 0 && (
                            <div className="text-xs text-gray-400">{area.fullPath}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(area.areaType)}>
                        {area.areaType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(area.status)}>
                        {area.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{area.totalRooms} total</div>
                        <div className="text-gray-500">{area.availableRooms} available</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm font-medium ${getOccupancyColor(calculateOccupancyRate(area))}`}>
                        {calculateOccupancyRate(area).toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {area.assignedStaff.filter(s => s.isActive).length} assigned
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        ${area.statistics?.totalRevenue?.toLocaleString() || '0'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          onClick={() => handleEditArea(area)} 
                          variant="ghost" 
                          size="sm"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteArea(area._id)} 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                          disabled={area.totalRooms > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!showHierarchy && totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <HotelAreaForm
          area={editingArea}
          onClose={() => {
            setShowForm(false);
            setEditingArea(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingArea(null);
            fetchAreas();
          }}
        />
      )}

      {showVisualizer && (
        <HotelLayoutVisualizer
          areas={areas}
          onClose={() => setShowVisualizer(false)}
          onAreaSelect={handleEditArea}
        />
      )}
    </div>
  );
};

export default AdminHotelAreas;