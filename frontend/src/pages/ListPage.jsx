import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import SearchBar from '../components/SearchBar.jsx';
import RegionFilter from '../components/RegionFilter.jsx';
import StatTiles from '../components/StatTiles.jsx';
import KindergartenGrid from '../components/KindergartenGrid.jsx';
import EmptyState, { LoadingCards } from '../components/EmptyState.jsx';
import Icon from '../components/Icon.jsx';
import TypeDonut from '../components/charts/TypeDonut.jsx';
import DistrictBar from '../components/charts/DistrictBar.jsx';
import GroupsComparison from '../components/charts/GroupsComparison.jsx';
import { useUrlState } from '../hooks/useUrlState.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { matchesQuery, tokenize } from '../utils/search.js';
import { sortKindergartens, summarize } from '../utils/stats.js';
import { plural } from '../utils/format.js';

export default function ListPage({ data, scheme }) {
  const { status, kindergartens, regions, meta, error, reload } = data;
  const { query, regions: selected, view, sort, update, toggleRegion } = useUrlState();
  const debouncedQuery = useDebouncedValue(query, 150);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Step 1: search. Step 2: district filter. Charts use one or the other (see below).
  const searchMatches = useMemo(() => {
    const tokens = tokenize(debouncedQuery);
    return tokens.length ? kindergartens.filter((k) => matchesQuery(k, tokens)) : kindergartens;
  }, [kindergartens, debouncedQuery]);

  const filtered = useMemo(
    () => (selected.length ? searchMatches.filter((k) => selected.includes(k.regionId)) : searchMatches),
    [searchMatches, selected],
  );

  const sorted = useMemo(() => sortKindergartens(filtered, sort), [filtered, sort]);
  const stats = useMemo(() => summarize(filtered), [filtered]);

  const regionCounts = useMemo(() => {
    const m = new Map();
    for (const k of searchMatches) m.set(k.regionId, (m.get(k.regionId) ?? 0) + 1);
    return m;
  }, [searchMatches]);

  const regionName = useCallback((id) => regions.find((r) => r.id === id)?.name ?? id, [regions]);
  const clearRegions = useCallback(() => update({ regions: [] }), [update]);
  const resetAll = useCallback(() => update({ regions: [], query: '' }), [update]);

  // Close the mobile filter panel with Escape.
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setFiltersOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtersOpen]);

  const scopeLabel = selected.length
    ? selected.length === 1
      ? `в район ${regionName(selected[0])}`
      : `в ${selected.length} избрани района`
    : 'в цяла София';

  const ready = status === 'ready';

  return (
    <>
      <a className="visually-hidden-focusable skip-link" href="#results">
        Към резултатите
      </a>
      <Header meta={meta} total={kindergartens.length} />

      <div className="toolbar">
        <div className="container-xxl px-3 px-md-4 d-flex gap-2 align-items-center">
          <div className="flex-grow-1">
            <SearchBar value={query} onChange={(q) => update({ query: q })} />
          </div>
          <button
            type="button"
            className="btn btn-outline-primary d-lg-none filter-toggle"
            onClick={() => setFiltersOpen(true)}
            aria-controls="filters"
            aria-expanded={filtersOpen}
          >
            <Icon name="filter" />
            <span className="d-none d-sm-inline ms-1">Райони</span>
            {selected.length > 0 && <span className="badge rounded-pill text-bg-primary ms-1">{selected.length}</span>}
          </button>
        </div>
      </div>

      <div className="container-xxl px-3 px-md-4 py-4">
        <div className="row g-4">
          <aside className="col-lg-3 filters-col">
            <div
              id="filters"
              className={`offcanvas-lg offcanvas-start filters-panel ${filtersOpen ? 'show' : ''}`}
              tabIndex={-1}
              aria-label="Филтър по райони"
            >
              <div className="offcanvas-header">
                <h2 className="offcanvas-title h5">Филтър по райони</h2>
                <button type="button" className="btn-close" onClick={() => setFiltersOpen(false)} aria-label="Затвори" />
              </div>
              <div className="offcanvas-body d-block">
                {regions.length > 0 ? (
                  <RegionFilter
                    regions={regions}
                    counts={regionCounts}
                    selected={selected}
                    onToggle={toggleRegion}
                    onClear={clearRegions}
                  />
                ) : (
                  <div className="placeholder-glow">
                    <span className="placeholder col-12 rounded" style={{ height: 240 }} />
                  </div>
                )}
                <button type="button" className="btn btn-primary w-100 mt-3 d-lg-none" onClick={() => setFiltersOpen(false)}>
                  Покажи {plural(filtered.length, 'резултат', 'резултата')}
                </button>
              </div>
            </div>
            {filtersOpen && <div className="offcanvas-backdrop fade show d-lg-none" onClick={() => setFiltersOpen(false)} />}
          </aside>

          <main className="col-lg-9" id="results">
            {status === 'error' && (
              <div className="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
                <span className="flex-grow-1">Данните не могат да бъдат заредени. {error?.message}</span>
                <button type="button" className="btn btn-sm btn-light" onClick={reload}>
                  <Icon name="refresh" size={16} /> Опитай отново
                </button>
              </div>
            )}

            {ready && <StatTiles stats={stats} scopeLabel={scopeLabel} />}

            <div className="results-bar">
              <div className="active-filters" aria-live="polite">
                <span className="fw-semibold me-1">
                  {ready ? plural(filtered.length, 'резултат', 'резултата') : 'Зареждане…'}
                </span>
                {regions.length > 0 && selected.map((id) => (
                  <button key={id} type="button" className="active-chip" onClick={() => toggleRegion(id)} aria-label={`Премахни ${regionName(id)}`}>
                    {regionName(id)} <Icon name="close" size={14} />
                  </button>
                ))}
                {(selected.length > 0 || query) && (
                  <button type="button" className="btn btn-link btn-sm p-0 ms-1" onClick={resetAll}>
                    Изчисти всичко
                  </button>
                )}
              </div>

              <div className="results-controls">
                {view === 'list' && (
                  <select
                    className="form-select form-select-sm sort-select"
                    value={sort}
                    onChange={(e) => update({ sort: e.target.value })}
                    aria-label="Подреди по"
                  >
                    <option value="name">По име</option>
                    <option value="region">По район</option>
                  </select>
                )}
                <div className="view-switch" role="tablist" aria-label="Изглед">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'list'}
                    className={view === 'list' ? 'active' : ''}
                    onClick={() => update({ view: 'list' })}
                  >
                    <Icon name="list" size={16} /> Списък
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'compare'}
                    className={view === 'compare' ? 'active' : ''}
                    onClick={() => update({ view: 'compare' })}
                  >
                    <Icon name="chart" size={16} /> Сравнение
                  </button>
                </div>
              </div>
            </div>

            {status === 'loading' && <LoadingCards />}

            {ready && filtered.length === 0 && <EmptyState onReset={resetAll} />}

            {ready && filtered.length > 0 && view === 'list' && (
              <KindergartenGrid
                key={`${debouncedQuery}|${selected.join(',')}|${sort}`}
                filterKey={`${debouncedQuery}|${selected.join(',')}|${sort}`}
                items={sorted}
                selectedRegions={selected}
                onRegionClick={toggleRegion}
              />
            )}

            {ready && filtered.length > 0 && view === 'compare' && (
              <div className="charts-grid">
                <GroupsComparison
                  items={searchMatches}
                  regions={regions}
                  selected={selected}
                  scheme={scheme}
                  referenceLabel={debouncedQuery.trim() ? 'Всички намерени' : 'Цяла София'}
                />
                <TypeDonut items={filtered} scheme={scheme} />
                <DistrictBar
                  items={searchMatches}
                  regions={regions}
                  selected={selected}
                  onToggle={toggleRegion}
                  scheme={scheme}
                />
              </div>
            )}
          </main>
        </div>
      </div>

    </>
  );
}
