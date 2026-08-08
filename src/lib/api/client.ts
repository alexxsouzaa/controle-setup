import { getStorage, updateStorageEntity, type StorageData } from '../storage';

// URL do Google Apps Script (Web App). Configure em .env:
// VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
export const APPS_SCRIPT_URL: string = (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

export function isApiEnabled(): boolean {
  return APPS_SCRIPT_URL.length > 0;
}

export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface RequestOptions {
  id?: string;
  body?: object;
}

// Chama o Web App do Apps Script (entity + action). Nunca usa JSON como
// Content-Type (quebraria o redirect do Apps Script): envia text/plain.
export async function apiRequest<T = unknown>(entity: string, action: string, opts: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams({ entity, action });
  if (opts.id) params.set('id', opts.id);
  const url = `${APPS_SCRIPT_URL}?${params.toString()}`;

  const res = await fetch(url, {
    method: opts.body ? 'POST' : 'GET',
    redirect: 'follow',
    headers: opts.body ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    throw new ApiError('HTTP_ERROR', `Erro HTTP ${res.status} ao acessar a API.`);
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('INVALID_RESPONSE', 'Resposta inválida da API.');
  }

  if (!json.success) {
    throw new ApiError(json.error?.code ?? 'API_ERROR', json.error?.message ?? 'Erro desconhecido da API.');
  }
  return json.data as T;
}

export type StorageDataKey = keyof StorageData;

let $id = 0;
export const uid = (prefix: string): string => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
export const nowISO = (): string => new Date().toISOString();
export const nowDate = (): string => new Date().toISOString().slice(0, 10);
export const getUser = (): string => {
  try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; }
};

// ---- Fallback localStorage (modo desenvolvimento / API não configurada) ----

export function localList<K extends StorageDataKey>(key: K): StorageData[K] {
  return getStorage()[key];
}

export function localGet<K extends StorageDataKey>(key: K, id: string): StorageData[K][number] {
  const found = (getStorage()[key] as Array<{ id: string }>).find((item) => item.id === id);
  if (!found) throw new ApiError('NOT_FOUND', `Registro "${id}" não encontrado.`);
  return found as StorageData[K][number];
}

export function localCreate<K extends StorageDataKey>(key: K, data: StorageData[K][number]): StorageData[K][number] {
  updateStorageEntity(key, (prev) => {
    const list = prev as unknown as Array<StorageData[K][number]>;
    return [...list, data] as unknown as StorageData[K];
  });
  return data;
}

export function localUpdate<K extends StorageDataKey>(key: K, id: string, updates: Partial<StorageData[K][number]>): void {
  updateStorageEntity(key, (prev) => {
    const list = prev as unknown as Array<StorageData[K][number]>;
    return list.map((item) => ((item as { id: string }).id === id ? { ...item, ...updates } : item)) as unknown as StorageData[K];
  });
}

export function localRemove<K extends StorageDataKey>(key: K, id: string): void {
  updateStorageEntity(key, (prev) => {
    const list = prev as unknown as Array<StorageData[K][number]>;
    return list.filter((item) => (item as { id: string }).id !== id) as unknown as StorageData[K];
  });
}

export function localRemoveMany<K extends StorageDataKey>(key: K, ids: string[]): void {
  const set = new Set(ids);
  updateStorageEntity(key, (prev) => {
    const list = prev as unknown as Array<StorageData[K][number]>;
    return list.filter((item) => !set.has((item as { id: string }).id)) as unknown as StorageData[K];
  });
}
