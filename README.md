# Детски градини София — Sofia Kindergartens

A single-page app for browsing, searching and comparing Sofia's 342 municipal kindergartens and nurseries.
The data comes from the public portal [kg.sofia.bg](https://kg.sofia.bg/#/kindergartens).

- **Instant search** by name, address or district. Works in Cyrillic and Latin letters ("Червената" or "chervenata").
- **District filter** (the only filter): multi-select chips with live counts.
- **Cards instead of a table**: name, type, district, address (opens Google Maps), phones (tap to call), and which group kinds the kindergarten runs (nursery / kindergarten / preparatory).
- **Comparison view** with charts that follow the current filters:
  - a donut chart of kindergarten types,
  - kindergartens per district (click a bar to add or remove that district from the filter).
- The filter state lives in the URL, so links can be shared. Light and dark mode follow the OS setting.
- **A detail page for every kindergarten** (`/kindergarten/:id`, opened by clicking a card):
  - director, phones, email, website, map and a link to the official page,
  - free / enrolled places per group, with a chart comparing the groups,
  - **rankings ("класиране")** for each group and ranking date: ranked, not ranked and pre-ranking lists, the enrolment period and the lowest ranked points,
  - the **waiting list** with a points chart,
  - "find my child" by application number (highlights the child and shows their place),
  - the kindergarten's information for parents,
  - **download ratings and statistics as Excel or PDF**: one file with every group of the kindergarten — places per group and quota, the waiting list and the latest ranking (ranked and not ranked children), with totals. Available only from a kindergarten's own page.

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
backend/    Node HTTP API + sync job (built-in node:http and fetch; exceljs, pdfkit and DejaVu fonts for the reports)
frontend/   React + Bootstrap + Chart.js SPA, built with Vite (pages/, components/, a tiny router in router.jsx)
tests/      Vitest suites for each module, plus fixtures captured from the real source
scripts/    dev.js runs backend and frontend side by side
```

### Why a backend?

The source API blocks requests from other websites (CORS), so the browser can't call it directly. The backend:

1. downloads the district list and the kindergarten lists from kg.sofia.bg (`backend/src/source.js`),
2. merges them into clean records (`backend/src/normalize.js`),
3. stores them in SQLite (`database/src/index.js`),
4. refreshes every 24 hours, and keeps serving the last good data if the source is down (`backend/src/sync.js`),
5. fetches detail pages, waiting lists and rankings on demand, caches them in SQLite (6h / 1h / 6h) and serves the cached copy if the source is down (`backend/src/kindergartenService.js`, `backend/src/cache.js`). Group and ranking ids are checked against the kindergarten, so the API can't be used as an open proxy.
6. cleans the "info for parents" HTML with a small allow-list sanitizer (`backend/src/sanitize.js`) before it reaches the browser.
7. builds the downloadable reports: `backend/src/report.js` gathers all groups (reusing the cached data above; a list the source can't deliver is marked "not available" instead of failing the file), `reportXlsx.js` and `reportPdf.js` write the Excel and PDF files. The PDF embeds DejaVu Sans because the standard PDF fonts have no Cyrillic.

### API

| Endpoint |
| --- |
| `/api/kindergartens` |
| `/api/regions` |
| `/api/meta` |
| `/api/kindergartens/:id` |
| `/api/kindergartens/:id/groups/:groupId/waiting` |
| `/api/kindergartens/:id/groups/:groupId/rankings/:ratingId` |
| `/api/kindergartens/:id/report.xlsx` |
| `/api/kindergartens/:id/report.pdf` |
| `/api/health` |

### Source endpoints used

- `https://kg.sofia.bg/api/nomenclature/regions`
- `https://kg.sofia.bg/api/public/kg/type/kinderGarden/{all|nursery|otherGroups|preparative}?filterType=by_region&kgType=0&regionId=0`
- `https://kg.sofia.bg/api/public/0/dz/{id}` (details)
- `https://kg.sofia.bg/api/stat-rating/waiting/{groupId}` (waiting list, JSON)
- `https://kg.sofia.bg/api/stat-rating/{entry|rated|not-rated}/{ratingId}/{groupId}` (rankings, HTML tables parsed in `backend/src/details.js`)

Ranking and waiting lists show only initials, application number and points — exactly as the municipality publishes them.