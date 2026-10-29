import { getKindergarten } from '@kg/database';
import { cached } from './cache.js';
import { normalizeDetail, normalizeWaiting, parseRatingHtml } from './details.js';
import { fetchKindergartenDetail, fetchRatingHtml, fetchWaitingList } from './source.js';

const HOUR = 60 * 60 * 1000;
export const TTL = {
  detail: 6 * HOUR,
  waiting: 1 * HOUR,
  ranking: 6 * HOUR,
};

export class NotFoundError extends Error {}

/** Full details for one kindergarten, with sync-list data as a fallback for basics. */
export async function getDetail(db, id, { fetchImpl = fetch } = {}) {
  const basic = getKindergarten(db, id);
  if (!basic) throw new NotFoundError('Unknown kindergarten');

  const result = await cached(db, `detail:${basic.id}`, TTL.detail, async () =>
    normalizeDetail(await fetchKindergartenDetail(basic.id, fetchImpl)),
  );
  if (!result.data) throw new NotFoundError('Kindergarten has no details');

  const d = result.data;
  return {
    ...d,
    regionId: basic.regionId,
    regionName: d.regionName || basic.regionName,
    hasNursery: basic.hasNursery,
    hasKindergarten: basic.hasKindergarten,
    hasPreparatory: basic.hasPreparatory,
    contacts: { ...d.contacts, phones: d.contacts.phones.length ? d.contacts.phones : basic.phones },
    fetchedAt: new Date(result.fetchedAt).toISOString(),
    stale: result.stale,
  };
}

/** Finds a group of this kindergarten (current or next school year). */
async function findGroup(db, id, groupId, options) {
  const detail = await getDetail(db, id, options);
  const group = [...detail.groups, ...detail.nextYearGroups].find((g) => g.id === Number(groupId));
  if (!group) throw new NotFoundError('Unknown group');
  return group;
}

export async function getWaiting(db, id, groupId, { fetchImpl = fetch } = {}) {
  await findGroup(db, id, groupId, { fetchImpl });
  const result = await cached(db, `waiting:${Number(groupId)}`, TTL.waiting, async () =>
    normalizeWaiting(await fetchWaitingList(groupId, fetchImpl)),
  );
  if (!result.data || result.data.kindergartenId !== Number(id)) throw new NotFoundError('No waiting list');
  return { ...result.data, fetchedAt: new Date(result.fetchedAt).toISOString(), stale: result.stale };
}

export async function getRanking(db, id, groupId, ratingId, { fetchImpl = fetch } = {}) {
  const group = await findGroup(db, id, groupId, { fetchImpl });
  const rating = group.ratings.find((r) => r.id === Number(ratingId));
  if (!rating) throw new NotFoundError('Unknown ranking');

  const result = await cached(db, `ranking:${rating.id}:${group.id}`, TTL.ranking, async () => {
    const [entry, rated, notRated] = await Promise.all(
      ['entry', 'rated', 'not-rated'].map((stage) => fetchRatingHtml(stage, rating.id, group.id, fetchImpl)),
    );
    return { entry: parseRatingHtml(entry), rated: parseRatingHtml(rated), notRated: parseRatingHtml(notRated) };
  });
  return {
    ratingId: rating.id,
    date: rating.date,
    groupId: group.id,
    ...result.data,
    fetchedAt: new Date(result.fetchedAt).toISOString(),
    stale: result.stale,
  };
}
