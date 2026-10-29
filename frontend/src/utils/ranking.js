// Helpers for the groups, waiting lists and rankings on the detail page.

export const QUOTA_ORDER = ['general', 'chronic', 'sop'];

export const GROUP_KIND_LABEL = {
  nursery: 'Ясла',
  kindergarten: 'Градина',
  preparatory: 'Подготвителна',
};

/** Totals over all groups of a kindergarten. */
export function placesSummary(groups = []) {
  const sum = (key) => groups.reduce((acc, g) => acc + g.totals[key], 0);
  return {
    capacity: sum('capacity'),
    enrolled: sum('enrolled'),
    notEnrolled: sum('notEnrolled'),
    free: sum('free'),
    groups: groups.reduce((acc, g) => acc + g.groupCount, 0),
    withFree: groups.filter((g) => g.totals.free > 0).length,
  };
}

/** Number summary for a waiting list. */
export function waitingSummary(lists = []) {
  const entries = lists.flatMap((l) => l.entries);
  const points = entries.map((e) => e.points);
  return {
    waiting: entries.length,
    free: lists.reduce((acc, l) => acc + l.free, 0),
    maxPoints: points.length ? Math.max(...points) : null,
    minPoints: points.length ? Math.min(...points) : null,
    firstWish: entries.filter((e) => e.wishOrder === 1).length,
  };
}

/** [{ points, count }] from highest to lowest points (for the histogram). */
export function pointsHistogram(entries = []) {
  const counts = new Map();
  for (const e of entries) counts.set(e.points, (counts.get(e.points) ?? 0) + 1);
  return [...counts.entries()].map(([points, count]) => ({ points, count })).sort((a, b) => b.points - a.points);
}

/** Keeps only digits; application numbers are 8 digits. */
export const cleanApplicationNumber = (value) => String(value ?? '').replace(/\D/g, '').slice(0, 12);

/** Finds an application number across the given lists: [{ listLabel, entry }]. */
export function findApplication(sections = [], number) {
  const n = cleanApplicationNumber(number);
  if (n.length < 4) return [];
  return sections.flatMap((s) =>
    s.entries.filter((e) => e.applicationNumber === n).map((entry) => ({ listLabel: s.label ?? s.title, entry })),
  );
}

/** Lowest points among ranked children (the "cut-off"), or null. */
export function cutoffPoints(sections = []) {
  const pts = sections.flatMap((s) => s.entries.map((e) => e.points));
  return pts.length ? Math.min(...pts) : null;
}

export function formatShortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', timeZone: 'Europe/Sofia' });
}

export function formatPoints(points) {
  if (points == null) return '—';
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
