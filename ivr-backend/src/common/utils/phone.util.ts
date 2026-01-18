/**
 * Phone number utility functions
 */

/**
 * Mask phone number by replacing every alternate digit with 'x'
 * Example: "9876543210" becomes "9x7x5x3x1x"
 * Example: "+919876543210" becomes "+x1x8x6x4x2x0"
 *
 * @param phoneNumber - The phone number to mask
 * @returns Masked phone number with alternate digits replaced by 'x'
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    return '';
  }

  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < phoneNumber.length; i++) {
    const char = phoneNumber[i];

    // Check if character is a digit
    if (/\d/.test(char)) {
      // Replace every alternate digit (0th, 2nd, 4th, etc.) with 'x'
      if (digitIndex % 2 === 0) {
        result += 'x';
      } else {
        result += char;
      }
      digitIndex++;
    } else {
      // Keep non-digit characters as-is (like +, -, spaces, parentheses)
      result += char;
    }
  }

  return result;
}

/**
 * Unmask phone number (not implemented - masking is one-way for privacy)
 * @param maskedNumber - The masked phone number
 * @returns Original phone number (not recoverable)
 */
export function unmaskPhoneNumber(maskedNumber: string): string {
  throw new Error('Phone number masking is one-way and cannot be reversed');
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber - The phone number to format
 * @param countryCode - Default country code (default: '91' for India)
 * @returns Formatted phone number in E.164 format
 */
export function formatToE164(phoneNumber: string, countryCode: string = '91'): string {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // Check if already has country code by checking length
  // Standard phone number is 10 digits, with country code it's 10 + country code length
  const expectedLengthWithCountryCode = countryCode.length + 10;

  if (digitsOnly.length === expectedLengthWithCountryCode && digitsOnly.startsWith(countryCode)) {
    // Already has country code
    return `+${digitsOnly}`;
  }

  // Add country code
  return `+${countryCode}${digitsOnly}`;
}

/**
 * Validate if phone number is valid (basic validation)
 * @param phoneNumber - The phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) {
    return false;
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // Check if it has at least 10 digits (minimum for valid phone number)
  return digitsOnly.length >= 10;
}
