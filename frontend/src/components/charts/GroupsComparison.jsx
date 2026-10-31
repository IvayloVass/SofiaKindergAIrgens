import { Bar } from 'react-chartjs-2';
import ChartCard, { Legend } from './ChartCard.jsx';
import { chartTheme, tooltipOptions } from './palette.js';
import { countByRegion, groupSharesByRegion } from '../../utils/stats.js';
import { GROUPS } from '../../utils/types.js';

const DEFAULT_DISTRICTS = 5;

/**
 * Compares districts side by side: what share of their kindergartens run
 * nursery, kindergarten and preparatory groups. "Цяла София" is the reference.
 */
export default function GroupsComparison({ items, regions, selected, scheme, referenceLabel }) {
  const theme = chartTheme(scheme);
  const usingDefault = selected.length === 0;
  const regionIds = usingDefault
    ? countByRegion(items, regions)
      .filter((r) => r.count > 0)
      .slice(0, DEFAULT_DISTRICTS)
      .map((r) => r.id)
    : selected;
  const rows = groupSharesByRegion(items, regions, regionIds, referenceLabel);

  const data = {
    labels: rows.map((r) => r.name),
    datasets: GROUPS.map((g, i) => ({
      label: g.label,
      data: rows.map((r) => r.shares[g.key].pct),
      counts: rows.map((r) => `${r.shares[g.key].count} от ${r.total}`),
      backgroundColor: theme.series[i],
      borderRadius: 4,
      borderSkipped: 'start',
      // A thin surface-colored border leaves a small gap between neighbouring bars.
      borderColor: theme.surface,
      borderWidth: { top: 1, bottom: 1, right: 0, left: 0 },
      maxBarThickness: 12,
      categoryPercentage: 0.8,
      barPercentage: 1,
    })),
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { color: theme.muted, callback: (v) => `${v}%`, stepSize: 25 },
        grid: { color: theme.grid },
        border: { color: theme.axis },
      },
      y: {
        ticks: {
          color: theme.text,
          font: (ctx) => ({ size: 12, weight: ctx.index === 0 ? 'bold' : 'normal' }),
        },
        grid: { display: false },
        border: { color: theme.axis },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions(theme),
        mode: 'index',
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}% (${ctx.dataset.counts[ctx.dataIndex]})`,
        },
      },
    },
  };

  return (
    <ChartCard
      title="Групи по райони"
      className="chart-card-wide"
      subtitle="Дял от заведенията във всеки район с всеки вид групи, в сравнение с цяла София."
      dataView={
        <ul>
          {rows.map((r) => (
            <li key={r.id}>
              {r.name}:{' '}
              {GROUPS.map((g) => `${g.short} ${r.shares[g.key].pct}% (${r.shares[g.key].count} от ${r.total})`).join('; ')}
            </li>
          ))}
        </ul>
      }
    >
      <div style={{ height: rows.length * 56 + 40 }}>
        <Bar data={data} options={options} aria-label="Сравнение на районите по видове групи" role="img" />
      </div>
      <Legend items={GROUPS.map((g, i) => ({ label: g.label, color: theme.series[i] }))} />
    </ChartCard>
  );
}
