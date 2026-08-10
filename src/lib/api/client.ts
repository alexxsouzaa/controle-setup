let $id = 0;
export const uid = (prefix: string): string => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
export const nowISO = (): string => new Date().toISOString();
export const nowDate = (): string => new Date().toISOString().slice(0, 10);

// Identidade do usuário autenticado (síncrono, preenchido pelo listener de auth).
let authIdentity: string | null = null;
export function setAuthIdentity(name: string | null): void {
  authIdentity = name;
}

export const getUser = (): string => {
  if (authIdentity) return authIdentity;
  try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; }
};
