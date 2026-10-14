import schemesRaw from '@/../data/schemes.json';
import { SchemesListSchema, Scheme } from '@/schemas/scheme';

let cachedSchemes: Scheme[] | null = null;

/**
 * Returns validated list of welfare schemes loaded from data/schemes.json.
 * Validates with Zod schema on initial invocation.
 */
export function getAllSchemes(): Scheme[] {
  if (cachedSchemes) {
    return cachedSchemes;
  }
  const parsed = SchemesListSchema.safeParse(schemesRaw);
  if (!parsed.success) {
    throw new Error(
      `Invalid scheme data in data/schemes.json: ${JSON.stringify(parsed.error.format())}`,
    );
  }
  cachedSchemes = parsed.data;
  return cachedSchemes;
}

/**
 * Retrieves a scheme by its unique identifier.
 */
export function getSchemeById(id: string): Scheme | undefined {
  const schemes = getAllSchemes();
  return schemes.find((s) => s.id === id);
}

/**
 * Checks whether any scheme in the repository currently holds UNVERIFIED status.
 * Per specification: A visible banner must appear whenever any scheme is UNVERIFIED.
 */
export function hasUnverifiedSchemes(): boolean {
  const schemes = getAllSchemes();
  return schemes.some((s) => s.data_status === 'UNVERIFIED');
}

/**
 * Returns summary stats for data verification audit.
 */
export function getVerificationStatusSummary() {
  const schemes = getAllSchemes();
  const unverified = schemes.filter((s) => s.data_status === 'UNVERIFIED');
  return {
    total: schemes.length,
    verifiedCount: schemes.length - unverified.length,
    unverifiedCount: unverified.length,
    hasUnverified: unverified.length > 0,
    unverifiedIds: unverified.map((s) => s.id),
  };
}
