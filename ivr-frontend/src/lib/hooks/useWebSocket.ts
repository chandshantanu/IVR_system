import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '../env';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

interface DashboardMetrics {
  activeCalls: number;
  callsInQueue: number;
  availableAgents: number;
  totalAgents: number;
  callsToday: number;
  avgWaitTime: number;
  callSuccessRate: number;
  avgCallDuration: number;
}

interface CallEvent {
  callSid: string;
  flowId: number;
  flowName: string;
  callerNumber: string;
  status?: string;
  duration?: number;
}

interface QueueUpdate {
  queueId: number;
  queueName: string;
  currentSize: number;
  longestWaitTime: number;
}

interface AgentStatusUpdate {
  agentId: number;
  agentName: string;
  status: string;
  currentCalls: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = env.wsUrl,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [latestCall, setLatestCall] = useState<CallEvent | null>(null);
  const [queueUpdates, setQueueUpdates] = useState<Map<number, QueueUpdate>>(new Map());
  const [agentStatuses, setAgentStatuses] = useState<Map<number, AgentStatusUpdate>>(new Map());

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Initialize socket connection
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Dashboard metrics (broadcast every 5 seconds)
    socket.on('dashboard:metrics', (metrics: DashboardMetrics) => {
      setDashboardMetrics(metrics);
    });

    // Call events
    socket.on('call:started', (data: CallEvent) => {
      setLatestCall({ ...data, status: 'started' });
    });

    socket.on('call:completed', (data: CallEvent) => {
      setLatestCall({ ...data, status: 'completed' });
    });

    // Queue updates
    socket.on('queue:update', (data: QueueUpdate) => {
      setQueueUpdates((prev) => {
        const updated = new Map(prev);
        updated.set(data.queueId, data);
        return updated;
      });
    });

    // Agent status updates
    socket.on('agent:status', (data: AgentStatusUpdate) => {
      setAgentStatuses((prev) => {
        const updated = new Map(prev);
        updated.set(data.agentId, data);
        return updated;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect]);

  // Join a specific room (e.g., for flow monitoring)
  const joinRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join:room', room);
    }
  };

  // Leave a room
  const leaveRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:room', room);
    }
  };

  return {
    isConnected,
    dashboardMetrics,
    latestCall,
    queueUpdates: Array.from(queueUpdates.values()),
    agentStatuses: Array.from(agentStatuses.values()),
    joinRoom,
    leaveRoom,
    socket: socketRef.current,
  };
}
