// Kindergarten detail page data: groups and places, waiting lists and rankings.
import { cleanText } from './normalize.js';
import { htmlToText, sanitizeHtml } from './sanitize.js';

/* ------------------------------------------------------------------ */
/* Kindergarten details                                                */
/* ------------------------------------------------------------------ */

const QUOTA_LABELS = { general: 'Общ ред', chronic: 'Хронични заболявания', sop: 'СОП' };

export function groupKind(label = '') {
  const l = label.toLowerCase();
  if (l.includes('ясла')) return 'nursery';
  if (l.includes('подготвит')) return 'preparatory';
  return 'kindergarten';
}

const nonNegative = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? Number(n) : 0);

function normalizeGroup(g) {
  // A capacity of -1 means "not used" (e.g. the work-group quota).
  const quotas = (g.spots ?? [])
    .filter((s) => Number(s.capacity) >= 0 && s.type !== 'workgroup')
    .map((s) => ({
      type: s.type,
      label: QUOTA_LABELS[s.type] ?? cleanText(s.label),
      capacity: nonNegative(s.capacity),
      enrolled: nonNegative(s.zapisani),
      free: nonNegative(s.svobodni),
      notEnrolled: nonNegative(s.nezapisani),
    }));
  const sum = (key) => quotas.reduce((acc, q) => acc + q[key], 0);

  return {
    id: Number(g.groupId),
    label: cleanText(g.label),
    birthYear: g.draft ? Number(g.draft) : null,
    kind: groupKind(g.label),
    groupCount: Number(g.countGroups) || 1,
    comment: cleanText(g.comment),
    quotas,
    totals: { capacity: sum('capacity'), enrolled: sum('enrolled'), free: sum('free'), notEnrolled: sum('notEnrolled') },
    ratings: (g.ratingHistory ?? [])
      .map((r) => ({ id: Number(r.ratingId), date: r.ratingDate }))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    waitingListVisible: Boolean(g.listWaitingVisible),
  };
}

const normalizeGroups = (groups) =>
  (groups ?? []).filter((g) => g && (g.active === undefined || g.active)).map(normalizeGroup);

function contactsOf(communications = []) {
  const business = communications.filter((c) => c?.typeCommunication?.label === 'business' && c.fieldValue);
  const values = (kind) => [...new Set(business.filter((c) => c.kindCommunication?.label === kind).map((c) => cleanText(c.fieldValue)))];
  const withScheme = (url) => (/^https?:\/\//i.test(url) ? url : `http://${url}`);
  return {
    phones: values('phone'),
    emails: values('email').filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    websites: values('web').map(withScheme),
  };
}

/** Raw `/public/0/dz/{id}` items → clean details, or null when the id is unknown. */
export function normalizeDetail(items) {
  const dz = items?.dz;
  if (!dz || dz.id == null) return null;
  const info = sanitizeHtml(dz.infoForParents);
  return {
    id: Number(dz.id),
    name: cleanText(dz.nameFull || dz.name),
    shortName: cleanText(dz.name),
    type: cleanText(dz.type),
    regionName: cleanText(dz.region),
    address: cleanText(dz.address).replace(/,(?=\S)/g, ', '),
    director: cleanText(dz.directorName) || null,
    contacts: contactsOf(dz.communications),
    mapUrl: /^https?:\/\//i.test(dz.mapUrl ?? '') ? dz.mapUrl : null,
    infoForParents: htmlToText(info) ? info : '',
    schoolYear: items.schoolYear ?? null,
    schoolYearNext: items.schoolYearNext ?? null,
    groups: normalizeGroups(dz.currentGroups),
    nextYearGroups: normalizeGroups(dz.featureGroups),
  };
}

/* ------------------------------------------------------------------ */
/* Waiting lists                                                       */
/* ------------------------------------------------------------------ */

function waitingEntries(...lists) {
  return lists
    .flat()
    .filter(Boolean)
    .map((e) => ({
      initials: `${e.firstName ?? ''}${e.middleName ?? ''}${e.lastName ?? ''}`.trim(),
      applicationNumber: String(e.childNum ?? ''),
      points: Number(e.points) || 0,
      wishOrder: e.wishOrder != null ? Number(e.wishOrder) : null,
    }))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ rank: i + 1, ...e }));
}

/** Raw `/stat-rating/waiting/{groupId}` items → waiting lists per quota. */
export function normalizeWaiting(items) {
  if (!items?.group) return null;
  const lists = [
    { category: 'general', label: QUOTA_LABELS.general, free: nonNegative(items.freeSpots), entries: waitingEntries(items.listWaiting, items.listWaitingWithChangedDraft) },
    { category: 'chronic', label: QUOTA_LABELS.chronic, free: nonNegative(items.freeHz), entries: waitingEntries(items.listHz, items.listWaitingHzWithChangedDraft) },
    { category: 'sop', label: QUOTA_LABELS.sop, free: nonNegative(items.freeSop), entries: waitingEntries(items.listSop, items.listWaitingSopWithChangedDraft) },
  ];
  return {
    groupId: Number(items.group.id),
    kindergartenId: Number(items.group.kinderGarden?.id),
    lists,
  };
}

/* ------------------------------------------------------------------ */
/* Ranking lists (published by the source as HTML tables)             */
/* ------------------------------------------------------------------ */

const textOf = (html) => htmlToText(html).replace(/\s+/g, ' ').trim();

function categoryOf(title) {
  if (/СОП/.test(title)) return 'sop';
  if (/хронични/i.test(title)) return 'chronic';
  return 'general';
}

/** Parses one ranking HTML page into sections with entries. */
export function parseRatingHtml(html) {
  const source = String(html ?? '');
  if (!source.trim()) return { heading: null, cohort: null, note: null, sections: [] };

  const sections = [];
  for (const [, table] of source.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const title = textOf(/<span[^>]*class=['"]title_sub['"][^>]*>([\s\S]*?)<\/span>/i.exec(table)?.[1] ?? '');
    const entries = [];
    for (const [, row] of table.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => textOf(m[1]));
      if (cells.length < 4 || !/^\d+\.?$/.test(cells[0])) continue;
      entries.push({
        rank: parseInt(cells[0], 10),
        initials: cells[1],
        applicationNumber: cells[2],
        points: Number(cells[3].replace(',', '.')) || 0,
        note: cells[4] || '',
      });
    }
    const places = /за\s+(\d+)\s+места/i.exec(title);
    sections.push({ title, category: categoryOf(title), places: places ? Number(places[1]) : null, entries });
  }

  const strongs = [...source.matchAll(/<strong[^>]*>([\s\S]*?)<\/strong>/gi)].map((m) => textOf(m[1]));
  const paragraphs = [...source.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) => textOf(m[1]));
  return {
    heading: strongs.find((s) => /^КЛАСИРАНЕ/i.test(s)) ?? null,
    cohort: strongs.find((s) => /^Набор/i.test(s)) ?? null,
    note: paragraphs.find((p) => /Записване/i.test(p)) ?? null,
    sections,
  };
}
