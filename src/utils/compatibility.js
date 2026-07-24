/**
 * Compatibility engine for the Setup Control system.
 *
 * Uses deterministic rules based on structured data (formatos, pieces, machines)
 * to recommend formats and parts for a given machine + line + product combination.
 */

export const ALL_TOOLING_CATEGORIES = [
  'Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador',
  'Estação de Limpeza', 'Bico de Envase', 'Suporte do Camisa do Bico de Ar Quente',
  'Camisa do Bico de Ar Quente', 'Ponteira do Bico de Ar Quente',
  'Faca', 'Mordente', 'Régua do Mordente', 'Batedor do Mordente', 'Berço',
];

export function getToolingOptions(uo, config) {
  if (uo && config?.uoConfigs?.[uo]?.toolingCategories) return config.uoConfigs[uo].toolingCategories;
  return [...ALL_TOOLING_CATEGORIES];
}

export function getFormatTypeOptions(uo, config) {
  if (uo && config?.uoConfigs?.[uo]?.formatTypes) return config.uoConfigs[uo].formatTypes;
  return ['Frasco cilíndrico', 'Frasco oval', 'Pote', 'Bisnaga', 'Refil'];
}

export function getMachineTooling(machine, config) {
  if (!machine) return [];
  if (machine.toolingCategories && machine.toolingCategories.length > 0) return machine.toolingCategories;
  if (machine.id && machine.id.startsWith('tgm')) return ['Copos', 'Ponteira do Empurrador', 'Ponteira do Centralizador', 'Bico de Envase', 'Faca', 'Mordente', 'Régua do Mordente', 'Berço'];
  const uoFallback = getToolingOptions(machine.uo, config);
  return [...uoFallback];
}

function compatLevel(points) {
  if (points >= 4) return { level: 'Alta', points, recommended: true };
  if (points >= 3) return { level: 'Média', points, recommended: false };
  return { level: 'Baixa', points, recommended: false };
}

function isMachineCompatible(pieceCompatField, machineName) {
  if (!pieceCompatField || !machineName) return false;
  const names = pieceCompatField.split(',').map(s => s.trim());
  return names.some(n => machineName.includes(n) || n.includes(machineName) || machineName.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(machineName.toLowerCase()));
}

export function suggestFormatos(machine, product, formatos) {
  if (!product) return [];
  const results = [];
  for (const fmt of formatos) {
    let points = 0;
    if (fmt.productId === product.id || fmt.productCode === product.code) points += 3;
    else if (fmt.productName && product.name && fmt.productName.toLowerCase() === product.name.toLowerCase()) points += 2;
    const vol = Number(product.vol);
    if (!isNaN(vol) && vol > 0) {
      const minOk = fmt.volMin == null || fmt.volMin <= vol;
      const maxOk = fmt.volMax == null || fmt.volMax >= vol;
      if (minOk && maxOk) points += 2;
      else if (minOk || maxOk) points += 1;
    }
    if (fmt.pieces && fmt.pieces.length > 0) points += 1;
    if (points > 0) results.push({ formato: fmt, ...compatLevel(points) });
  }
  results.sort((a, b) => b.points - a.points);
  return results;
}

export function suggestPrimaryParts(fmt, pieces) {
  if (!fmt || !fmt.pieces || fmt.pieces.length === 0) return [];
  return fmt.pieces.map(p => {
    const full = pieces.find(piece => piece.id === p.pieceId || piece.code === p.pieceCode || piece.name === p.pieceName);
    return {
      ...p,
      stock: full?.stock,
      min: full?.min,
      location: full?.location,
      image: full?.image,
      isPrimary: true,
      available: full ? (full.stock > (full.min || 0)) : false,
    };
  });
}

export function suggestAlternativeParts(primaryParts, machine, pieces) {
  if (!primaryParts || primaryParts.length === 0) return [];
  return primaryParts.map(primary => {
    const sameCategory = pieces.filter(p =>
      p.id !== primary.pieceId &&
      p.category === primary.pieceCategory &&
      isMachineCompatible(p.compat, machine)
    );
    if (sameCategory.length === 0) return { ...primary, alternatives: [] };
    const scored = sameCategory.map(p => {
      let pts = 0;
      if (p.stock > (p.min || 0)) pts += 2;
      if (p.compat && machine && isMachineCompatible(p.compat, machine)) pts += 1;
      const level = pts >= 3 ? 'Ideal' : pts >= 2 ? 'Alta' : pts >= 1 ? 'Média' : 'Condicional';
      return { piece: p, level, available: p.stock > (p.min || 0), requiresAdjustment: level === 'Condicional' };
    }).sort((a, b) => {
      const order = { Ideal: 4, Alta: 3, Média: 2, Condicional: 1 };
      return (order[b.level] || 0) - (order[a.level] || 0);
    });
    return { ...primary, alternatives: scored };
  });
}

export function generateFlowName(product, existingFlows) {
  if (!product) return 'Novo Fluxo';
  const code = product.code || 'PROD';
  const name = product.name || '';
  const count = existingFlows.filter(f => f.code === code).length;
  const version = count + 1;
  return `${code} - ${name.toUpperCase()} - V${version}`;
}

export function collectLines(machines) {
  return [...new Set(machines.map(m => m.line).filter(Boolean))];
}
