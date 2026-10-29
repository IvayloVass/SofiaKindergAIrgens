/** Card wrapper shared by all charts: title, subtitle, chart, and a text "data view". */
export default function ChartCard({ title, subtitle, children, dataView, className = '' }) {
  return (
    <section className={`chart-card ${className}`}>
      <header className="mb-3">
        <h3 className="chart-title">{title}</h3>
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </header>
      {children}
      {dataView && (
        <details className="chart-data">
          <summary>Покажи данните като текст</summary>
          {dataView}
        </details>
      )}
    </section>
  );
}

export function Legend({ items }) {
  return (
    <ul className="chart-legend">
      {items.map((it) => (
        <li key={it.label}>
          <span className="swatch" style={{ background: it.color }} aria-hidden="true" />
          <span className="legend-label">{it.label}</span>
          {it.value != null && <span className="legend-value">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
