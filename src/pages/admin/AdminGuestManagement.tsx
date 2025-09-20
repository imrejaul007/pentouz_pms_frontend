import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Grid, Card, CardContent, CardHeader, CardTitle } from '@mui/material';
import { 
  Person, 
  Business, 
  CreditCard, 
  Settings, 
  Analytics,
  Add,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import AccountAttributeManager from '../../components/guest/AccountAttributeManager';
import GuestTypeManager from '../../components/guest/GuestTypeManager';
import IdentificationTypeManager from '../../components/guest/IdentificationTypeManager';
import GuestManagementAnalytics from '../../components/guest/GuestManagementAnalytics';

interface OverviewData {
  summary: {
    totalAttributes: number;
    totalGuestTypes: number;
    totalIdentificationTypes: number;
  };
  attributesByCategory: Array<{ _id: string; count: number }>;
  guestTypesByCategory: Array<{ _id: string; count: number }>;
  identificationTypesByCategory: Array<{ _id: string; count: number }>;
}

const AdminGuestManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // const response = await api.get('/guest-management/overview');
      // setOverviewData(response.data.overview);
      
      // Mock data for demonstration
      setOverviewData({
        summary: {
          totalAttributes: 12,
          totalGuestTypes: 8,
          totalIdentificationTypes: 6
        },
        attributesByCategory: [
          { _id: 'personal', count: 5 },
          { _id: 'business', count: 4 },
          { _id: 'financial', count: 3 }
        ],
        guestTypesByCategory: [
          { _id: 'individual', count: 3 },
          { _id: 'corporate', count: 2 },
          { _id: 'vip', count: 2 },
          { _id: 'group', count: 1 }
        ],
        identificationTypesByCategory: [
          { _id: 'government', count: 4 },
          { _id: 'corporate', count: 2 }
        ]
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ 
    title, 
    value, 
    icon, 
    color 
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" color={color}>
              {value}
            </Typography>
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Guest Management
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Manage account attributes, guest types, and identification types for your hotel
      </Typography>

      {/* Overview Cards */}
      {overviewData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Account Attributes"
              value={overviewData.summary.totalAttributes}
              icon={<Settings sx={{ fontSize: 40 }} />}
              color="primary.main"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Guest Types"
              value={overviewData.summary.totalGuestTypes}
              icon={<Person sx={{ fontSize: 40 }} />}
              color="success.main"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              title="ID Types"
              value={overviewData.summary.totalIdentificationTypes}
              icon={<CreditCard sx={{ fontSize: 40 }} />}
              color="warning.main"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="guest management tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<Settings />} 
            label="Account Attributes" 
            iconPosition="start"
          />
          <Tab 
            icon={<Person />} 
            label="Guest Types" 
            iconPosition="start"
          />
          <Tab 
            icon={<CreditCard />} 
            label="Identification Types" 
            iconPosition="start"
          />
          <Tab 
            icon={<Analytics />} 
            label="Analytics" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Box>
          <AccountAttributeManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 1 && (
        <Box>
          <GuestTypeManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 2 && (
        <Box>
          <IdentificationTypeManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 3 && (
        <Box>
          <GuestManagementAnalytics />
        </Box>
      )}
    </Box>
  );
};

export default AdminGuestManagement;
