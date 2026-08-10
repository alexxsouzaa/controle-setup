let $id = 0;
export const uid = (prefix: string): string => { $id++; return `${prefix}-${Date.now()}-${$id}`; };
export const nowISO = (): string => new Date().toISOString();
export const nowDate = (): string => new Date().toISOString().slice(0, 10);
export const getUser = (): string => {
  try { return localStorage.getItem('cs-user') || 'Operador'; } catch { return 'Operador'; }
};
