import admin from 'firebase-admin';
import { logger } from '@/lib/logger';
import { redactObject } from '@/lib/redactor';

export interface UserChecklistRecord {
  userId: string;
  schemeId: string;
  checkedDocumentIds: string[];
  updatedAt: string;
}

// In-memory fallback repository when Firestore is disabled or not configured
const inMemoryStore = new Map<string, UserChecklistRecord>();

let firestoreDb: admin.firestore.Firestore | null = null;

function getFirestoreDb(): admin.firestore.Firestore | null {
  const isEnabled = process.env.ENABLE_FIRESTORE === 'true';
  if (!isEnabled) return null;

  if (firestoreDb) return firestoreDb;

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'sevasetu-demo',
      });
    }
    firestoreDb = admin.firestore();
    return firestoreDb;
  } catch (err) {
    logger.warn('Failed to initialize firebase-admin, using in-memory store fallback', err);
    return null;
  }
}

/**
 * Saves a user checklist progress record securely.
 */
export async function saveUserChecklist(record: UserChecklistRecord): Promise<void> {
  const sanitizedRecord = redactObject(record);
  const db = getFirestoreDb();

  if (!db) {
    // In-memory fallback
    const key = `${record.userId}:${record.schemeId}`;
    inMemoryStore.set(key, sanitizedRecord);
    logger.info(`Saved checklist to in-memory store for user ${record.userId}`);
    return;
  }

  try {
    await db
      .collection('users')
      .doc(record.userId)
      .collection('checklists')
      .doc(record.schemeId)
      .set(sanitizedRecord);
    logger.info(`Persisted checklist to Cloud Firestore for user ${record.userId}`);
  } catch (err) {
    logger.error('Error saving checklist to Firestore, falling back to in-memory store', err);
    const key = `${record.userId}:${record.schemeId}`;
    inMemoryStore.set(key, sanitizedRecord);
  }
}

/**
 * Retrieves a user checklist progress record.
 */
export async function getUserChecklist(
  userId: string,
  schemeId: string,
): Promise<UserChecklistRecord | null> {
  const db = getFirestoreDb();

  if (!db) {
    const key = `${userId}:${schemeId}`;
    return inMemoryStore.get(key) || null;
  }

  try {
    const doc = await db
      .collection('users')
      .doc(userId)
      .collection('checklists')
      .doc(schemeId)
      .get();
    if (!doc.exists) return null;
    return doc.data() as UserChecklistRecord;
  } catch (err) {
    logger.error('Error retrieving from Firestore, falling back to in-memory store', err);
    const key = `${userId}:${schemeId}`;
    return inMemoryStore.get(key) || null;
  }
}
