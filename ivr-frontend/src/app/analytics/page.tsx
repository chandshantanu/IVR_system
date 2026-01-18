'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import {
  Calendar, Phone, CheckCircle, PhoneOff, Clock, Users, PhoneForwarded,
  TrendingUp, Download, Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CallMetricsCharts } from '@/components/analytics/CallMetricsCharts';
import { CallHistoryTable } from '@/components/analytics/CallHistoryTable';
import { analyticsApi, AgentPerformance } from '@/lib/api/analytics';
import { api } from '@/lib/api-client';

// KPI Card Component
function KPICard({ title, value, change, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="text-xl font-bold">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${trend === 'up' ? 'text-success' : 'text-muted-foreground'}`}>
            <TrendingUp className="inline h-3 w-3" /> {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch dashboard metrics
  const loadMetrics = useCallback(async () => {
    try {
      const data = await api.get('/api/analytics/dashboard');
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }, []);

  const loadAgentPerformance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getAgentPerformance(
        dateRange.startDate,
        dateRange.endDate
      );
      setAgentPerformance(data);
    } catch (error) {
      console.error('Failed to load agent performance:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadMetrics();
    loadAgentPerformance();
  }, [loadMetrics, loadAgentPerformance]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive IVR analytics and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-36"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="w-36"
          />
          <Button onClick={loadAgentPerformance} size="sm">
            Apply
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPICard
            title="Total Calls Today"
            value={metrics.callsToday || 0}
            icon={Phone}
            trend="up"
          />
          <KPICard
            title="Completed"
            value={metrics.completedCalls || 0}
            icon={CheckCircle}
            trend="up"
          />
          <KPICard
            title="Missed"
            value={metrics.missedCalls || 0}
            icon={PhoneOff}
            trend="down"
          />
          <KPICard
            title="Abandoned"
            value={metrics.abandonedCalls || 0}
            icon={PhoneOff}
            trend="down"
          />
          <KPICard
            title="Failed"
            value={metrics.failedCalls || 0}
            icon={PhoneOff}
            trend="down"
          />
          <KPICard
            title="Avg Duration"
            value={metrics.avgCallDuration ? `${Math.floor(metrics.avgCallDuration / 60)}m ${Math.round(metrics.avgCallDuration % 60)}s` : '0m 0s'}
            icon={Clock}
            trend="up"
          />
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <CallMetricsCharts />
        </TabsContent>

        {/* Call Logs Tab */}
        <TabsContent value="call-logs" className="space-y-4">
          <CallHistoryTable />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of call patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CallMetricsCharts />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>
                Individual agent statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : agentPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No agent data available</div>
              ) : (
                <div className="space-y-4">
                  {agentPerformance.map((agent) => (
                    <div
                      key={agent.agentId}
                      className="border rounded-xl p-4 hover:bg-muted/50 transition-all duration-normal ease-medical"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-foreground">{agent.agentName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                agent.status === 'available'
                                  ? 'bg-success'
                                  : agent.status === 'busy'
                                  ? 'bg-destructive'
                                  : 'bg-muted-foreground'
                              }`}
                            />
                            <span className="text-sm text-muted-foreground">{agent.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {(100 - agent.abandonmentRate).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Total Calls</div>
                          <div className="text-lg font-semibold text-foreground">{agent.totalCalls}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Completed</div>
                          <div className="text-lg font-semibold text-success">
                            {agent.totalCalls - agent.abandonedCalls}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Avg Duration</div>
                          <div className="text-lg font-semibold text-foreground">
                            {Math.floor(agent.averageCallDuration / 60)}m {Math.round(agent.averageCallDuration % 60)}s
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Avg Wait Time</div>
                          <div className="text-lg font-semibold text-foreground">
                            {Math.floor(agent.averageWaitTime / 60)}m {Math.round(agent.averageWaitTime % 60)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
