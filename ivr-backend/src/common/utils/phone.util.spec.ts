import {
  maskPhoneNumber,
  formatToE164,
  isValidPhoneNumber,
} from './phone.util';

describe('Phone Utility Functions', () => {
  describe('maskPhoneNumber', () => {
    it('should mask every alternate digit with x', () => {
      expect(maskPhoneNumber('9876543210')).toBe('x8x6x4x2x0');
    });

    it('should mask phone number with country code', () => {
      expect(maskPhoneNumber('+919876543210')).toBe('+x1x8x6x4x2x0');
    });

    it('should handle phone numbers with dashes', () => {
      expect(maskPhoneNumber('987-654-3210')).toBe('x8x-6x4-x2x0');
    });

    it('should handle phone numbers with spaces', () => {
      expect(maskPhoneNumber('987 654 3210')).toBe('x8x 6x4 x2x0');
    });

    it('should handle phone numbers with parentheses', () => {
      expect(maskPhoneNumber('(987) 654-3210')).toBe('(x8x) 6x4-x2x0');
    });

    it('should return empty string for null/undefined input', () => {
      expect(maskPhoneNumber(null as any)).toBe('');
      expect(maskPhoneNumber(undefined as any)).toBe('');
      expect(maskPhoneNumber('')).toBe('');
    });

    it('should mask short phone numbers correctly', () => {
      expect(maskPhoneNumber('12345')).toBe('x2x4x');
    });

    it('should mask long phone numbers correctly', () => {
      expect(maskPhoneNumber('1234567890123456')).toBe('x2x4x6x8x0x2x4x6');
    });

    it('should preserve non-digit characters', () => {
      expect(maskPhoneNumber('+91-9876543210')).toBe('+x1-x8x6x4x2x0');
    });
  });

  describe('formatToE164', () => {
    it('should format Indian phone number to E.164', () => {
      expect(formatToE164('9876543210')).toBe('+919876543210');
    });

    it('should handle phone number already with country code', () => {
      expect(formatToE164('919876543210')).toBe('+919876543210');
    });

    it('should handle phone number with + prefix', () => {
      expect(formatToE164('+919876543210')).toBe('+919876543210');
    });

    it('should remove dashes and spaces', () => {
      expect(formatToE164('987-654-3210')).toBe('+919876543210');
      expect(formatToE164('987 654 3210')).toBe('+919876543210');
    });

    it('should use custom country code', () => {
      expect(formatToE164('1234567890', '1')).toBe('+11234567890');
    });

    it('should handle phone numbers with parentheses', () => {
      expect(formatToE164('(987) 654-3210')).toBe('+919876543210');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('9876543210')).toBe(true);
      expect(isValidPhoneNumber('+919876543210')).toBe(true);
      expect(isValidPhoneNumber('987-654-3210')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('12345')).toBe(false);
      expect(isValidPhoneNumber('')).toBe(false);
      expect(isValidPhoneNumber(null as any)).toBe(false);
      expect(isValidPhoneNumber(undefined as any)).toBe(false);
    });

    it('should accept minimum 10 digit phone numbers', () => {
      expect(isValidPhoneNumber('1234567890')).toBe(true);
      expect(isValidPhoneNumber('123456789')).toBe(false);
    });

    it('should ignore non-digit characters when counting', () => {
      expect(isValidPhoneNumber('(987) 654-3210')).toBe(true);
      expect(isValidPhoneNumber('+91 987 654 3210')).toBe(true);
    });
  });
});
