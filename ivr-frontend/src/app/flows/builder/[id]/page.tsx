'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes, nodeTemplates } from '@/components/flow-builder/CustomNodes';
import { NodePalette } from '@/components/flow-builder/NodePalette';
import { NodeConfigPanel } from '@/components/flow-builder/NodeConfigPanel';
import { Button } from '@/components/ui/button';
import { Save, Play, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from '@/lib/toast';

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

export default function FlowBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [isSaving, setIsSaving] = useState(false);

  // Load flow data
  useEffect(() => {
    if (flowId !== 'new') {
      loadFlow(flowId);
    }
  }, [flowId]);

  const loadFlow = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ivr/flows/${id}`);
      if (response.ok) {
        const flow = await response.json();
        setFlowName(flow.name);
        if (flow.nodes) {
          setNodes(flow.nodes);
        }
        if (flow.edges) {
          setEdges(flow.edges);
        }
        toast.success(`Loaded flow: ${flow.name}`);
      }
    } catch (error) {
      console.error('Failed to load flow:', error);
      toast.error('Failed to load flow');
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const template = nodeTemplates.find((t) => t.type === type);
      if (!template) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { ...template.defaultData },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: newData,
            };
          }
          return node;
        })
      );
      setSelectedNode(null);
      toast.success('Node updated');
    },
    [setNodes]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const flowData = {
        name: flowName,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
        })),
      };

      const url = flowId === 'new'
        ? 'http://localhost:3001/api/ivr/flows'
        : `http://localhost:3001/api/ivr/flows/${flowId}`;

      const method = flowId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });

      if (response.ok) {
        const savedFlow = await response.json();
        toast.success('Flow saved successfully');

        if (flowId === 'new') {
          // Redirect to the new flow's edit page
          router.push(`/flows/builder/${savedFlow.id}`);
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast.error('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = () => {
    toast.info('Test flow feature coming soon!');
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      setSelectedNode(null);
      toast.success('Node deleted');
    }
  }, [selectedNode, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
          event.preventDefault();
          handleDeleteSelected();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleDeleteSelected]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/flows')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Flow Name"
            />
            <p className="text-xs text-gray-500">
              {nodes.length} nodes, {edges.length} connections
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleTest}>
            <Play className="w-4 h-4 mr-2" />
            Test Flow
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Flow'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Node Palette */}
        <NodePalette onDragStart={onDragStart} />

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'welcome': return '#10b981';
                  case 'menu': return '#3b82f6';
                  case 'play': return '#a855f7';
                  case 'queue': return '#f97316';
                  case 'transfer': return '#6366f1';
                  case 'decision': return '#eab308';
                  case 'record': return '#ec4899';
                  case 'hangup': return '#ef4444';
                  default: return '#94a3b8';
                }
              }}
            />

            <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-3 m-4">
              <div className="text-xs text-gray-600">
                <div className="font-semibold mb-1">Shortcuts:</div>
                <div>• Drag nodes from left</div>
                <div>• Click to select</div>
                <div>• Delete/Backspace to remove</div>
                <div>• Cmd/Ctrl+S to save</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Configuration Panel */}
        {selectedNode && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
          />
        )}
      </div>
    </div>
  );
}
