import { sessionSchema } from "./session-validation.ts";
import { isValidFocus, normalizeConfig, type Config, type Session } from "./quant-engine.ts";

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
const MAX_BACKUP_SESSIONS = 10000;
export type Backup = { format: "quantgym-backup"; version: 1; exportedAt: string; sessions: Session[]; preferences?: Config };

export function validPreferences(value: unknown): Config | undefined {
  if (!value || typeof value !== "object") return;
  const config = value as Config;
  if (!["sprint", "adaptive", "challenge", "practice"].includes(config.mode) || !isValidFocus(config.focus) || ![1, 2, 3].includes(config.level)) return;
  return normalizeConfig({ mode: config.mode, focus: config.focus, level: config.level, answerMode: config.answerMode, multiplicationStage: config.multiplicationStage });
}

export function mergeRecords(...groups: Session[][]): Session[] {
  const records = new Map<string, Session>();
  for (const group of groups) for (const value of group) {
    const session = sessionSchema.parse(value) as Session;
    const previous = records.get(session.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(session)) throw new Error(`Conflicting versions of session ${session.id}. Existing records were kept.`);
    records.set(session.id, session);
  }
  return [...records.values()].sort((a, b) => b.startedAt - a.startedAt || a.id.localeCompare(b.id));
}

export function encodeBackup(sessions: Session[], preferences?: Config): string {
  const records = mergeRecords(sessions);
  if (records.length > MAX_BACKUP_SESSIONS) throw new Error("This backup exceeds 10,000 sessions. Your stored records remain unchanged.");
  const backup: Backup = { format: "quantgym-backup", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), sessions: records };
  const valid = validPreferences(preferences);
  if (valid) backup.preferences = valid;
  const text = JSON.stringify(backup, null, 2);
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error("This backup exceeds 50 MB. Your stored records remain unchanged.");
  return text;
}

export function decodeBackup(text: string): Backup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new Error("Choose a QuantGym backup smaller than 50 MB.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file is not valid JSON. No data was imported."); }
  if (!raw || typeof raw !== "object") throw new Error("This is not a QuantGym backup.");
  const backup = raw as Partial<Backup>;
  if (backup.format !== "quantgym-backup" || backup.version !== BACKUP_VERSION) throw new Error("This backup format is not supported. No data was imported.");
  if (!Array.isArray(backup.sessions) || backup.sessions.length > MAX_BACKUP_SESSIONS || typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt))) throw new Error("This backup is incomplete or too large. No data was imported.");
  let sessions: Session[];
  try { sessions = mergeRecords(backup.sessions); } catch { throw new Error("The backup contains invalid or conflicting sessions. No data was imported."); }
  return { format: "quantgym-backup", version: 1, exportedAt: backup.exportedAt, sessions, preferences: validPreferences(backup.preferences) };
}

export function storageScope(basePath: string): string {
  return `quantgym:${basePath.endsWith("/") ? basePath : `${basePath}/`}`;
}

function storageError(error: unknown): Error {
  if (error instanceof DOMException && error.name === "QuotaExceededError") return new Error("Device storage is full. Export a backup before clearing any browser data, then retry.");
  return error instanceof Error ? error : new Error("Browser storage is unavailable. Your current results can still be exported.");
}

/** IndexedDB commits are atomic across tabs. The display's 100-row limit never truncates storage. */
export function createLocalStore(name: string, factory: IDBFactory | undefined = globalThis.indexedDB) {
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    if (!factory) return Promise.reject(new Error("This browser cannot save local history. You can still practice and export a backup."));
    if (!connection) connection = new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(name, 1);
      let abandoned = false;
      const timer = setTimeout(() => { abandoned = true; connection = undefined; reject(new Error("Local storage took too long to open. Close other QuantGym tabs and retry.")); }, 8000);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("sessions")) {
          const store = db.createObjectStore("sessions", { keyPath: "id" });
          store.createIndex("startedAt", "startedAt");
        }
      };
      request.onblocked = () => { abandoned = true; clearTimeout(timer); connection = undefined; reject(new Error("Close other QuantGym tabs, then retry opening local history.")); };
      request.onerror = () => { clearTimeout(timer); connection = undefined; reject(storageError(request.error)); };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (abandoned) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); connection = undefined; };
        resolve(request.result);
      };
    }).catch(error => { connection = undefined; throw storageError(error); });
    return connection;
  }
  async function all(): Promise<Session[]> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("sessions", "readonly");
      const request = transaction.objectStore("sessions").getAll();
      let values: unknown[] = [];
      request.onsuccess = () => { values = request.result; };
      transaction.onabort = () => reject(storageError(transaction.error));
      transaction.onerror = () => reject(storageError(transaction.error));
      transaction.oncomplete = () => {
        try { resolve(mergeRecords(values as Session[])); }
        catch { reject(new Error("Some saved records could not be read. They have been kept untouched; this page will not overwrite or erase them.")); }
      };
    });
  }
  async function insert(values: Session[]): Promise<{ imported: number; duplicates: number }> {
    const sessions = mergeRecords(values); // Validate everything before opening a write transaction.
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("sessions", "readwrite"), store = transaction.objectStore("sessions");
      let imported = 0, duplicates = 0, failure: Error | undefined;
      transaction.oncomplete = () => resolve({ imported, duplicates });
      transaction.onabort = () => reject(failure ?? storageError(transaction.error));
      transaction.onerror = () => reject(failure ?? storageError(transaction.error));
      for (const session of sessions) {
        const request = store.get(session.id);
        request.onsuccess = () => {
          try {
            if (request.result !== undefined) { mergeRecords([request.result], [session]); duplicates++; }
            else { store.add(session); imported++; }
          } catch (error) { failure = storageError(error); transaction.abort(); }
        };
      }
    });
  }
  return { all, insert, close: async () => { const db = connection ? await connection : undefined; db?.close(); connection = undefined; } };
}
