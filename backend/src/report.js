// Collects everything the downloadable kindergarten report needs (all groups,
// their places, waiting lists and latest ranking) into one plain object.
// The Excel and PDF writers (reportXlsx.js, reportPdf.js) only format it.
import { NotFoundError, getDetail, getRanking, getWaiting } from './kindergartenService.js';

export const GROUP_KIND_LABEL = { nursery: 'Ясла', kindergarten: 'Градина', preparatory: 'Подготвителна' };
export const STAGE_LABEL = { rated: 'Класирани', notRated: 'Некласирани' };

/** Groups loaded at the same time, to stay gentle with kg.sofia.bg on a cold cache. */
const GROUP_CONCURRENCY = 3;

const minOf = (xs) => (xs.length ? Math.min(...xs) : null);
const maxOf = (xs) => (xs.length ? Math.max(...xs) : null);

/** Totals over the groups of one school year. */
export function placesSummary(groups = []) {
  const sum = (key) => groups.reduce((acc, g) => acc + g.totals[key], 0);
  return {
    capacity: sum('capacity'),
    enrolled: sum('enrolled'),
    notEnrolled: sum('notEnrolled'),
    free: sum('free'),
    groups: groups.reduce((acc, g) => acc + g.groupCount, 0),
  };
}

export function waitingSummary(lists = []) {
  const points = lists.flatMap((l) => l.entries.map((e) => e.points));
  return {
    waiting: points.length,
    free: lists.reduce((acc, l) => acc + l.free, 0),
    maxPoints: maxOf(points),
    minPoints: minOf(points),
  };
}

/** Lowest points among ranked children (the "cut-off"), or null. */
export function cutoffPoints(sections = []) {
  return minOf(sections.flatMap((s) => s.entries.map((e) => e.points)));
}

/** "Списък класирани по общи критерии на 16.10.2026" → "Общи критерии" */
export function sectionLabel(title = '') {
  if (/СОП/.test(title)) return 'СОП';
  if (/хронични/i.test(title)) return 'Хронични заболявания';
  if (/общи/i.test(title)) return 'Общи критерии';
  return title;
}

/** Runs `loader`; a missing or failed list becomes `{ unavailable: true }` instead of failing the report. */
async function optional(loader) {
  try {
    return await loader();
  } catch (error) {
    if (!(error instanceof NotFoundError)) console.warn(`report: ${error.message}`);
    return { unavailable: true };
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function waitingPart(data) {
  if (!data || data.unavailable) return data ?? null;
  return { lists: data.lists, stats: waitingSummary(data.lists), fetchedAt: data.fetchedAt, stale: data.stale };
}

function rankingPart(data, latest) {
  if (!data || data.unavailable) return data ? { unavailable: true, date: latest.date } : null;
  const nonEmpty = (list) => list.sections.filter((s) => s.entries.length > 0);
  const count = (list) => list.sections.reduce((acc, s) => acc + s.entries.length, 0);
  const rated = nonEmpty(data.rated);
  return {
    id: data.ratingId,
    date: data.date,
    cohort: data.rated.cohort?.replace(/^Набор\s*/i, '') || null,
    note: data.rated.note,
    stages: { rated, notRated: nonEmpty(data.notRated) },
    stats: {
      rated: count(data.rated),
      notRated: count(data.notRated),
      cutoff: cutoffPoints(rated.filter((s) => s.category === 'general')),
    },
    fetchedAt: data.fetchedAt,
    stale: data.stale,
  };
}

async function groupReport(db, id, group, schoolYear, opts) {
  const latest = group.ratings.at(-1); // ratings are sorted oldest → newest
  const [waiting, ranking] = await Promise.all([
    group.waitingListVisible ? optional(() => getWaiting(db, id, group.id, opts)) : null,
    latest ? optional(() => getRanking(db, id, group.id, latest.id, opts)) : null,
  ]);
  return {
    id: group.id,
    label: group.label,
    kind: group.kind,
    kindLabel: GROUP_KIND_LABEL[group.kind] ?? '',
    birthYear: group.birthYear,
    groupCount: group.groupCount,
    schoolYear,
    comment: group.comment,
    totals: group.totals,
    quotas: group.quotas,
    waiting: waitingPart(waiting),
    ranking: rankingPart(ranking, latest),
  };
}

/** Report data for one kindergarten. Throws NotFoundError for an unknown id. */
export async function buildReport(db, id, { fetchImpl = fetch, now = Date.now } = {}) {
  const opts = { fetchImpl };
  const detail = await getDetail(db, id, opts);
  const all = [
    ...detail.groups.map((g) => [g, detail.schoolYear]),
    ...detail.nextYearGroups.map((g) => [g, detail.schoolYearNext]),
  ];
  const groups = await mapLimit(all, GROUP_CONCURRENCY, ([g, year]) => groupReport(db, detail.id, g, year, opts));

  // The report is as old as its oldest part.
  const parts = [detail, ...groups.flatMap((g) => [g.waiting, g.ranking])].filter((p) => p?.fetchedAt);
  const current = groups.filter((g) => g.schoolYear === detail.schoolYear);

  return {
    kindergarten: {
      id: detail.id,
      name: detail.name,
      shortName: detail.shortName || detail.name,
      type: detail.type,
      regionName: detail.regionName,
      address: detail.address,
      director: detail.director,
      phones: detail.contacts.phones,
      emails: detail.contacts.emails,
    },
    schoolYear: detail.schoolYear,
    schoolYearNext: detail.schoolYearNext,
    summary: {
      ...placesSummary(current),
      waiting: current.reduce((acc, g) => acc + (g.waiting?.stats?.waiting ?? 0), 0),
    },
    groups,
    dataAt: parts.map((p) => p.fetchedAt).sort()[0],
    stale: parts.some((p) => p.stale),
    generatedAt: new Date(now()).toISOString(),
    sourceUrl: `https://kg.sofia.bg/#/kindergarten/${detail.id}`,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting shared by both writers                                   */
/* ------------------------------------------------------------------ */

const sofiaParts = (iso, withTime) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Sofia',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } : {}),
  }).formatToParts(d);
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
};

/** "16.10.2026" in Sofia time, or '' for a missing date. */
export function formatDate(iso) {
  const p = sofiaParts(iso, false);
  return p ? `${p.day}.${p.month}.${p.year}` : '';
}

/** "31.10.2026 14:05" in Sofia time. */
export function formatDateTime(iso) {
  const p = sofiaParts(iso, true);
  return p ? `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}` : '';
}

/** "2026-10-31" in Sofia time, for file names. */
export function fileDate(iso) {
  const p = sofiaParts(iso, false);
  return p ? `${p.year}-${p.month}-${p.day}` : '';
}

export const formatPoints = (points) => (points == null ? '—' : Number.isInteger(points) ? String(points) : points.toFixed(1));

/** Short notes about lists that could not be loaded or are not published. */
export function groupNotes(group) {
  const notes = [];
  if (group.waiting?.unavailable) notes.push('Списъкът с чакащи не може да бъде зареден');
  if (group.ranking?.unavailable) notes.push(`Класирането от ${formatDate(group.ranking.date)} не може да бъде заредено`);
  if (!group.ranking) notes.push('Няма публикувано класиране');
  return notes;
}
