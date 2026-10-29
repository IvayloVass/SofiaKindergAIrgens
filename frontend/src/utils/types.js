// Kindergarten types from the source, with friendly labels.
// Each type owns a fixed color slot, so its color never changes when filters change.

export const TYPES = [
  { key: 'ДГ (с яслени групи)', label: 'Детска градина с ясла', short: 'ДГ + ясла', slot: 0 },
  { key: 'ДГ', label: 'Детска градина', short: 'ДГ', slot: 1 },
  { key: 'СДЯ', label: 'Самостоятелна детска ясла', short: 'Ясла', slot: 2 },
];

const OTHER = { label: 'Друг тип', short: 'Друг', slot: 3 };

export function typeInfo(type) {
  const known = TYPES.find((t) => t.key === type);
  if (known) return known;
  // e.g. "ДГ (с логопедични групи)" → "ДГ с логопедични групи"
  const label = String(type || OTHER.label).replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  return { ...OTHER, key: type, label, short: label };
}

export const GROUPS = [
  { key: 'hasNursery', label: 'Яслени групи', short: 'Ясла' },
  { key: 'hasKindergarten', label: 'Градински групи', short: 'Градина' },
  { key: 'hasPreparatory', label: 'Подготвителни групи', short: 'Подготвителна' },
];
