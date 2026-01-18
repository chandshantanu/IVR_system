import { api } from '../api-client';

/**
 * Sync call data response
 */
export interface SyncCallsResponse {
  message: string;
  success: boolean;
  syncedCount?: number;
  errorCount?: number;
  totalCalls?: number;
  call?: any;
}

/**
 * Exotel user device information
 */
export interface ExotelDevice {
  id: string;
  device_id: string;
  user_id: string;
  contact_uri: string;
  verified: boolean;
  device_type: string;
  app_version: string | null;
  device_status: string;
  availability: string;
}

/**
 * Exotel active call information
 */
export interface ExotelActiveCall {
  call_id: string;
  status: string;
  direction: string;
  from: string;
  to: string;
  start_time: string;
  duration: number;
}

/**
 * Exotel user (agent) information
 */
export interface ExotelUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  available_status: string;
  devices?: ExotelDevice[];
  active_call?: ExotelActiveCall | null;
}

/**
 * Get Exotel users response
 */
export interface GetUsersResponse {
  message: string;
  users: ExotelUser[];
  count?: number;
}

/**
 * Exotel API client for manual operations
 */
export const exotelApi = {
  /**
   * Manually sync call data from Exotel API to database
   * Useful when webhooks are not working (local dev, testing)
   * @param callSid Optional specific call SID to sync
   * @returns Sync result
   */
  syncCalls: async (callSid?: string): Promise<SyncCallsResponse> => {
    const params: Record<string, any> = {};
    if (callSid) {
      params.callSid = callSid;
    }

    return await api.post<SyncCallsResponse>('/api/exotel/sync-calls', undefined, { params });
  },

  /**
   * Get Exotel users (agents) with device and call status
   * @param includeActiveCall Include active call information (default: true)
   * @returns List of Exotel users with their status
   */
  getUsers: async (includeActiveCall: boolean = true): Promise<GetUsersResponse> => {
    const params: Record<string, any> = {
      includeActiveCall: includeActiveCall.toString(),
    };

    return await api.get<GetUsersResponse>('/api/exotel/users', { params });
  },
};
