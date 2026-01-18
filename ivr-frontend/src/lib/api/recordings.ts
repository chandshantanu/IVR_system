import { api } from '../api-client';
import { env } from '../env';

export interface RecordingMetadata {
  callSid: string;
  hasRecording: boolean;
  recordingUrl: string | null;
  status: string;
  duration: string;
  startTime: string;
  endTime: string;
  fromNumber: string;
  toNumber: string;
  direction: string;
  createdAt: string;
}

export interface CallWithRecording {
  id: number;
  callSid: string;
  status: string;
  duration: string;
  startTime: string;
  endTime: string;
  fromNumber: string;
  toNumber: string;
  direction: string;
  createdAt: string;
  recordingUrl: string;
}

export interface RecordingsListResponse {
  calls: CallWithRecording[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordingsFilters {
  startDate?: string;
  endDate?: string;
  direction?: 'inbound' | 'outbound';
  phoneNumber?: string;
  page?: number;
  limit?: number;
}

export const recordingsApi = {
  /**
   * Get recording stream URL for audio player
   * @param callSid Unique call identifier
   * @returns Full URL to stream endpoint
   */
  getRecordingStreamUrl: (callSid: string): string => {
    const baseUrl = env.apiUrl;
    const token = localStorage.getItem('accessToken');
    return `${baseUrl}/api/exotel/recordings/${callSid}/stream?token=${token}`;
  },

  /**
   * Get recording metadata
   * @param callSid Unique call identifier
   * @returns Recording metadata and call details
   */
  getRecordingMetadata: async (callSid: string): Promise<RecordingMetadata> => {
    return await api.get<RecordingMetadata>(`/api/exotel/recordings/${callSid}/metadata`);
  },

  /**
   * Get list of calls with recordings
   * @param filters Optional filters for the query
   * @returns Paginated list of calls with recordings
   */
  getCallsWithRecordings: async (filters: RecordingsFilters = {}): Promise<RecordingsListResponse> => {
    const { page, limit = 20, ...rest } = filters;
    const offset = page ? (page - 1) * limit : 0;

    const params: Record<string, any> = {};
    if (rest.startDate) params.startDate = rest.startDate;
    if (rest.endDate) params.endDate = rest.endDate;
    if (rest.direction) params.direction = rest.direction;
    if (rest.phoneNumber) params.phoneNumber = rest.phoneNumber;
    params.limit = limit;
    params.offset = offset;

    return await api.get<RecordingsListResponse>('/api/exotel/recordings', { params });
  },

  /**
   * Delete recording reference from database
   * Note: This doesn't delete from Exotel, only removes the reference
   * @param callSid Unique call identifier
   */
  deleteRecordingReference: async (callSid: string): Promise<{ message: string }> => {
    return await api.delete<{ message: string }>(`/api/exotel/recordings/${callSid}`);
  },
};
