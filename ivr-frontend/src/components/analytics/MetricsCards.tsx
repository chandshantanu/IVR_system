'use client';

import { Phone, Users, Clock, TrendingUp, PhoneIncoming, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardMetrics } from '@/lib/api/analytics';

interface MetricsCardsProps {
  metrics: DashboardMetrics | null;
  isConnected: boolean;
}

export function MetricsCards({ metrics, isConnected }: MetricsCardsProps) {
  const metricCards = [
    {
      title: 'Active Calls',
      value: metrics?.activeCalls ?? 0,
      icon: Phone,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Calls in Queue',
      value: metrics?.callsInQueue ?? 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning-bg',
    },
    {
      title: 'Available Agents',
      value: `${metrics?.availableAgents ?? 0}/${metrics?.totalAgents ?? 0}`,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success-bg',
    },
    {
      title: 'Calls Today',
      value: metrics?.callsToday ?? 0,
      icon: PhoneIncoming,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Completed',
      value: metrics?.completedCalls ?? 0,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success-bg',
    },
    {
      title: 'Success Rate',
      value: metrics?.successRate ? `${metrics.successRate.toFixed(1)}%` : '0%',
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success-bg',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Real-time Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse' : 'bg-destructive'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {metrics && metrics.avgCallDuration !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Call Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-xl font-bold">
                {Math.floor(metrics.avgCallDuration / 60)}m {Math.round(metrics.avgCallDuration % 60)}s
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
