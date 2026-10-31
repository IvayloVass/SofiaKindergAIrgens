const nf = new Intl.NumberFormat('bg-BG');

export default function StatTiles({ stats, scopeLabel }) {
  const { places } = stats;
  const tiles = [
    { label: 'Заведения', value: stats.total, hint: scopeLabel },
    { label: 'С яслени групи', value: `${stats.nurseryPct}%`, hint: `${stats.nursery} от ${stats.total}` },
    { label: 'С подготвителни групи', value: `${stats.preparatoryPct}%`, hint: `${stats.preparatory} от ${stats.total}` },
    { label: 'Райони', value: stats.districts, hint: 'в резултатите' },
  ];
  // Only shown once the sync has collected place data.
  if (places?.known > 0) {
    tiles.push({
      label: 'Свободни места',
      value: nf.format(places.free),
      hint: `от ${nf.format(places.capacity)} места`,
      good: places.free > 0,
    });
  }
  return (
    <div className={`stat-tiles${tiles.length > 4 ? ' has-5' : ''}`} aria-live="polite">
      {tiles.map((t) => (
        <div className={`stat-tile${t.good ? ' is-good' : ''}`} key={t.label}>
          <div className="stat-label">{t.label}</div>
          <div className="stat-value">{t.value}</div>
          <div className="stat-hint">{t.hint}</div>
        </div>
      ))}
    </div>
  );
}
