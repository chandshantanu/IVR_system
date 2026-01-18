'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Play, Copy } from 'lucide-react';
import { toast } from '@/lib/toast';
import { api } from '@/lib/api-client';

interface Flow {
  id: number;
  name: string;
  description: string;
  status: string;
  version: number;
  isPublished: boolean;
  nodes?: any[];
  edges?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      const data = await api.get<Flow[]>('/api/ivr/flows');
      setFlows(data);
    } catch (error) {
      console.error('Failed to load flows:', error);
      toast.error('Failed to load flows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = () => {
    router.push('/flows/builder/new');
  };

  const handleEditFlow = (flowId: number) => {
    router.push(`/flows/builder/${flowId}`);
  };

  const handleDeleteFlow = async (flowId: number, flowName: string) => {
    if (!confirm(`Are you sure you want to delete "${flowName}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/ivr/flows/${flowId}`);
      toast.success('Flow deleted successfully');
      loadFlows();
    } catch (error) {
      console.error('Failed to delete flow:', error);
      toast.error('Failed to delete flow');
    }
  };

  const handleDuplicateFlow = async (flow: Flow) => {
    try {
      const newFlow = {
        name: `${flow.name} (Copy)`,
        description: flow.description,
        nodes: flow.nodes || [],
        edges: flow.edges || [],
      };

      await api.post('/api/ivr/flows', newFlow);
      toast.success('Flow duplicated successfully');
      loadFlows();
    } catch (error) {
      console.error('Failed to duplicate flow:', error);
      toast.error('Failed to duplicate flow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success-bg text-success border-success/30';
      case 'draft':
        return 'bg-warning-bg text-warning border-warning/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">IVR Flows</h2>
            <p className="text-muted-foreground">Manage your interactive voice response flows</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading flows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IVR Flows</h2>
          <p className="text-muted-foreground">
            Manage your interactive voice response flows
          </p>
        </div>
        <Button onClick={handleCreateFlow}>
          <Plus className="w-4 h-4 mr-2" />
          Create Flow
        </Button>
      </div>

      {!flows || flows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first IVR flow
              </p>
              <Button onClick={handleCreateFlow}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Flow
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flows.map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle>{flow.name}</CardTitle>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          flow.status
                        )}`}
                      >
                        {flow.status}
                      </span>
                    </div>
                    <CardDescription className="mt-1">
                      {flow.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditFlow(flow.id)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateFlow(flow)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFlow(flow.id, flow.name)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Version</p>
                    <p className="text-sm text-foreground">v{flow.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nodes</p>
                    <p className="text-sm text-foreground">
                      {flow.nodes?.length || 0} nodes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Connections</p>
                    <p className="text-sm text-foreground">
                      {flow.edges?.length || 0} edges
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm text-foreground">
                      {flow.updatedAt
                        ? new Date(flow.updatedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {flow.nodes && flow.nodes.length > 0 && (
                  <div className="mt-4 bg-info-bg border border-info/30 rounded-lg p-3">
                    <p className="text-sm text-info">
                      <strong>Flow Preview:</strong>{' '}
                      {flow.nodes.map((n: any) => n.data?.label || n.type).join(' → ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Visual Flow Builder
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Create sophisticated IVR flows with our drag-and-drop visual builder.
                Add nodes for welcome messages, menus, queues, transfers, and more.
                Connect them with custom logic and test your flows in real-time.
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Drag-and-drop interface</li>
                <li>✓ 8+ node types (Welcome, Menu, Play, Queue, Transfer, Decision, Record, Hangup)</li>
                <li>✓ Real-time validation</li>
                <li>✓ Save and version control</li>
                <li>✓ Test flows before deployment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
