'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api-client';

interface PhoneNumber {
  id: number;
  number: string;
  label: string;
  isPrimary: boolean;
}

interface PhoneNumberSelectorProps {
  onPhoneNumberChange: (phoneNumber: string | null) => void;
  selectedPhoneNumber?: string | null;
  className?: string;
}

export function PhoneNumberSelector({
  onPhoneNumberChange,
  selectedPhoneNumber,
  className = '',
}: PhoneNumberSelectorProps) {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      setError(null);

      const phoneNumbers = await api.get<PhoneNumber[]>('/api/phone-numbers/dropdown');
      setPhoneNumbers(phoneNumbers);

      // Auto-select primary phone number if no selection
      if (!selectedPhoneNumber && phoneNumbers.length > 0) {
        const primary = phoneNumbers.find(p => p.isPrimary);
        if (primary) {
          onPhoneNumberChange(primary.number);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch phone numbers:', err);
      setError('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onPhoneNumberChange(value === 'all' ? null : value);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">Phone Number:</label>
        <div className="animate-pulse bg-gray-200 h-10 w-64 rounded-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">Phone Number:</label>
        <div className="text-sm text-red-600">{error}</div>
        <button
          onClick={fetchPhoneNumbers}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (phoneNumbers.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">Phone Number:</label>
        <div className="text-sm text-gray-500">No phone numbers configured</div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="phone-number-select" className="text-sm font-medium text-gray-700">
        Phone Number:
      </label>
      <select
        id="phone-number-select"
        value={selectedPhoneNumber || 'all'}
        onChange={handlePhoneNumberChange}
        className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
      >
        <option value="all">All Phone Numbers</option>
        {phoneNumbers.map((phone) => (
          <option key={phone.id} value={phone.number}>
            {phone.label}
            {phone.isPrimary && ' (Primary)'}
          </option>
        ))}
      </select>

      {phoneNumbers.length > 0 && (
        <span className="text-xs text-gray-500">
          {selectedPhoneNumber ? '1 selected' : `All ${phoneNumbers.length} numbers`}
        </span>
      )}
    </div>
  );
}

export default PhoneNumberSelector;
