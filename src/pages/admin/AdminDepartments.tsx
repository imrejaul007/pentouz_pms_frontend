import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Menu,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Analytics as AnalyticsIcon,
  Hierarchy as HierarchyIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CloneIcon,
  Assignment as AssignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import DepartmentTree from '../../components/departments/DepartmentTree';
import DepartmentMetrics from '../../components/departments/DepartmentMetrics';
import { departmentsApi } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`departments-tabpanel-${index}`}
      aria-labelledby={`departments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  departmentType: string;
  parentDepartment?: {
    _id: string;
    name: string;
    code: string;
  };
  level: number;
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  staffing: {
    headOfDepartment?: {
      _id: string;
      name: string;
      email: string;
    };
    totalPositions: number;
    currentStaff: number;
  };
  analytics: {
    totalTasks: number;
    completedTasks: number;
    efficiency: number;
    totalRevenue: number;
    totalExpenses: number;
  };
  isOperational: boolean;
  isRevenueCenter: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentSummary {
  statusSummary: Array<{
    _id: string;
    count: number;
    totalStaff: number;
    totalPositions: number;
    avgEfficiency: number;
  }>;
  typeSummary: Array<{
    _id: string;
    count: number;
    totalStaff: number;
  }>;
  generatedAt: string;
}

const AdminDepartments: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [summary, setSummary] = useState<DepartmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    departmentType: 'other',
    parentDepartment: '',
    isOperational: true,
    isRevenueCenter: false
  });

  const departmentTypes = [
    { value: 'front_office', label: 'Front Office' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'food_beverage', label: 'Food & Beverage' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'security', label: 'Security' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' },
    { value: 'spa_wellness', label: 'Spa & Wellness' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'business_center', label: 'Business Center' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [departmentsResponse, hierarchyResponse, summaryResponse] = await Promise.all([
        departmentsApi.getDepartments({ populate: true }),
        departmentsApi.getDepartmentHierarchy(),
        departmentsApi.getDepartmentSummary()
      ]);

      setDepartments(departmentsResponse.data.departments);
      setHierarchy(hierarchyResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description,
      departmentType: department.departmentType,
      parentDepartment: department.parentDepartment?._id || '',
      isOperational: department.isOperational,
      isRevenueCenter: department.isRevenueCenter
    });
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (window.confirm(`Are you sure you want to delete "${department.name}"?`)) {
      try {
        await departmentsApi.deleteDepartment(department._id);
        await loadData();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
    setMenuAnchor(null);
  };

  const handleCloneDepartment = async (department: Department) => {
    const newName = prompt(`Clone "${department.name}" as:`, `${department.name} (Copy)`);
    const newCode = prompt('Enter new department code:', `${department.code}_COPY`);
    
    if (newName && newCode) {
      try {
        await departmentsApi.cloneDepartment(department._id, { newName, newCode });
        await loadData();
      } catch (error) {
        console.error('Error cloning department:', error);
      }
    }
    setMenuAnchor(null);
  };

  const handleSaveDepartment = async () => {
    try {
      if (editingDepartment) {
        await departmentsApi.updateDepartment(editingDepartment._id, formData);
      } else {
        await departmentsApi.createDepartment(formData);
      }

      await loadData();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving department:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      departmentType: 'other',
      parentDepartment: '',
      isOperational: true,
      isRevenueCenter: false
    });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, department: Department) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDepartment(department);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDepartment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  const getDepartmentTypeLabel = (type: string) => {
    const typeObj = departmentTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin">Admin</Link>
          <Typography color="text.primary">Department Management</Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Department Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDepartment}
          >
            Create Department
          </Button>
        </Box>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <BusinessIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {departments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Departments</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <GroupIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {departments.filter(d => d.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">Active Departments</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AssignIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {summary.statusSummary.reduce((acc, s) => acc + s.totalStaff, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Staff</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AnalyticsIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {(summary.statusSummary.reduce((acc, s) => acc + s.avgEfficiency, 0) / summary.statusSummary.length).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">Avg Efficiency</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab icon={<BusinessIcon />} label="Departments List" />
            <Tab icon={<HierarchyIcon />} label="Hierarchy View" />
            <Tab icon={<AnalyticsIcon />} label="Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          {/* Departments List */}
          <Grid container spacing={2}>
            {departments.map((department) => (
              <Grid item xs={12} sm={6} md={4} key={department._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {department.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {department.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getDepartmentTypeLabel(department.departmentType)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={department.status} 
                          color={getStatusColor(department.status)} 
                          size="small" 
                        />
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuClick(e, department)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" paragraph>
                      {department.description}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="primary">
                          {department.staffing.currentStaff}
                        </Typography>
                        <Typography variant="caption">Staff</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="h6" color="success.main">
                          {department.analytics.efficiency.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption">Efficiency</Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="h6" color="info.main">
                          {department.level}
                        </Typography>
                        <Typography variant="caption">Level</Typography>
                      </Box>
                    </Box>

                    {department.parentDepartment && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Parent: {department.parentDepartment.name}
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      {department.isOperational && (
                        <Chip label="Operational" color="success" size="small" />
                      )}
                      {department.isRevenueCenter && (
                        <Chip label="Revenue Center" color="info" size="small" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <DepartmentTree 
            hierarchy={hierarchy} 
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <DepartmentMetrics 
            departments={departments}
            summary={summary}
          />
        </TabPanel>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditDepartment(selectedDepartment!)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Department
        </MenuItem>
        <MenuItem onClick={() => handleCloneDepartment(selectedDepartment!)}>
          <CloneIcon fontSize="small" sx={{ mr: 1 }} />
          Clone Department
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => handleDeleteDepartment(selectedDepartment!)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Department
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Department' : 'Create Department'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                fullWidth
                required
                placeholder="e.g., FRONT_DESK"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Department Type</InputLabel>
                <Select
                  value={formData.departmentType}
                  onChange={(e) => setFormData({ ...formData, departmentType: e.target.value })}
                  label="Department Type"
                >
                  {departmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Parent Department</InputLabel>
                <Select
                  value={formData.parentDepartment}
                  onChange={(e) => setFormData({ ...formData, parentDepartment: e.target.value })}
                  label="Parent Department"
                >
                  <MenuItem value="">None</MenuItem>
                  {departments
                    .filter(d => d._id !== editingDepartment?._id)
                    .map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOperational}
                    onChange={(e) => setFormData({ ...formData, isOperational: e.target.checked })}
                  />
                }
                label="Operational Department"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRevenueCenter}
                    onChange={(e) => setFormData({ ...formData, isRevenueCenter: e.target.checked })}
                  />
                }
                label="Revenue Center"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained">
            {editingDepartment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDepartments;