/** Collapses repeated whitespace and trims. */
export function cleanText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Business phone numbers only, cleaned and without duplicates. */
export function extractPhones(contacts = []) {
  const phones = contacts
    .filter(
      (c) =>
        c?.fieldValue &&
        (c.kindCommunication?.label ?? 'phone') === 'phone' &&
        (c.typeCommunication?.label ?? 'business') === 'business',
    )
    .map((c) => cleanText(c.fieldValue));
  return [...new Set(phones)].filter(Boolean);
}

/**
 * Turns the raw source responses into clean records:
 * { regions: [{id, name}], kindergartens: [{id, name, type, regionId, regionName,
 *   address, phones, hasNursery, hasKindergarten, hasPreparatory}] }
 */
export function normalize({ regions = [], groups = {} }) {
  const cleanRegions = regions
    .filter((r) => r && r.id != null && String(r.id) !== '0')
    .map((r) => ({ id: String(r.id), name: cleanText(r.label) }));

  const regionIdByName = new Map(cleanRegions.map((r) => [r.name.toLowerCase(), r.id]));
  const idsIn = (group) => new Set((groups[group] ?? []).map((k) => k.id));
  const nursery = idsIn('nursery');
  const kindergarten = idsIn('otherGroups');
  const preparatory = idsIn('preparative');

  const seen = new Set();
  const kindergartens = [];
  for (const raw of groups.all ?? []) {
    if (raw?.id == null || seen.has(raw.id)) continue;
    seen.add(raw.id);

    const regionName = cleanText(raw.region);
    kindergartens.push({
      id: Number(raw.id),
      name: cleanText(raw.name?.publicName ?? raw.nameStr),
      type: cleanText(raw.name?.publicType) || 'ДГ',
      regionId: regionIdByName.get(regionName.toLowerCase()) ?? null,
      regionName,
      address: cleanText(raw.address),
      phones: extractPhones(raw.contacts),
      hasNursery: nursery.has(raw.id),
      hasKindergarten: kindergarten.has(raw.id),
      hasPreparatory: preparatory.has(raw.id),
    });
  }

  return { regions: cleanRegions, kindergartens };
}
