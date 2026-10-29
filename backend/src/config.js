import { fileURLToPath } from 'node:url';

export const SOURCE_BASE_URL = 'https://kg.sofia.bg/api';
export const SOURCE_PAGE_URL = 'https://kg.sofia.bg/#/kindergartens';

/** The source groups kindergartens by which kinds of groups they run. */
export const GROUP_LISTS = ['all', 'nursery', 'otherGroups', 'preparative'];

export const PORT = Number(process.env.PORT) || 3001;
export const DB_PATH =
  process.env.DB_PATH || fileURLToPath(new URL('../data/kindergartens.db', import.meta.url));
export const STATIC_DIR =
  process.env.STATIC_DIR || fileURLToPath(new URL('../../frontend/dist', import.meta.url));

/** How old the data may get before it is refreshed from the source. */
export const MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000;
