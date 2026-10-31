import { Doughnut } from 'react-chartjs-2';
import ChartCard, { Legend } from './ChartCard.jsx';
import { chartTheme, tooltipOptions } from './palette.js';
import { pct, placesTotals } from '../../utils/stats.js';

const nf = new Intl.NumberFormat('bg-BG');

/**
 * Part-to-whole: taken vs free places, summed over all the kindergartens in
 * the current results (all of Sofia, or the selected districts / search).
 */
export default function PlacesDonut({ items, scheme, scopeLabel }) {
  const theme = chartTheme(scheme);
  const t = placesTotals(items);
  if (t.known === 0 || t.capacity === 0) return null;

  // Free uses the same green slot as "Свободни места" on the detail page.
  const rows = [
    { key: 'taken', label: 'Заети', count: t.taken, color: theme.series[0] },
    { key: 'free', label: 'Свободни', count: t.free, color: theme.series[2] },
  ];

  const data = {
    labels: rows.map((r) => r.label),
    datasets: [
      {
        data: rows.map((r) => r.count),
        backgroundColor: rows.map((r) => r.color),
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
        callbacks: { label: (ctx) => ` ${nf.format(ctx.raw)} места (${pct(ctx.raw, t.capacity)}%)` },
      },
    },
  };

  const coverage =
    t.known < t.total ? ` Няма данни за ${t.total - t.known} от ${t.total} заведения.` : '';

  return (
    <ChartCard
      title="Свободни места"
      subtitle={`Общо за всички групи ${scopeLabel}, текуща учебна година.${coverage}`}
      dataView={
        <ul>
          <li>Места общо: {nf.format(t.capacity)}</li>
          {rows.map((r) => (
            <li key={r.key}>
              {r.label}: {nf.format(r.count)} ({pct(r.count, t.capacity)}%)
            </li>
          ))}
        </ul>
      }
    >
      <div className="donut-layout">
        <div className="donut-wrap">
          <Doughnut data={data} options={options} aria-label="Кръгова диаграма на заетите и свободните места" role="img" />
          <div className="donut-center" aria-hidden="true">
            <strong>{nf.format(t.free)}</strong>
            <span>свободни</span>
          </div>
        </div>
        <Legend
          items={[
            ...rows.map((r) => ({ label: r.label, color: r.color, value: `${nf.format(r.count)} · ${pct(r.count, t.capacity)}%` })),
            { label: 'Места общо', color: 'transparent', value: nf.format(t.capacity) },
          ]}
        />
      </div>
    </ChartCard>
  );
}
