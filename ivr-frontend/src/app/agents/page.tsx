'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, UserCheck, UserX, Clock, Phone, RefreshCw } from 'lucide-react';
import { exotelApi, ExotelUser } from '@/lib/api/exotel';

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  currentCalls: number;
  totalCallsToday: number;
  avgCallDuration: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await exotelApi.getUsers(true);

      // Transform Exotel users to Agent format
      const transformedAgents: Agent[] = response.users.map((user: ExotelUser) => {
        // Determine status based on available_status and active_call
        let status: 'available' | 'busy' | 'offline' = 'offline';
        if (user.active_call) {
          status = 'busy';
        } else if (user.available_status === 'available' || user.available_status === 'online') {
          status = 'available';
        }

        return {
          id: user.user_id || user.id,
          name: `${user.first_name} ${user.last_name}`.trim() || 'Unknown Agent',
          email: user.email || 'No email',
          status,
          currentCalls: user.active_call ? 1 : 0,
          totalCallsToday: 0, // Not available from Exotel API
          avgCallDuration: 0, // Not available from Exotel API
        };
      });

      setAgents(transformedAgents);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message || 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'busy':
        return <Badge variant="warning">Busy</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">
            Real-time agent status from Exotel
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchAgents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/30 bg-destructive-bg">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <UserX className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  Failed to Load Agents
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {error}
                </p>
                <Button variant="outline" size="sm" onClick={fetchAgents}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && !error && (
      <>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Agents
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">
                {agents.filter(a => a.status === 'available').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                On Call
              </CardTitle>
              <Phone className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-warning">
                {agents.filter(a => a.currentCalls > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agents List */}
        <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
          <CardDescription>Real-time agent availability and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border rounded-xl p-4 hover:bg-muted/50 transition-all duration-normal ease-medical"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(agent.status)}
                    <div
                      className={`h-2 w-2 rounded-full ${
                        agent.status === 'available'
                          ? 'bg-success'
                          : agent.status === 'busy'
                          ? 'bg-warning'
                          : 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Calls</p>
                    <p className="text-lg font-semibold text-foreground">{agent.currentCalls}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Agent Management
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Real-time agent monitoring from Exotel. View agent availability, device status, and active calls.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Real-time status monitoring</li>
                <li>✓ Device connectivity status</li>
                <li>✓ Active call tracking</li>
                <li>✓ Availability management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
