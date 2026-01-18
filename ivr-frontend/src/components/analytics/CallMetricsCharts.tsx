'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsApi, CallMetrics } from '@/lib/api/analytics';

export function CallMetricsCharts() {
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const data = await analyticsApi.getCallMetrics(startDate, endDate);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load call metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading charts...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // Call Status Distribution
  const statusData = [
    { name: 'Completed', value: metrics.completedCalls, color: '#10b981' },
    { name: 'Failed', value: metrics.failedCalls, color: '#ef4444' },
  ];

  // Call Volume (mock hourly data)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    calls: i === parseInt(metrics.peakHour) ? metrics.peakHourCalls : Math.floor(Math.random() * metrics.peakHourCalls * 0.7),
  }));

  // Performance Metrics
  const performanceData = [
    { metric: 'Avg Duration', value: metrics.avgDuration, unit: 's' },
    { metric: 'Avg Wait Time', value: metrics.avgWaitTime, unit: 's' },
    { metric: 'Success Rate', value: metrics.successRate, unit: '%' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Call Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Call Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Call Volume by Hour */}
      <Card>
        <CardHeader>
          <CardTitle>Call Volume by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="#3b82f6" name="Calls" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="metric" />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6">
                {performanceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.metric === 'Success Rate' ? '#10b981' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Summary Statistics (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Total Calls</div>
              <div className="text-2xl font-bold">{metrics.totalCalls}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Completed Calls</div>
              <div className="text-2xl font-bold text-green-600">{metrics.completedCalls}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Failed Calls</div>
              <div className="text-2xl font-bold text-red-600">{metrics.failedCalls}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Peak Hour</div>
              <div className="text-2xl font-bold">{metrics.peakHour}:00</div>
              <div className="text-xs text-gray-500">{metrics.peakHourCalls} calls</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
