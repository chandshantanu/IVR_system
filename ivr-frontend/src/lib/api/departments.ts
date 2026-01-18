import { api } from '../api-client';

export interface Department {
  id: number;
  name: string;
  description?: string;
  managerId?: number;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: number;
    username: string;
    fullName?: string;
    email: string;
  };
  agents?: Agent[];
}

export interface Agent {
  id: number;
  agentName: string;
  agentNumber: string;
  email?: string;
  status: string;
  skills?: any;
  maxConcurrentCalls: number;
  priority: number;
  createdAt: string;
}

export interface DepartmentDropdown {
  id: number;
  name: string;
}

export interface DepartmentStatistics {
  departmentId: number;
  departmentName: string;
  totalAgents: number;
  activeAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalCalls: number;
  completedCalls: number;
  avgWaitTimeSeconds: number;
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  managerId?: number;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  managerId?: number;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
}

export const departmentsApi = {
  /**
   * Get all departments
   */
  getAll: async (includeInactive = false): Promise<Department[]> => {
    return await api.get<Department[]>('/api/departments', {
      params: { includeInactive },
    });
  },

  /**
   * Get department dropdown list (simplified)
   */
  getDropdownList: async (): Promise<DepartmentDropdown[]> => {
    return await api.get<DepartmentDropdown[]>('/api/departments/dropdown');
  },

  /**
   * Get department by ID
   */
  getById: async (id: number): Promise<Department> => {
    return await api.get<Department>(`/api/departments/${id}`);
  },

  /**
   * Get department statistics
   */
  getStatistics: async (id: number): Promise<DepartmentStatistics> => {
    return await api.get<DepartmentStatistics>(`/api/departments/${id}/statistics`);
  },

  /**
   * Create a new department
   */
  create: async (data: CreateDepartmentDto): Promise<Department> => {
    return await api.post<Department>('/api/departments', data);
  },

  /**
   * Update department
   */
  update: async (id: number, data: UpdateDepartmentDto): Promise<Department> => {
    return await api.put<Department>(`/api/departments/${id}`, data);
  },

  /**
   * Delete department (soft delete)
   */
  delete: async (id: number): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/api/departments/${id}`);
  },
};
