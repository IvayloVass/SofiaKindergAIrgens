import { useEffect, useState } from 'react';
import KindergartenCard from './KindergartenCard.jsx';

const PAGE_SIZE = 24;
// How many cards were shown per filter, so "back" from a detail page restores the list.
const shownByFilter = new Map();

/** Card grid with "show more". The parent resets it (via key) when filters change. */
export default function KindergartenGrid({ items, selectedRegions, onRegionClick, filterKey = '' }) {
  const [limit, setLimit] = useState(() => shownByFilter.get(filterKey) ?? PAGE_SIZE);
  useEffect(() => {
    shownByFilter.set(filterKey, limit);
  }, [filterKey, limit]);
  const shown = items.slice(0, limit);
  const remaining = items.length - shown.length;

  return (
    <>
      <div className="kg-grid">
        {shown.map((kg) => (
          <KindergartenCard
            key={kg.id}
            kg={kg}
            onRegionClick={onRegionClick}
            regionSelected={selectedRegions.includes(kg.regionId)}
          />
        ))}
      </div>
      {remaining > 0 && (
        <div className="text-center mt-4">
          <button type="button" className="btn btn-outline-primary rounded-pill px-4" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Покажи още {Math.min(PAGE_SIZE, remaining)} <span className="text-body-secondary">(остават {remaining})</span>
          </button>
        </div>
      )}
    </>
  );
}
