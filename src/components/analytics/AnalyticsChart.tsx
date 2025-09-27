import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  title?: string;
  height?: number;
  options?: any;
  className?: string;
}

const defaultColors = {
  primary: 'rgba(99, 102, 241, 0.8)',
  primaryBorder: 'rgba(99, 102, 241, 1)',
  secondary: 'rgba(16, 185, 129, 0.8)',
  secondaryBorder: 'rgba(16, 185, 129, 1)',
  tertiary: 'rgba(245, 158, 11, 0.8)',
  tertiaryBorder: 'rgba(245, 158, 11, 1)',
  quaternary: 'rgba(239, 68, 68, 0.8)',
  quaternaryBorder: 'rgba(239, 68, 68, 1)',
  gradient: [
    'rgba(99, 102, 241, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ]
};

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  title,
  height = 300,
  options = {},
  className = ''
}) => {
  // Apply default colors if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || (
        type === 'pie' || type === 'doughnut'
          ? defaultColors.gradient
          : defaultColors.gradient[index % defaultColors.gradient.length]
      ),
      borderColor: dataset.borderColor || (
        type === 'pie' || type === 'doughnut'
          ? undefined
          : defaultColors.gradient[index % defaultColors.gradient.length].replace('0.8', '1')
      ),
      borderWidth: dataset.borderWidth ?? 2,
      tension: dataset.tension ?? 0.4,
    }))
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: (type === 'line' || type === 'bar') ? {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif'
          }
        }
      }
    } : {},
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    ...options
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    pie: Pie,
    doughnut: Doughnut
  }[type];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div style={{ height: `${height}px` }}>
        <ChartComponent data={processedData} options={defaultOptions} />
      </div>
    </div>
  );
};

export default AnalyticsChart;