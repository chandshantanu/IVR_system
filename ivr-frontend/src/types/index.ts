// User types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// IVR Flow types
export interface IvrFlow {
  id: number;
  name: string;
  description?: string;
  flowType: string;
  status: 'draft' | 'active' | 'archived';
  version: number;
  isPublished: boolean;
  entryNodeId?: number;
  configuration?: any;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Agent types
export interface Agent {
  id: number;
  agentNumber: string;
  agentName: string;
  email?: string;
  department?: string;
  skills?: string[];
  status: 'online' | 'offline' | 'busy' | 'on_call';
  maxConcurrentCalls: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

// Queue types
export interface Queue {
  id: number;
  name: string;
  description?: string;
  maxSize: number;
  maxWaitTimeSeconds: number;
  strategy: string;
  createdAt: string;
  updatedAt: string;
}

// Callback types
export interface SmsCallback {
  id: number;
  smsSid?: string;
  toNumber?: string;
  status?: string;
  detailedStatus?: string;
  createdAt: string;
}

export interface VoiceCallback {
  id: number;
  callSid?: string;
  toNumber?: string;
  fromNumber?: string;
  status?: string;
  duration?: string;
  recordingUrl?: string;
  createdAt: string;
}

// Dashboard stats
export interface DashboardStats {
  totalFlows: number;
  activeFlows: number;
  totalAgents: number;
  onlineAgents: number;
  totalCalls: number;
  activeCalls: number;
  recentCalls: VoiceCallback[];
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
