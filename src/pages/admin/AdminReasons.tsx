import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
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
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  Divider,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  TrendingUp as AnalyticsIcon,
  ContentCopy as CloneIcon,
  PowerSettingsNew as StatusIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { reasonService, Reason } from '../../services/reasonService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`reasons-tabpanel-${index}`}
    aria-labelledby={`reasons-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const AdminReasons: React.FC = () => {
  const [reasons, setReasons] = useState<Reason[]>([]);
  const [filteredReasons, setFilteredReasons] = useState<Reason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    subcategory: '',
    isActive: true,
    requiresApproval: false,
    requiresManagerApproval: false,
    requiresComments: false,
    requiresDocumentation: false,
    allowsRefund: false,
    maxRefundPercentage: 0,
    allowsDiscount: false,
    maxDiscountPercentage: 0,
    allowsComp: false,
    hasFinancialImpact: false,
    autoApply: false,
    notifyGuest: true,
    notifyManagement: false,
    createTask: false,
    canUseAfterCheckIn: true,
    canUseAfterCheckOut: false,
    canUseBeforeArrival: true,
    hoursBeforeArrival: 24,
    hoursAfterCheckOut: 0,
    allowedRoles: [] as string[],
    restrictedRoles: [] as string[],
    applicableDepartments: [] as string[],
    priority: 'medium'
  });

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReason, setMenuReason] = useState<Reason | null>(null);

  const categories = [
    'cancellation', 'no_show', 'modification', 'discount', 'comp', 'refund',
    'upgrade', 'downgrade', 'early_checkout', 'late_checkout', 'damage',
    'complaint', 'maintenance', 'overbooking', 'group_booking', 'vip',
    'loyalty', 'package', 'seasonal', 'promotional', 'operational', 'other'
  ];

  const roles = [
    'admin', 'manager', 'supervisor', 'front_desk', 'housekeeping', 'maintenance', 'guest_services'
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    loadReasons();
  }, []);

  useEffect(() => {
    filterReasons();
  }, [reasons, searchTerm, categoryFilter, statusFilter]);

  const loadReasons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reasonService.getReasons();
      setReasons(response.data.reasons || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reasons');
    } finally {
      setLoading(false);
    }
  };

  const filterReasons = () => {
    let filtered = reasons;

    if (searchTerm) {
      filtered = filtered.filter(reason =>
        reason.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reason.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(reason => reason.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(reason => reason.isActive === isActive);
    }

    setFilteredReasons(filtered);
  };

  const handleCreateReason = async () => {
    try {
      await reasonService.createReason(formData);
      setCreateDialogOpen(false);
      resetForm();
      loadReasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reason');
    }
  };

  const handleUpdateReason = async () => {
    if (!selectedReason) return;

    try {
      await reasonService.updateReason(selectedReason._id, formData);
      setEditDialogOpen(false);
      resetForm();
      loadReasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update reason');
    }
  };

  const handleDeleteReason = async () => {
    if (!selectedReason) return;

    try {
      await reasonService.deleteReason(selectedReason._id);
      setDeleteDialogOpen(false);
      setSelectedReason(null);
      loadReasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete reason');
    }
  };

  const handleCloneReason = async () => {
    if (!selectedReason) return;

    try {
      await reasonService.cloneReason(selectedReason._id, formData.name, formData.code);
      setCloneDialogOpen(false);
      resetForm();
      loadReasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clone reason');
    }
  };

  const handleToggleStatus = async (reason: Reason) => {
    try {
      await reasonService.updateReasonStatus(reason._id, !reason.isActive);
      loadReasons();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: '',
      subcategory: '',
      isActive: true,
      requiresApproval: false,
      requiresManagerApproval: false,
      requiresComments: false,
      requiresDocumentation: false,
      allowsRefund: false,
      maxRefundPercentage: 0,
      allowsDiscount: false,
      maxDiscountPercentage: 0,
      allowsComp: false,
      hasFinancialImpact: false,
      autoApply: false,
      notifyGuest: true,
      notifyManagement: false,
      createTask: false,
      canUseAfterCheckIn: true,
      canUseAfterCheckOut: false,
      canUseBeforeArrival: true,
      hoursBeforeArrival: 24,
      hoursAfterCheckOut: 0,
      allowedRoles: [],
      restrictedRoles: [],
      applicableDepartments: [],
      priority: 'medium'
    });
  };

  const openEditDialog = (reason: Reason) => {
    setSelectedReason(reason);
    setFormData({
      name: reason.name,
      code: reason.code,
      description: reason.description || '',
      category: reason.category,
      subcategory: reason.subcategory || '',
      isActive: reason.isActive,
      requiresApproval: reason.requiresApproval,
      requiresManagerApproval: reason.requiresManagerApproval,
      requiresComments: reason.requiresComments,
      requiresDocumentation: reason.requiresDocumentation,
      allowsRefund: reason.allowsRefund,
      maxRefundPercentage: reason.maxRefundPercentage,
      allowsDiscount: reason.allowsDiscount,
      maxDiscountPercentage: reason.maxDiscountPercentage,
      allowsComp: reason.allowsComp,
      hasFinancialImpact: reason.hasFinancialImpact,
      autoApply: reason.autoApply,
      notifyGuest: reason.notifyGuest,
      notifyManagement: reason.notifyManagement,
      createTask: reason.createTask,
      canUseAfterCheckIn: reason.canUseAfterCheckIn,
      canUseAfterCheckOut: reason.canUseAfterCheckOut,
      canUseBeforeArrival: reason.canUseBeforeArrival,
      hoursBeforeArrival: reason.hoursBeforeArrival,
      hoursAfterCheckOut: reason.hoursAfterCheckOut,
      allowedRoles: reason.allowedRoles,
      restrictedRoles: reason.restrictedRoles,
      applicableDepartments: reason.applicableDepartments?.map(dept => dept._id || dept) || [],
      priority: reason.priority
    });
    setEditDialogOpen(true);
  };

  const openCloneDialog = (reason: Reason) => {
    setSelectedReason(reason);
    setFormData({
      ...formData,
      name: `${reason.name} (Copy)`,
      code: `${reason.code}_COPY`
    });
    setCloneDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reason: Reason) => {
    setAnchorEl(event.currentTarget);
    setMenuReason(reason);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReason(null);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 120 },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value.replace('_', ' ')} 
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    { 
      field: 'isActive', 
      headerName: 'Status', 
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      )
    },
    { 
      field: 'usage.totalUsed', 
      headerName: 'Usage', 
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.usage?.totalUsed || 0}
        </Typography>
      )
    },
    { 
      field: 'hasFinancialImpact', 
      headerName: 'Financial Impact', 
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Chip label="Yes" size="small" color="warning" />
        ) : (
          <Chip label="No" size="small" color="default" />
        )
      )
    },
    { 
      field: 'requiresApproval', 
      headerName: 'Approval', 
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Chip label="Required" size="small" color="error" />
        ) : (
          <Chip label="Optional" size="small" color="success" />
        )
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row)}
        >
          <MoreVertIcon />
        </IconButton>
      )
    }
  ];

  const getSummaryCards = () => {
    const total = reasons.length;
    const active = reasons.filter(r => r.isActive).length;
    const withFinancialImpact = reasons.filter(r => r.hasFinancialImpact).length;
    const requiresApproval = reasons.filter(r => r.requiresApproval).length;

    return [
      { label: 'Total Reasons', value: total, color: 'primary' },
      { label: 'Active', value: active, color: 'success' },
      { label: 'Financial Impact', value: withFinancialImpact, color: 'warning' },
      { label: 'Requires Approval', value: requiresApproval, color: 'error' }
    ];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reason Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Reason
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {getSummaryCards().map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={`${card.color}.main`}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search reasons..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => reasonService.exportReasons('csv')}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Card>
        <CardContent>
          <DataGrid
            rows={filteredReasons}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            autoHeight
            disableSelectionOnClick
            getRowId={(row) => row._id}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => { openEditDialog(menuReason!); handleMenuClose(); }}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItemComponent>
        <MenuItemComponent onClick={() => { openCloneDialog(menuReason!); handleMenuClose(); }}>
          <CloneIcon sx={{ mr: 1 }} /> Clone
        </MenuItemComponent>
        <MenuItemComponent onClick={() => { handleToggleStatus(menuReason!); handleMenuClose(); }}>
          <StatusIcon sx={{ mr: 1 }} /> 
          {menuReason?.isActive ? 'Deactivate' : 'Activate'}
        </MenuItemComponent>
        <Divider />
        <MenuItemComponent 
          onClick={() => { setSelectedReason(menuReason); setDeleteDialogOpen(true); handleMenuClose(); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItemComponent>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={createDialogOpen || editDialogOpen} 
        onClose={() => { setCreateDialogOpen(false); setEditDialogOpen(false); resetForm(); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {createDialogOpen ? 'Create New Reason' : 'Edit Reason'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Tabs value={0} onChange={() => {}}>
              <Tab label="Basic Information" />
              <Tab label="Permissions & Rules" />
              <Tab label="Financial Settings" />
              <Tab label="Workflow Settings" />
            </Tabs>
            
            <TabPanel value={0} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reason Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reason Code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>
                          {category.replace('_', ' ').toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      label="Priority"
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {priorities.map(priority => (
                        <MenuItem key={priority} value={priority}>
                          {priority.toUpperCase()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button 
            onClick={createDialogOpen ? handleCreateReason : handleUpdateReason}
            variant="contained"
          >
            {createDialogOpen ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onClose={() => { setCloneDialogOpen(false); resetForm(); }}>
        <DialogTitle>Clone Reason</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCloneDialogOpen(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleCloneReason} variant="contained">Clone</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Reason</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedReason?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteReason} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReasons;