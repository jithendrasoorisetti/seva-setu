/**
 * Sensitive Data Redactor
 * Masks 12-digit numbers (Aadhaar formats) and PAN patterns before logging or storage.
 * In accordance with UIDAI regulations and SevaSetu security policy.
 */

// Matches 12-digit numbers with optional spaces or hyphens: e.g. 1234 5678 9012 or 1234-5678-9012 or 123456789012
const AADHAAR_REGEX = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g;

// Matches Indian Permanent Account Number (PAN): 5 uppercase letters, 4 digits, 1 uppercase letter
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi;

// Matches 10-digit phone numbers with optional country code (+91)
const PHONE_REGEX = /(?:\+91[ -]?)?[6-9]\d{9}\b/g;

/**
 * Redacts sensitive identification data from any string.
 */
export function redactSensitiveData(input: string): string {
  if (!input || typeof input !== 'string') return input;

  return input
    .replace(AADHAAR_REGEX, (match) => {
      const digitsOnly = match.replace(/[\s-]/g, '');
      const last4 = digitsOnly.slice(-4);
      return `[REDACTED-ID-XXXX-XXXX-${last4}]`;
    })
    .replace(PAN_REGEX, '[REDACTED-PAN]')
    .replace(PHONE_REGEX, (match) => {
      const clean = match.replace(/[\s-+]/g, '');
      const last3 = clean.slice(-3);
      return `[REDACTED-PHONE-XXX-${last3}]`;
    });
}

/**
 * Deeply traverses an object or array and redacts any string fields.
 */
export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactSensitiveData(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const redactedRecord: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      redactedRecord[key] = redactObject(val);
    }
    return redactedRecord as T;
  }

  return obj;
}
