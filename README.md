# Детски градини София — Sofia Kindergartens

A single-page app for browsing, searching and comparing Sofia's 342 municipal kindergartens and nurseries.
The data comes from the public portal [kg.sofia.bg](https://kg.sofia.bg/#/kindergartens).

- **Instant search** by name, address or district. Works in Cyrillic and Latin letters ("Червената" or "chervenata").
- **District filter** (the only filter): multi-select chips with live counts.
- **Cards instead of a table**: name, type, district, address (opens Google Maps), phones (tap to call), and which group kinds the kindergarten runs (nursery / kindergarten / preparatory).
- **Comparison view** with charts that follow the current filters:
  - districts compared by share of kindergartens with nursery, kindergarten and preparatory groups,
  - a donut chart of kindergarten types,
  - kindergartens per district (click a bar to add or remove that district from the filter).
- The filter state lives in the URL, so links can be shared. Light and dark mode follow the OS setting.

> The official ranking ("класиране") isn't published on the source yet (its API returns `noRatings: true`), so the app
> shows the kindergarten list. The app shows a notice about this.

## Requirements

- **Node.js 22.13 or newer** (Node 26 LTS recommended, see `.nvmrc`). The backend uses the built-in `node:sqlite` module.

## Getting started

```bash
npm install
npm run sync     # download data from kg.sofia.bg into SQLite (optional, the server also does this on start)
npm run dev      # backend on :3001 + Vite on http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Runs the backend (with auto-restart) and the Vite dev server together |
| `npm run sync` | Downloads fresh data from kg.sofia.bg now |
| `npm test` | Runs all tests (database, backend, frontend) |
| `npm run build` | Builds the frontend into `frontend/dist` |
| `npm start` | Production: one Node process serves the API **and** the built SPA on http://localhost:3001 |

Environment variables (optional): `PORT` (default `3001`), `DB_PATH` (default `backend/data/kindergartens.db`), `STATIC_DIR`.

## Project structure

An npm workspaces monorepo with four modules:

```
database/   SQLite schema and data access (built-in node:sqlite, no dependencies)
backend/    Node HTTP API + sync job (built-in node:http and fetch, no dependencies)
frontend/   React + Bootstrap + Chart.js SPA, built with Vite
tests/      Vitest suites for each module, plus fixtures captured from the real source
scripts/    dev.js runs backend and frontend side by side
```

### Why a backend?

The source API blocks requests from other websites (CORS), so the browser can't call it directly. The backend:

1. downloads the district list and the kindergarten lists from kg.sofia.bg (`backend/src/source.js`),
2. merges them into clean records (`backend/src/normalize.js`),
3. stores them in SQLite (`database/src/index.js`),
4. refreshes every 24 hours, and keeps serving the last good data if the source is down (`backend/src/sync.js`).

### API

| Endpoint | Returns |
| --- | --- |
| `GET /api/kindergartens[?region=<id>]` | `[{ id, name, type, regionId, regionName, address, phones[], hasNursery, hasKindergarten, hasPreparatory }]` |
| `GET /api/regions` | `[{ id, name, count }]` |
| `GET /api/meta` | `{ lastSyncedAt, source, rankingsPublished }` |
| `GET /api/health` | `{ status: "ok" }` |

### Source endpoints used

- `https://kg.sofia.bg/api/nomenclature/regions`
- `https://kg.sofia.bg/api/public/kg/type/kinderGarden/{all|nursery|otherGroups|preparative}?filterType=by_region&kgType=0&regionId=0`

## Dependencies

Kept small on purpose:

- Frontend: `react`, `react-dom`, `bootstrap` (CSS only), `chart.js`, `react-chartjs-2`; dev: `vite`, `@vitejs/plugin-react`
- Tests: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`
- Backend and database: none (Node built-ins only)

Chart colors use a colorblind-safe palette, and every chart has a "show data as text" option.
