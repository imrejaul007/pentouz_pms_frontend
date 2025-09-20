import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Grid, Card, CardContent, CardHeader, CardTitle } from '@mui/material';
import { 
  LocalOffer, 
  TrendingUp, 
  Group, 
  Work,
  Analytics,
  Add,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import DiscountManager from '../../components/advanced/DiscountManager';
import PricingManager from '../../components/advanced/PricingManager';
import MarketSegmentManager from '../../components/advanced/MarketSegmentManager';
import JobTypeManager from '../../components/advanced/JobTypeManager';
import AdvancedAnalytics from '../../components/advanced/AdvancedAnalytics';

interface OverviewData {
  summary: {
    totalDiscounts: number;
    activeDiscounts: number;
    totalPricingRules: number;
    activePricingRules: number;
    totalMarketSegments: number;
    totalJobTypes: number;
    remoteEligibleJobs: number;
  };
  topSegments: Array<{
    _id: string;
    name: string;
    category: string;
    analytics: {
      totalRevenue: number;
      totalBookings: number;
      averageBookingValue: number;
    };
  }>;
}

const AdminAdvancedFeatures: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      // const response = await api.get('/discount-pricing/overview');
      // setOverviewData(response.data.overview);
      
      // Mock data for demonstration
      setOverviewData({
        summary: {
          totalDiscounts: 15,
          activeDiscounts: 12,
          totalPricingRules: 8,
          activePricingRules: 6,
          totalMarketSegments: 10,
          totalJobTypes: 25,
          remoteEligibleJobs: 8
        },
        topSegments: [
          {
            _id: '1',
            name: 'Business Travelers',
            category: 'business',
            analytics: {
              totalRevenue: 125000,
              totalBookings: 450,
              averageBookingValue: 277.78
            }
          },
          {
            _id: '2',
            name: 'Leisure Families',
            category: 'leisure',
            analytics: {
              totalRevenue: 98000,
              totalBookings: 320,
              averageBookingValue: 306.25
            }
          },
          {
            _id: '3',
            name: 'Corporate Groups',
            category: 'corporate',
            analytics: {
              totalRevenue: 156000,
              totalBookings: 180,
              averageBookingValue: 866.67
            }
          }
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

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string }> = ({ 
    title, 
    value, 
    icon, 
    color,
    subtitle
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
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
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
        Advanced Features
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Manage discounts, dynamic pricing, market segments, and job types for advanced hotel operations
      </Typography>

      {/* Overview Cards */}
      {overviewData && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Special Discounts"
              value={overviewData.summary.totalDiscounts}
              icon={<LocalOffer sx={{ fontSize: 40 }} />}
              color="primary.main"
              subtitle={`${overviewData.summary.activeDiscounts} active`}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Pricing Rules"
              value={overviewData.summary.totalPricingRules}
              icon={<TrendingUp sx={{ fontSize: 40 }} />}
              color="success.main"
              subtitle={`${overviewData.summary.activePricingRules} active`}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Market Segments"
              value={overviewData.summary.totalMarketSegments}
              icon={<Group sx={{ fontSize: 40 }} />}
              color="warning.main"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Job Types"
              value={overviewData.summary.totalJobTypes}
              icon={<Work sx={{ fontSize: 40 }} />}
              color="info.main"
              subtitle={`${overviewData.summary.remoteEligibleJobs} remote`}
            />
          </Grid>
        </Grid>
      )}

      {/* Top Performing Segments */}
      {overviewData && overviewData.topSegments.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Market Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid container spacing={2}>
                  {overviewData.topSegments.map((segment) => (
                    <Grid item xs={12} md={4} key={segment._id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {segment.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            {segment.category.charAt(0).toUpperCase() + segment.category.slice(1)}
                          </Typography>
                          <Typography variant="body2">
                            Revenue: ${segment.analytics.totalRevenue.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Bookings: {segment.analytics.totalBookings}
                          </Typography>
                          <Typography variant="body2">
                            Avg Value: ${segment.analytics.averageBookingValue.toFixed(2)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="advanced features tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<LocalOffer />} 
            label="Discounts" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrendingUp />} 
            label="Dynamic Pricing" 
            iconPosition="start"
          />
          <Tab 
            icon={<Group />} 
            label="Market Segments" 
            iconPosition="start"
          />
          <Tab 
            icon={<Work />} 
            label="Job Types" 
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
          <DiscountManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 1 && (
        <Box>
          <PricingManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 2 && (
        <Box>
          <MarketSegmentManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 3 && (
        <Box>
          <JobTypeManager onRefresh={fetchOverviewData} />
        </Box>
      )}
      
      {currentTab === 4 && (
        <Box>
          <AdvancedAnalytics />
        </Box>
      )}
    </Box>
  );
};

export default AdminAdvancedFeatures;
