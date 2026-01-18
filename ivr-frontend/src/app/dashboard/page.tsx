'use client';

import { useState } from 'react';
import { MetricsCards } from '@/components/analytics/MetricsCards';
import { CallHistoryTable } from '@/components/analytics/CallHistoryTable';
import { CallMetricsCharts } from '@/components/analytics/CallMetricsCharts';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneNumberSelector } from '@/components/PhoneNumberSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Phone, CheckCircle, PhoneOff, Clock, Users, PhoneForwarded,
  TrendingUp, Activity
} from 'lucide-react';

// KPI Card Component
function KPICard({ title, value, change, icon: Icon, trend, status }: any) {
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
        {status && (
          <Badge variant={status === 'connected' ? 'success' : 'destructive'} className="mt-2">
            {status === 'connected' ? 'Live' : 'Offline'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);
  const { isConnected, dashboardMetrics, latestCall, queueUpdates, agentStatuses } = useWebSocket();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Dashboard</h2>
          <p className="text-muted-foreground">
            Live IVR monitoring and analytics
          </p>
        </div>

        {/* Phone Number Filter */}
        <PhoneNumberSelector
          selectedPhoneNumber={selectedPhoneNumber}
          onPhoneNumberChange={setSelectedPhoneNumber}
          className="ml-auto"
        />
      </div>

      {/* KPI Cards */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPICard
            title="Total Calls"
            value={dashboardMetrics.totalCalls || 0}
            icon={Phone}
            status={isConnected ? 'connected' : 'disconnected'}
          />
          <KPICard
            title="Active Calls"
            value={dashboardMetrics.activeCalls || 0}
            icon={Activity}
          />
          <KPICard
            title="Completed"
            value={dashboardMetrics.completedCalls || 0}
            icon={CheckCircle}
          />
          <KPICard
            title="Failed"
            value={dashboardMetrics.failedCalls || 0}
            icon={PhoneOff}
          />
          <KPICard
            title="In Queue"
            value={dashboardMetrics.queuedCalls || 0}
            icon={Users}
          />
          <KPICard
            title="Avg Duration"
            value={dashboardMetrics.avgDuration ? `${Math.floor(dashboardMetrics.avgDuration / 60)}m ${Math.round(dashboardMetrics.avgDuration % 60)}s` : '0m 0s'}
            icon={Clock}
          />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Live Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Activity</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="charts">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Latest Call Alert */}
          {latestCall && (
            <Card className="border-info/30 bg-info-bg">
              <CardContent className="p-4">
                <h3 className="font-semibold text-info mb-2 flex items-center gap-2">
                  {latestCall.status === 'started' ? (
                    <>
                      <Phone className="h-5 w-5" />
                      New Call
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Call Completed
                    </>
                  )}
                </h3>
                <div className="text-sm text-info space-y-1">
                  <p>Call SID: {latestCall.callSid}</p>
                  <p>Flow: {latestCall.flowName}</p>
                  <p>Caller: {latestCall.callerNumber}</p>
                  {latestCall.duration && <p>Duration: {latestCall.duration}s</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Status */}
          {queueUpdates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Call Queues</CardTitle>
                <CardDescription>Real-time queue status and wait times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {queueUpdates.map((queue) => (
                    <Card key={queue.queueId}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-foreground mb-2">{queue.queueName}</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Callers in queue: <span className="font-bold text-foreground">{queue.currentSize}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Longest wait: <span className="font-bold text-foreground">{queue.longestWaitTime}s</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Status */}
          {agentStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>Real-time agent availability and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {agentStatuses.map((agent) => (
                    <Card key={agent.agentId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{agent.agentName}</h4>
                          <div
                            className={`h-3 w-3 rounded-full ${
                              agent.status === 'available'
                                ? 'bg-success'
                                : agent.status === 'busy'
                                ? 'bg-destructive'
                                : 'bg-muted-foreground'
                            }`}
                          />
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Status: <Badge variant={agent.status === 'available' ? 'success' : 'destructive'}>{agent.status}</Badge>
                          </p>
                          <p className="text-muted-foreground">
                            Current calls: <span className="font-bold text-foreground">{agent.currentCalls}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Metrics</CardTitle>
              <CardDescription>Live call monitoring and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsCards metrics={dashboardMetrics} isConnected={isConnected} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <CallHistoryTable />
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <CallMetricsCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
