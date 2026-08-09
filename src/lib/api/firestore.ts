import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { db } from '../firebase';
import { uid } from './client';
import type { Config } from '../../types';

// db só é inicializado quando a config do Firebase está presente nas env vars.
// Os helpers abaixo só são chamados quando useFirestore é true (gate em endpoints.ts).
const d = db as Firestore;

// Remove campos undefined (o Firestore rejeita undefined em escritas).
function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[key] = clean(v);
    }
    return out as T;
  }
  return value;
}

export async function fsList<T>(col: string): Promise<T[]> {
  const snap = await getDocs(collection(d, col));
  return snap.docs.map((docSnap) => docSnap.data() as T);
}

export async function fsGet<T>(col: string, id: string): Promise<T> {
  const snap = await getDoc(doc(d, col, id));
  if (!snap.exists()) throw new Error(`Registro "${id}" não encontrado.`);
  return snap.data() as T;
}

export async function fsCreate<T extends { id?: string }>(col: string, data: T): Promise<T> {
  const id = data.id ?? uid(col.slice(0, 3));
  await setDoc(doc(d, col, id), clean({ ...data, id }));
  return { ...data, id } as T;
}

export async function fsUpdate(col: string, id: string, updates: Record<string, unknown>): Promise<void> {
  await setDoc(doc(d, col, id), clean(updates), { merge: true });
}

export async function fsRemove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(d, col, id));
}

export async function fsRemoveMany(col: string, ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(d);
    ids.slice(i, i + 500).forEach((id) => batch.delete(doc(d, col, id)));
    await batch.commit();
  }
}

// Substitui todos os documentos da coleção (usado na importação).
export async function fsReplaceAll(col: string, items: unknown[]): Promise<number> {
  const existing = await fsList<{ id: string }>(col);
  for (let i = 0; i < existing.length; i += 500) {
    const batch = writeBatch(d);
    existing.slice(i, i + 500).forEach((item) => batch.delete(doc(d, col, item.id)));
    await batch.commit();
  }
  for (let i = 0; i < items.length; i += 500) {
    const batch = writeBatch(d);
    items.slice(i, i + 500).forEach((item) => {
      const record = item as { id?: string };
      const id = record.id ?? uid(col.slice(0, 3));
      batch.set(doc(d, col, id), clean({ ...record, id }));
    });
    await batch.commit();
  }
  return items.length;
}

// Apaga todos os documentos das coleções informadas (usado no reset do sistema).
export async function fsClearAll(cols: string[]): Promise<void> {
  for (const col of cols) {
    const existing = await fsList<{ id: string }>(col);
    for (let i = 0; i < existing.length; i += 500) {
      const batch = writeBatch(d);
      existing.slice(i, i + 500).forEach((item) => batch.delete(doc(d, col, item.id)));
      await batch.commit();
    }
  }
}

// ---- Configuração (documento único "app_config" na coleção "config") ----

const CONFIG_DOC = 'app_config';

export async function fsGetConfig(): Promise<Config> {
  const snap = await getDoc(doc(d, 'config', CONFIG_DOC));
  if (!snap.exists()) return { uoConfigs: {} };
  return snap.data() as Config;
}

export async function fsUpdateConfig(updates: Partial<Config>): Promise<Config> {
  const current = await fsGetConfig();
  const next: Config = { ...current, ...updates };
  await setDoc(doc(d, 'config', CONFIG_DOC), clean(next));
  return next;
}
