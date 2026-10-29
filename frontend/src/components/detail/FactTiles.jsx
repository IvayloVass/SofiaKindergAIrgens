import { placesSummary } from '../../utils/ranking.js';

/** Headline numbers for one kindergarten. */
export default function FactTiles({ groups, schoolYear }) {
  const s = placesSummary(groups);
  const tiles = [
    { label: 'Места общо', value: s.capacity, hint: schoolYear ? `учебна ${schoolYear}` : 'във всички групи' },
    { label: 'Записани деца', value: s.enrolled, hint: s.capacity ? `${Math.round((s.enrolled / s.capacity) * 100)}% заетост` : '' },
    {
      label: 'Свободни места',
      value: s.free,
      hint: s.free ? `в ${s.withFree} ${s.withFree === 1 ? 'група' : 'групи'}` : 'в момента няма',
      accent: s.free > 0,
    },
    { label: 'Групи', value: s.groups, hint: `${groups.length} възрастови набора` },
  ];
  return (
    <div className="stat-tiles">
      {tiles.map((t) => (
        <div className={`stat-tile ${t.accent ? 'is-good' : ''}`} key={t.label}>
          <div className="stat-label">{t.label}</div>
          <div className="stat-value">{t.value}</div>
          <div className="stat-hint">{t.hint}</div>
        </div>
      ))}
    </div>
  );
}
