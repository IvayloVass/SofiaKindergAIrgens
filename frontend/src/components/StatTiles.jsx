export default function StatTiles({ stats, scopeLabel }) {
  const tiles = [
    { label: 'Заведения', value: stats.total, hint: scopeLabel },
    { label: 'С яслени групи', value: `${stats.nurseryPct}%`, hint: `${stats.nursery} от ${stats.total}` },
    { label: 'С подготвителни групи', value: `${stats.preparatoryPct}%`, hint: `${stats.preparatory} от ${stats.total}` },
    { label: 'Райони', value: stats.districts, hint: 'в резултатите' },
  ];
  return (
    <div className="stat-tiles" aria-live="polite">
      {tiles.map((t) => (
        <div className="stat-tile" key={t.label}>
          <div className="stat-label">{t.label}</div>
          <div className="stat-value">{t.value}</div>
          <div className="stat-hint">{t.hint}</div>
        </div>
      ))}
    </div>
  );
}
