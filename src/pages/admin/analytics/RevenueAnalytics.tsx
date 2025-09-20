import React, { useState } from 'react';
import { cn } from '../../../utils/cn';
import {
  MetricCard,
  ChartCard,
  DataTable,
  FilterBar,
  ExportButton,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
} from '../../../components/dashboard';
import { Button } from '@/components/ui/button';
import { useRevenueData } from '../../../hooks/useDashboard';
import { formatCurrency, formatPercentage, getDateRange } from '../../../utils/dashboardUtils';

export default function RevenueAnalytics() {
  const [filters, setFilters] = useState({
    hotelId: '',
    period: 'month',
    startDate: getDateRange('month').start,
    endDate: getDateRange('month').end,
    groupBy: 'day' as 'day' | 'week' | 'month',
    roomType: '',
    source: '',
  });

  const revenueQuery = useRevenueData(
    filters.hotelId,
    filters.period,
    filters.startDate,
    filters.endDate
  );

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickPeriod = (period: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    const dateRange = getDateRange(period);
    setFilters(prev => ({
      ...prev,
      period,
      startDate: dateRange.start,
      endDate: dateRange.end,
    }));
  };

  const data = revenueQuery.data?.data;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed financial performance analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <ExportButton
            endpoint="revenue"
            params={{
              hotelId: filters.hotelId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              groupBy: filters.groupBy,
            }}
            filename="revenue-analytics"
          />
          <Button
            onClick={() => revenueQuery.refetch()}
            loading={revenueQuery.isLoading}
            variant="secondary"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
          <Button
            key={period}
            variant={filters.period === period ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleQuickPeriod(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            key: 'hotelId',
            label: 'Hotel',
            type: 'select',
            options: [
              { value: '', label: 'All Hotels' },
              { value: 'hotel1', label: 'Grand Hotel' },
              { value: 'hotel2', label: 'Business Center' },
            ],
          },
          {
            key: 'startDate',
            label: 'Start Date',
            type: 'date',
          },
          {
            key: 'endDate',
            label: 'End Date',
            type: 'date',
          },
          {
            key: 'groupBy',
            label: 'Group By',
            type: 'select',
            options: [
              { value: 'day', label: 'Daily' },
              { value: 'week', label: 'Weekly' },
              { value: 'month', label: 'Monthly' },
            ],
          },
          {
            key: 'roomType',
            label: 'Room Type',
            type: 'select',
            options: [
              { value: '', label: 'All Types' },
              { value: 'standard', label: 'Standard' },
              { value: 'deluxe', label: 'Deluxe' },
              { value: 'suite', label: 'Suite' },
            ],
          },
          {
            key: 'source',
            label: 'Booking Source',
            type: 'select',
            options: [
              { value: '', label: 'All Sources' },
              { value: 'direct', label: 'Direct' },
              { value: 'booking.com', label: 'Booking.com' },
              { value: 'expedia', label: 'Expedia' },
            ],
          },
        ]}
        values={filters}
        onChange={handleFilterChange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={data?.summary.totalRevenue || 0}
          type="currency"
          trend={{
            value: data?.periodComparison.changePercentage || 0,
            direction: (data?.periodComparison.changePercentage || 0) > 0 ? 'up' : 'down',
            label: 'vs previous period'
          }}
          color="green"
          loading={revenueQuery.isLoading}
        />
        
        <MetricCard
          title="Total Bookings"
          value={data?.summary.totalBookings || 0}
          trend={{
            value: data?.summary.bookingGrowth || 0,
            direction: (data?.summary.bookingGrowth || 0) > 0 ? 'up' : 'down',
            label: 'booking growth'
          }}
          color="blue"
          loading={revenueQuery.isLoading}
        />
        
        <MetricCard
          title="Average Booking Value"
          value={data?.summary.averageBookingValue || 0}
          type="currency"
          trend={{
            value: 5.2,
            direction: 'up',
            label: 'vs last period'
          }}
          color="purple"
          loading={revenueQuery.isLoading}
        />
        
        <MetricCard
          title="Revenue Growth"
          value={data?.summary.revenueGrowth || 0}
          type="percentage"
          trend={{
            value: Math.abs(data?.summary.revenueGrowth || 0),
            direction: (data?.summary.revenueGrowth || 0) > 0 ? 'up' : 'down',
            label: 'growth rate'
          }}
          color={data?.summary.revenueGrowth && data.summary.revenueGrowth > 0 ? 'green' : 'red'}
          loading={revenueQuery.isLoading}
        />
      </div>

      {/* Period Comparison */}
      {data?.periodComparison && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Period Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.periodComparison.current)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Previous Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.periodComparison.previous)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Change</p>
              <div className="flex items-center justify-center space-x-2">
                <p className={cn(
                  "text-2xl font-bold",
                  data.periodComparison.change > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {data.periodComparison.change > 0 ? '+' : ''}{formatCurrency(data.periodComparison.change)}
                </p>
                <p className={cn(
                  "text-sm",
                  data.periodComparison.changePercentage > 0 ? "text-green-600" : "text-red-600"
                )}>
                  ({data.periodComparison.changePercentage > 0 ? '+' : ''}{formatPercentage(data.periodComparison.changePercentage)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <ChartCard
          title="Revenue Trends"
          subtitle={`${filters.groupBy.charAt(0).toUpperCase() + filters.groupBy.slice(1)}ly revenue over time`}
          loading={revenueQuery.isLoading}
          error={revenueQuery.error?.message}
          onRefresh={() => revenueQuery.refetch()}
          height="400px"
        >
          <LineChart
            data={data?.timeSeries || []}
            xDataKey="date"
            lines={[
              {
                dataKey: 'revenue',
                name: 'Revenue',
                color: '#10b981',
              },
              {
                dataKey: 'averageRate',
                name: 'Avg Rate',
                color: '#3b82f6',
              }
            ]}
            height={350}
          />
        </ChartCard>

        {/* Revenue Forecast */}
        <ChartCard
          title="Revenue Forecast"
          subtitle="Projected revenue for next periods"
          loading={revenueQuery.isLoading}
          height="400px"
        >
          <AreaChart
            data={data?.forecast || []}
            xDataKey="date"
            areas={[
              {
                dataKey: 'projectedRevenue',
                name: 'Projected Revenue',
                color: '#8b5cf6',
                fillOpacity: 0.3,
              }
            ]}
            height={350}
          />
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <ChartCard
          title="Revenue by Booking Source"
          subtitle="Revenue distribution by booking channels"
          loading={revenueQuery.isLoading}
          height="400px"
        >
          <PieChart
            data={data?.bySource?.map(item => ({
              name: item.source,
              value: item.amount,
              percentage: item.percentage,
            })) || []}
            height={350}
          />
        </ChartCard>

        {/* Revenue by Room Type */}
        <ChartCard
          title="Revenue by Room Type"
          subtitle="Performance comparison across room categories"
          loading={revenueQuery.isLoading}
          height="400px"
        >
          <BarChart
            data={data?.byRoomType || []}
            xDataKey="roomType"
            bars={[
              {
                dataKey: 'revenue',
                name: 'Revenue',
                color: '#3b82f6',
              },
              {
                dataKey: 'averageRate',
                name: 'Avg Rate',
                color: '#10b981',
              }
            ]}
            height={350}
          />
        </ChartCard>
      </div>

      {/* Payment Status Analysis */}
      <ChartCard
        title="Payment Status Analysis"
        subtitle="Revenue breakdown by payment status"
        loading={revenueQuery.isLoading}
        height="300px"
      >
        <BarChart
          data={data?.byPaymentStatus || []}
          xDataKey="status"
          bars={[
            {
              dataKey: 'amount',
              name: 'Amount',
              color: '#f59e0b',
            }
          ]}
          height={250}
        />
      </ChartCard>

      {/* Detailed Revenue Data Table */}
      <DataTable
        title="Revenue Details"
        data={data?.timeSeries || []}
        columns={[
          {
            key: 'date',
            header: 'Date',
            render: (value) => new Date(value).toLocaleDateString(),
            width: '120px',
          },
          {
            key: 'revenue',
            header: 'Revenue',
            render: (value) => formatCurrency(value),
            align: 'right' as const,
            sortable: true,
          },
          {
            key: 'bookings',
            header: 'Bookings',
            align: 'right' as const,
            sortable: true,
          },
          {
            key: 'averageRate',
            header: 'Avg Rate',
            render: (value) => formatCurrency(value),
            align: 'right' as const,
            sortable: true,
          },
        ]}
        loading={revenueQuery.isLoading}
        searchable={true}
        pagination={true}
        pageSize={15}
        actions={
          <ExportButton
            endpoint="revenue"
            params={{
              hotelId: filters.hotelId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              format: 'detailed',
            }}
            formats={['csv', 'excel']}
            size="sm"
          />
        }
      />

      {/* Revenue by Source Table */}
      <DataTable
        title="Revenue by Booking Source"
        data={data?.bySource || []}
        columns={[
          {
            key: 'source',
            header: 'Source',
            width: '150px',
          },
          {
            key: 'amount',
            header: 'Revenue',
            render: (value) => formatCurrency(value),
            align: 'right' as const,
            sortable: true,
          },
          {
            key: 'percentage',
            header: 'Percentage',
            render: (value) => formatPercentage(value),
            align: 'right' as const,
            sortable: true,
          },
          {
            key: 'bookings',
            header: 'Bookings',
            align: 'right' as const,
            sortable: true,
          },
        ]}
        loading={revenueQuery.isLoading}
        searchable={false}
        pagination={false}
      />
    </div>
  );
}