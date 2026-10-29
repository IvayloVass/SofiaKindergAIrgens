import { useEffect, useRef, useState } from 'react';
import { formatPoints } from '../../utils/ranking.js';

const INITIAL = 15;

/** Ranked/waiting children: rank, initials, application number, points. Not a table — a compact list. */
export default function EntryList({ entries, highlight, label }) {
  const highlightIndex = highlight ? entries.findIndex((e) => e.applicationNumber === highlight) : -1;
  const [expanded, setExpanded] = useState(false);
  const showAll = expanded || highlightIndex >= INITIAL;
  const shown = showAll ? entries : entries.slice(0, INITIAL);
  const rowRef = useRef(null);

  useEffect(() => {
    if (highlightIndex >= 0) rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlightIndex]);

  return (
    <div className="entry-block">
      {label && <h4 className="entry-label">{label}</h4>}
      <ol className="entry-list" aria-label={label}>
        {shown.map((e, i) => {
          const isMe = i === highlightIndex;
          return (
            <li key={`${e.applicationNumber}-${e.rank}`} className={isMe ? 'is-me' : ''} ref={isMe ? rowRef : undefined}>
              <span className="entry-rank">{e.rank}</span>
              <span className="entry-initials">{e.initials || '—'}</span>
              <span className="entry-number">№ {e.applicationNumber}</span>
              {e.wishOrder != null && <span className="entry-wish">желание {e.wishOrder}</span>}
              <span className="entry-points">{formatPoints(e.points)} т.</span>
            </li>
          );
        })}
      </ol>
      {entries.length > INITIAL && (
        <button type="button" className="btn btn-link btn-sm px-0" onClick={() => setExpanded((x) => !x)}>
          {showAll ? 'Покажи по-малко' : `Покажи всички ${entries.length}`}
        </button>
      )}
    </div>
  );
}
