import { api } from '../api-client';

export interface PhoneNumber {
  id: number;
  number: string;
  friendlyName?: string;
  type: string;
  isActive: boolean;
  isPrimary: boolean;
  capabilities?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumberDropdown {
  id: number;
  number: string;
  label: string;
  isPrimary: boolean;
}

export const phoneNumbersApi = {
  /**
   * Get all phone numbers
   */
  async getAllPhoneNumbers(includeInactive = false): Promise<PhoneNumber[]> {
    return await api.get<PhoneNumber[]>('/api/phone-numbers', {
      params: { includeInactive },
    });
  },

  /**
   * Get phone numbers for dropdown
   */
  async getPhoneNumbersForDropdown(): Promise<PhoneNumberDropdown[]> {
    return await api.get<PhoneNumberDropdown[]>('/api/phone-numbers/dropdown');
  },

  /**
   * Get phone number by ID
   */
  async getPhoneNumberById(id: number): Promise<PhoneNumber> {
    return await api.get<PhoneNumber>(`/api/phone-numbers/${id}`);
  },

  /**
   * Create or update phone number
   */
  async upsertPhoneNumber(data: {
    number: string;
    friendlyName?: string;
    type?: string;
    isActive?: boolean;
    isPrimary?: boolean;
    capabilities?: any;
    metadata?: any;
  }): Promise<PhoneNumber> {
    return await api.post<PhoneNumber>('/api/phone-numbers', data);
  },

  /**
   * Update phone number
   */
  async updatePhoneNumber(
    id: number,
    data: {
      friendlyName?: string;
      type?: string;
      isActive?: boolean;
      isPrimary?: boolean;
      capabilities?: any;
      metadata?: any;
    }
  ): Promise<PhoneNumber> {
    return await api.put<PhoneNumber>(`/api/phone-numbers/${id}`, data);
  },

  /**
   * Delete phone number
   */
  async deletePhoneNumber(id: number): Promise<void> {
    await api.delete(`/api/phone-numbers/${id}`);
  },

  /**
   * Auto-discover phone numbers from call logs
   */
  async discoverPhoneNumbers(): Promise<{ discovered: number; total: number }> {
    return await api.post<{ discovered: number; total: number }>(
      '/api/phone-numbers/discover'
    );
  },

  /**
   * Get primary phone number
   */
  async getPrimaryPhoneNumber(): Promise<PhoneNumber | null> {
    return await api.get<PhoneNumber>('/api/phone-numbers/primary/current');
  },
};
