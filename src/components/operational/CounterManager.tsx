import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PowerSettingsNew,
  PowerOff,
  Build
} from '@mui/icons-material';
import { CounterForm } from './CounterForm';

interface Counter {
  _id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
  status: string;
  isActive: boolean;
  location: {
    floor?: number;
    room?: string;
  };
  capacity: {
    maxConcurrentUsers: number;
    maxDailyTransactions: number;
  };
  operatingHours: {
    startTime?: string;
    endTime?: string;
    workingDays?: string[];
  };
  features: {
    supportsCheckIn: boolean;
    supportsCheckOut: boolean;
    supportsPayment: boolean;
    supportsKeyIssuance: boolean;
    supportsGuestServices: boolean;
  };
  analytics: {
    totalTransactions: number;
    averageTransactionTime: number;
    lastUsed?: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const CounterManager: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const counterTypes = [
    'front_desk', 'concierge', 'housekeeping', 'maintenance', 'security', 
    'restaurant', 'spa', 'business_center', 'other'
  ];

  const statuses = ['available', 'busy', 'offline', 'maintenance'];

  useEffect(() => {
    fetchCounters();
  }, [typeFilter, statusFilter]);

  const fetchCounters = async () => {
    try {
      setLoading(true);
      // const response = await api.get(`/operational-management/counters?type=${typeFilter}&status=${statusFilter}`);
      // setCounters(response.data.counters);
      
      // Mock data for demonstration
      setCounters([
        {
          _id: '1',
          name: 'Main Reception',
          code: 'REC001',
          type: 'front_desk',
          description: 'Main reception counter for check-in/check-out',
          status: 'available',
          isActive: true,
          location: { floor: 1, room: 'Lobby' },
          capacity: { maxConcurrentUsers: 3, maxDailyTransactions: 500 },
          operatingHours: { startTime: '06:00', endTime: '22:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
          features: { supportsCheckIn: true, supportsCheckOut: true, supportsPayment: true, supportsKeyIssuance: true, supportsGuestServices: true },
          analytics: { totalTransactions: 1250, averageTransactionTime: 5.5, lastUsed: '2024-01-15T14:30:00Z' },
          createdBy: { name: 'Admin User', email: 'admin@hotel.com' },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          name: 'Concierge Desk',
          code: 'CON001',
          type: 'concierge',
          description: 'Concierge services counter',
          status: 'busy',
          isActive: true,
          location: { floor: 1, room: 'Lobby' },
          capacity: { maxConcurrentUsers: 2, maxDailyTransactions: 200 },
          operatingHours: { startTime: '07:00', endTime: '23:00', workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
          features: { supportsCheckIn: false, supportsCheckOut: false, supportsPayment: false, supportsKeyIssuance: false, supportsGuestServices: true },
          analytics: { totalTransactions: 450, averageTransactionTime: 8.2, lastUsed: '2024-01-15T15:45:00Z' },
          createdBy: { name: 'Admin User', email: 'admin@hotel.com' },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error fetching counters:', error);
      showSnackbar('Error fetching counters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setSelectedCounter(null);
    setShowForm(true);
  };

  const handleEdit = (counter: Counter) => {
    setSelectedCounter(counter);
    setShowForm(true);
  };

  const handleView = (counter: Counter) => {
    setSelectedCounter(counter);
    setShowViewDialog(true);
  };

  const handleStatusChange = async (counter: Counter, newStatus: string) => {
    try {
      // await api.patch(`/operational-management/counters/${counter._id}/status`, { status: newStatus });
      showSnackbar(`Counter status updated to ${newStatus}`, 'success');
      fetchCounters();
      onRefresh();
    } catch (error) {
      console.error('Error updating counter status:', error);
      showSnackbar('Error updating counter status', 'error');
    }
  };

  const handleDelete = async (counter: Counter) => {
    if (window.confirm(`Are you sure you want to delete "${counter.name}"?`)) {
      try {
        // await api.delete(`/operational-management/counters/${counter._id}`);
        showSnackbar('Counter deleted successfully', 'success');
        fetchCounters();
        onRefresh();
      } catch (error) {
        console.error('Error deleting counter:', error);
        showSnackbar('Error deleting counter', 'error');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCounter(null);
  };

  const handleFormSubmit = async (counterData: any) => {
    try {
      if (selectedCounter) {
        // await api.patch(`/operational-management/counters/${selectedCounter._id}`, counterData);
        showSnackbar('Counter updated successfully', 'success');
      } else {
        // await api.post('/operational-management/counters', counterData);
        showSnackbar('Counter created successfully', 'success');
      }
      handleFormClose();
      fetchCounters();
      onRefresh();
    } catch (error) {
      console.error('Error saving counter:', error);
      showSnackbar('Error saving counter', 'error');
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      front_desk: 'primary',
      concierge: 'secondary',
      housekeeping: 'success',
      maintenance: 'info',
      security: 'warning',
      restaurant: 'error',
      spa: 'default',
      business_center: 'primary',
      other: 'default'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      available: 'success',
      busy: 'warning',
      offline: 'error',
      maintenance: 'info'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <PowerSettingsNew color="success" />;
      case 'busy': return <PowerSettingsNew color="warning" />;
      case 'offline': return <PowerOff color="error" />;
      case 'maintenance': return <Build color="info" />;
      default: return <PowerSettingsNew />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Counter Management
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              {counterTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Counter
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Features</TableCell>
              <TableCell>Analytics</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {counters.map((counter) => (
              <TableRow key={counter._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {counter.name}
                  </Typography>
                  {counter.description && (
                    <Typography variant="caption" color="textSecondary">
                      {counter.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {counter.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={counter.type.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={getTypeColor(counter.type) as any}
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(counter.status)}
                    <Chip
                      label={counter.status.charAt(0).toUpperCase() + counter.status.slice(1)}
                      size="small"
                      color={getStatusColor(counter.status) as any}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    Floor {counter.location.floor || 'N/A'}
                    {counter.location.room && `, ${counter.location.room}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {counter.capacity.maxConcurrentUsers} users
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {counter.capacity.maxDailyTransactions} daily
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {counter.features.supportsCheckIn && <Chip label="Check-in" size="small" />}
                    {counter.features.supportsCheckOut && <Chip label="Check-out" size="small" />}
                    {counter.features.supportsPayment && <Chip label="Payment" size="small" />}
                    {counter.features.supportsKeyIssuance && <Chip label="Keys" size="small" />}
                    {counter.features.supportsGuestServices && <Chip label="Services" size="small" />}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {counter.analytics.totalTransactions} transactions
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Avg: {counter.analytics.averageTransactionTime}min
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleView(counter)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(counter)}
                      title="Edit"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusChange(counter, counter.status === 'available' ? 'offline' : 'available')}
                      title="Toggle Status"
                    >
                      {counter.status === 'available' ? <PowerOff /> : <PowerSettingsNew />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(counter)}
                      title="Delete"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog
        open={showForm}
        onClose={handleFormClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCounter ? 'Edit Counter' : 'Create Counter'}
        </DialogTitle>
        <DialogContent>
          <CounterForm
            counter={selectedCounter}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Counter Details</DialogTitle>
        <DialogContent>
          {selectedCounter && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Code
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {selectedCounter.code}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Type
                  </Typography>
                  <Chip
                    label={selectedCounter.type.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={getTypeColor(selectedCounter.type) as any}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(selectedCounter.status)}
                    <Chip
                      label={selectedCounter.status.charAt(0).toUpperCase() + selectedCounter.status.slice(1)}
                      size="small"
                      color={getStatusColor(selectedCounter.status) as any}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.description || 'No description'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    Floor {selectedCounter.location.floor || 'N/A'}
                    {selectedCounter.location.room && `, ${selectedCounter.location.room}`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Capacity
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.capacity.maxConcurrentUsers} concurrent users
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedCounter.capacity.maxDailyTransactions} daily transactions
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Operating Hours
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.operatingHours.startTime && selectedCounter.operatingHours.endTime
                      ? `${selectedCounter.operatingHours.startTime} - ${selectedCounter.operatingHours.endTime}`
                      : '24/7'
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Features
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {selectedCounter.features.supportsCheckIn && <Chip label="Check-in" size="small" />}
                    {selectedCounter.features.supportsCheckOut && <Chip label="Check-out" size="small" />}
                    {selectedCounter.features.supportsPayment && <Chip label="Payment" size="small" />}
                    {selectedCounter.features.supportsKeyIssuance && <Chip label="Key Issuance" size="small" />}
                    {selectedCounter.features.supportsGuestServices && <Chip label="Guest Services" size="small" />}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Transactions
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.analytics.totalTransactions}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Average Transaction Time
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.analytics.averageTransactionTime} minutes
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {selectedCounter.createdBy.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedCounter.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CounterManager;
