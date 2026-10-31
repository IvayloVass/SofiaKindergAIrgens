import { Doughnut } from 'react-chartjs-2';
import ChartCard, { Legend } from './ChartCard.jsx';
import { chartTheme, tooltipOptions } from './palette.js';
import { countByType, pct } from '../../utils/stats.js';

/** Part-to-whole: how the filtered kindergartens split by type. */
export default function TypeDonut({ items, scheme, className = '' }) {
  const theme = chartTheme(scheme);
  const rows = countByType(items);
  const total = items.length;
  const colors = rows.map((r) => theme.series[r.slot]);

  const data = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        data: rows.map((r) => r.count),
        backgroundColor: colors,
        borderColor: theme.surface,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions(theme),
        callbacks: { label: (ctx) => ` ${ctx.raw} (${pct(ctx.raw, total)}%)` },
      },
    },
  };

  return (
    <ChartCard
      title="Видове заведения"
      subtitle="Разпределение на резултатите по тип"
      className={className}
      dataView={
        <ul>
          {rows.map((r) => (
            <li key={r.key}>
              {r.label}: {r.count} ({pct(r.count, total)}%)
            </li>
          ))}
        </ul>
      }
    >
      <div className="donut-layout">
        <div className="donut-wrap">
          <Doughnut data={data} options={options} aria-label="Кръгова диаграма на видовете заведения" role="img" />
          <div className="donut-center" aria-hidden="true">
            <strong>{total}</strong>
            <span>общо</span>
          </div>
        </div>
        <Legend
          items={rows.map((r, i) => ({ label: r.label, color: colors[i], value: `${r.count} · ${pct(r.count, total)}%` }))}
        />
      </div>
    </ChartCard>
  );
}
