import type { HistoryEntry } from './types';

/**
 * Why IndexedDB instead of the localStorage-JSON-blob pattern every other
 * PlourX service uses (bookmarks, preferences, tabs): history gets a write
 * on nearly every page load -- potentially thousands of rows over weeks --
 * and needs date-range queries. A JSON blob would mean a synchronous full
 * parse + stringify of the *entire* history on every single navigation,
 * against a real ~5MB-per-origin localStorage quota. IndexedDB gives
 * indexed range reads and off-main-thread-friendly writes with no added
 * dependency (this is a small hand-rolled wrapper over the native API).
 */
const DB_NAME = 'plourx-browser-history';
const DB_VERSION = 1;
const STORE = 'history';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('visitedAt', 'visitedAt');
        store.createIndex('url', 'url');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addEntry(entry: HistoryEntry): Promise<void> {
  await withStore('readwrite', (store) => store.put(entry));
}

export async function deleteEntry(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

/** All entries, most-recent-first. Fine at MVP scale (client-side sort of an indexed cursor read); paginate here first if history ever needs to scale past low tens of thousands of rows. */
export async function getAllEntries(): Promise<HistoryEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index('visitedAt');
    const results: HistoryEntry[] = [];
    const request = index.openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        results.push(cursor.value as HistoryEntry);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEntriesSince(sinceTimestamp: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const index = tx.objectStore(STORE).index('visitedAt');
    const range = IDBKeyRange.lowerBound(sinceTimestamp);
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAll(): Promise<void> {
  await withStore('readwrite', (store) => store.clear());
}
