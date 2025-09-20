import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '../../../utils/cn';

interface BarChartProps {
  data: any[];
  xDataKey: string;
  bars?: {
    dataKey: string;
    name?: string;
    color?: string;
    radius?: number;
    stackId?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  onBarClick?: (data: any) => void;
}

export function BarChart({
  data,
  xDataKey,
  bars = [],
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = 'vertical',
  className,
  onBarClick,
}: BarChartProps) {
  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  console.log('📊 BarChart component received data:', data);
  console.log('📊 BarChart data length:', data?.length);
  console.log('📊 BarChart xDataKey:', xDataKey);
  console.log('📊 BarChart bars:', bars);

  // Calculate dynamic Y-axis domain based on data
  const maxValue = data ? Math.max(...data.map(item => {
    const values = bars.map(bar => item[bar.dataKey] || 0);
    return Math.max(...values);
  })) : 0;
  const yAxisDomain = [0, Math.max(maxValue + 2, 10)]; // Add some padding
  console.log('📊 BarChart Y-axis domain:', yAxisDomain);
  console.log('📊 BarChart height:', height);

  if (!data || data.length === 0) {
    console.log('📊 BarChart: No data available, showing empty state');
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-medium text-gray-900">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('w-full', className)} style={{ height: height || '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: layout === 'vertical' ? 60 : 5 }}
          layout={layout}
          barCategoryGap="20%"
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          )}
          <XAxis
            type={layout === 'horizontal' ? 'number' : 'category'}
            dataKey={layout === 'horizontal' ? undefined : xDataKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            dy={layout === 'vertical' ? 10 : 0}
            angle={layout === 'vertical' ? -45 : 0}
            textAnchor={layout === 'vertical' ? 'end' : 'middle'}
            height={layout === 'vertical' ? 60 : undefined}
            interval={0}
            tickFormatter={layout === 'horizontal' ? (value) =>
              typeof value === 'number' && value >= 1000
                ? `${(value / 1000).toFixed(0)}k`
                : value
              : (value) => value
            }
          />
          <YAxis
            type={layout === 'horizontal' ? 'category' : 'number'}
            dataKey={layout === 'horizontal' ? xDataKey : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            domain={layout === 'vertical' ? yAxisDomain : undefined}
            tickFormatter={layout === 'vertical' ? (value) =>
              typeof value === 'number' && value >= 1000
                ? `${(value / 1000).toFixed(0)}k`
                : value
              : undefined
            }
            width={layout === 'horizontal' ? 80 : undefined}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {bars && bars.length > 0 ? bars.map((bar, index) => {
            console.log(`📊 Rendering bar ${index}:`, bar);
            return (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name || bar.dataKey}
                fill={bar.color || defaultColors[index % defaultColors.length]}
                radius={[4, 4, 0, 0]}
                onClick={onBarClick ? (data) => onBarClick(data.payload) : undefined}
                style={{ 
                  cursor: onBarClick ? 'pointer' : 'default'
                }}
              />
            );
          }) : (
            <Bar
              dataKey="value"
              fill={defaultColors[0]}
              radius={[0, 2, 2, 0]}
              minPointSize={2}
              stroke="#000"
              strokeWidth={1}
              onClick={onBarClick ? (data) => onBarClick(data.payload) : undefined}
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
            />
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}