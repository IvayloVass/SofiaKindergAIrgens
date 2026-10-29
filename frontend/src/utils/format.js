/** "02/831 70 17" → "tel:+35928317017" */
export function phoneHref(phone) {
  let digits = String(phone).replace(/[^\d+]/g, '');
  if (digits.startsWith('0')) digits = `+359${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function mapsHref(kg) {
  const query = `${kg.name}, ${kg.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Bulgarian plural: plural(1, 'градина', 'градини') → "1 градина" */
export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
