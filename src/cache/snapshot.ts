import fs from 'fs';
import crypto from 'crypto';
import { ITranslationContent, ISnapshot, IDiffResult } from '../types/types';

export function flattenContent(
  content: ITranslationContent,
  prefix = ''
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(content)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenContent(value as ITranslationContent, fullKey));
    }
  }
  return result;
}

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function createSnapshot(content: ITranslationContent, baseLanguage: string): ISnapshot {
  const flat = flattenContent(content);
  const entries: ISnapshot['entries'] = {};
  for (const [key, value] of Object.entries(flat)) {
    entries[key] = { value, hash: hashValue(value) };
  }
  return {
    version: 1,
    baseLanguage,
    createdAt: new Date().toISOString(),
    entries,
  };
}

export function loadSnapshot(snapshotPath: string): ISnapshot | null {
  if (!fs.existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8')) as ISnapshot;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshotPath: string, snapshot: ISnapshot): void {
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
}

export function diffAgainstSnapshot(
  currentContent: ITranslationContent,
  priorSnapshot: ISnapshot | null
): IDiffResult {
  const currentFlat = flattenContent(currentContent);

  if (priorSnapshot === null) {
    return {
      added: { ...currentFlat },
      modified: {},
      deleted: [],
      unchanged: {},
    };
  }

  const result: IDiffResult = { added: {}, modified: {}, deleted: [], unchanged: {} };

  for (const [key, value] of Object.entries(currentFlat)) {
    if (!(key in priorSnapshot.entries)) {
      result.added[key] = value;
    } else if (hashValue(value) !== priorSnapshot.entries[key].hash) {
      result.modified[key] = value;
    } else {
      result.unchanged[key] = value;
    }
  }

  for (const key of Object.keys(priorSnapshot.entries)) {
    if (!(key in currentFlat)) {
      result.deleted.push(key);
    }
  }

  return result;
}

function setNestedValue(obj: ITranslationContent, dotKey: string, value: string): void {
  const parts = dotKey.split('.');
  let current: ITranslationContent = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as ITranslationContent;
  }
  current[parts[parts.length - 1]] = value;
}

function deleteNestedValue(obj: ITranslationContent, dotKey: string): void {
  const parts = dotKey.split('.');
  let current: ITranslationContent = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== 'object') return;
    current = current[part] as ITranslationContent;
  }
  delete current[parts[parts.length - 1]];
}

function deepClone(obj: ITranslationContent): ITranslationContent {
  return JSON.parse(JSON.stringify(obj));
}

export function applyDiff(
  existingTarget: ITranslationContent,
  diff: IDiffResult,
  translatedAdditions: Record<string, string>,
  translatedModifications: Record<string, string>
): ITranslationContent {
  const result = deepClone(existingTarget);

  for (const [key, value] of Object.entries(translatedAdditions)) {
    setNestedValue(result, key, value);
  }

  for (const [key, value] of Object.entries(translatedModifications)) {
    setNestedValue(result, key, value);
  }

  for (const key of diff.deleted) {
    deleteNestedValue(result, key);
  }

  return result;
}
