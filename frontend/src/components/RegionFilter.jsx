import { useMemo, useState } from 'react';
import { normalizeText } from '../utils/search.js';
import Icon from './Icon.jsx';

/**
 * The only filter: districts. Multi-select chips, each showing how many
 * kindergartens in that district match the current search.
 */
export default function RegionFilter({ regions, counts, selected, onToggle, onClear }) {
  const [find, setFind] = useState('');
  const visible = useMemo(() => {
    const q = normalizeText(find);
    return q ? regions.filter((r) => normalizeText(r.name).includes(q)) : regions;
  }, [regions, find]);

  return (
    <section className="region-filter" aria-labelledby="region-filter-title">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 id="region-filter-title" className="h6 mb-0 fw-bold">
          Райони
        </h2>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-decoration-none"
          onClick={onClear}
          disabled={selected.length === 0}
        >
          Всички райони
        </button>
      </div>

      <input
        type="search"
        className="form-control form-control-sm mb-3"
        placeholder="Намери район…"
        aria-label="Намери район"
        value={find}
        onChange={(e) => setFind(e.target.value)}
      />

      <div className="region-chips">
        {visible.map((r) => {
          const isOn = selected.includes(r.id);
          const count = counts.get(r.id) ?? 0;
          return (
            <button
              key={r.id}
              type="button"
              className={`region-chip ${isOn ? 'is-on' : ''} ${count === 0 ? 'is-empty' : ''}`}
              aria-pressed={isOn}
              onClick={() => onToggle(r.id)}
            >
              {isOn && <Icon name="check" size={14} />}
              <span className="region-chip-name">{r.name}</span>
              <span className="region-chip-count">{count}</span>
            </button>
          );
        })}
        {visible.length === 0 && <p className="text-body-secondary small mb-0">Няма такъв район.</p>}
      </div>
    </section>
  );
}
