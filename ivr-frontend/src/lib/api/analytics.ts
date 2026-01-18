import { api } from '../api-client';

export interface DashboardMetrics {
  activeCalls: number;
  callsInQueue: number;
  availableAgents: number;
  totalAgents: number;
  callsToday: number;
  completedCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  failedCalls: number;
  avgCallDuration: number;
  successRate: number;
  topFlows: Array<{ flowName: string; callCount: number }>;
}

export interface CallMetrics {
  totalCalls: number;
  completedCalls: number;
  missedCalls: number;
  abandonedCalls: number;
  failedCalls: number;
  averageDuration: number;
  peakHour: number;
  callsByHour: Array<{ hour: number; count: number }>;
}

export interface CallHistoryItem {
  id: number;
  callSid: string;
  callerNumber: string; // Masked caller number (e.g., "x8x0x7x6x5x")
  calledNumber: string; // Unmasked department number
  callerNumberUnmasked?: string; // Original unmasked caller number for API calls
  status: string;
  statusCategory?: 'success' | 'failed' | 'abandoned' | 'in_progress' | 'unknown';
  statusDescription?: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  recordingUrl?: string | null;
  direction?: string;
  answeredBy?: string;
  flow: {
    id: number;
    name: string;
  };
}

export interface CallHistoryResponse {
  calls: CallHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FlowAnalytics {
  flowId: number;
  flowName: string;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  avgDuration: number;
  successRate: number;
  nodeStats: Array<{
    nodeId: number;
    nodeName: string;
    nodeType: string;
    executionCount: number;
    avgDuration: number;
    errorCount: number;
  }>;
  exitPoints: Array<{
    nodeName: string;
    count: number;
    percentage: number;
  }>;
}

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  email: string;
  status: string;
  totalCalls: number;
  averageWaitTime: number;
  averageCallDuration: number;
  abandonedCalls: number;
  abandonmentRate: number;
}

export interface CallHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  flowId?: number;
  callerNumber?: string;
  page?: number;
  limit?: number;
}

export interface CallbackCallerRequest {
  callerNumber: string;
  agentNumber?: string;
  originalCallId?: string;
}

export interface CallbackCallerResponse {
  success: boolean;
  message: string;
  data: {
    callSid: string;
    maskedCallerNumber: string;
    agentNumber: string;
    status: string;
    originalCallId?: string;
  };
}

export const analyticsApi = {
  // Get real-time dashboard metrics
  getDashboardMetrics: async (phoneNumber?: string | null): Promise<DashboardMetrics> => {
    return await api.get<DashboardMetrics>('/api/analytics/dashboard', {
      params: phoneNumber ? { phoneNumber } : {},
    });
  },

  // Get call metrics for a date range
  getCallMetrics: async (startDate: string, endDate: string): Promise<CallMetrics> => {
    return await api.get<CallMetrics>('/api/analytics/calls/metrics', {
      params: { startDate, endDate },
    });
  },

  // Get call history with filters
  getCallHistory: async (filters: CallHistoryFilters = {}): Promise<CallHistoryResponse> => {
    const { page, limit = 20, ...rest } = filters;
    const offset = page ? (page - 1) * limit : 0;

    // Build params object and filter out undefined/null values
    const params: Record<string, any> = {};
    if (rest.startDate) params.startDate = rest.startDate;
    if (rest.endDate) params.endDate = rest.endDate;
    if (rest.flowId) params.flowId = rest.flowId;
    if (rest.status) params.status = rest.status;
    if (rest.callerNumber) params.callerNumber = rest.callerNumber;
    params.limit = limit;
    params.offset = offset;

    return await api.get<CallHistoryResponse>('/api/analytics/calls/history', {
      params,
    });
  },

  // Export call history to CSV
  exportCallHistoryToCsv: async (filters: CallHistoryFilters = {}): Promise<Blob> => {
    return await api.get<Blob>('/api/analytics/calls/export/csv', {
      params: filters,
      responseType: 'blob',
    });
  },

  // Get flow-specific analytics
  getFlowAnalytics: async (
    flowId: number,
    startDate?: string,
    endDate?: string
  ): Promise<FlowAnalytics> => {
    return await api.get<FlowAnalytics>(`/api/analytics/flows/${flowId}/analytics`, {
      params: { startDate, endDate },
    });
  },

  // Get agent performance metrics
  getAgentPerformance: async (
    startDate?: string,
    endDate?: string
  ): Promise<AgentPerformance[]> => {
    return await api.get<AgentPerformance[]>('/api/analytics/agents/performance', {
      params: { startDate, endDate },
    });
  },

  // Call back a caller from call history (click-to-call)
  callbackCaller: async (request: CallbackCallerRequest): Promise<CallbackCallerResponse> => {
    return await api.post<CallbackCallerResponse>('/api/analytics/calls/callback', request);
  },
};
