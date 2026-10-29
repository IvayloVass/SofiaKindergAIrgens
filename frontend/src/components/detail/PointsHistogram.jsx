import { Bar } from 'react-chartjs-2';
import ChartCard from '../charts/ChartCard.jsx';
import { chartTheme, tooltipOptions } from '../charts/palette.js';
import { formatPoints, pointsHistogram } from '../../utils/ranking.js';

/** How many waiting children have each number of points. The looked-up child's bar is highlighted. */
export default function PointsHistogram({ entries, highlightPoints, scheme }) {
  const theme = chartTheme(scheme);
  const rows = pointsHistogram(entries).reverse(); // low → high, left → right
  const hasHighlight = highlightPoints != null;
  const colors = rows.map((r) => (!hasHighlight || r.points === highlightPoints ? theme.series[0] : theme.dim));

  const data = {
    labels: rows.map((r) => formatPoints(r.points)),
    datasets: [
      {
        label: 'Деца',
        data: rows.map((r) => r.count),
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: 'start',
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        title: { display: true, text: 'Точки', color: theme.muted },
        ticks: { color: theme.text },
        grid: { display: false },
        border: { color: theme.axis },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Брой деца', color: theme.muted },
        ticks: { color: theme.muted, precision: 0 },
        grid: { color: theme.grid },
        border: { color: theme.axis },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions(theme),
        displayColors: false,
        callbacks: {
          title: (items) => `${items[0].label} точки`,
          label: (ctx) => ` ${ctx.raw} ${ctx.raw === 1 ? 'дете' : 'деца'}`,
        },
      },
    },
  };

  return (
    <ChartCard
      title="Разпределение по точки"
      subtitle="Колко чакащи деца имат даден брой точки — колкото по-вдясно, толкова по-напред в списъка"
      dataView={
        <ul className="columns-2">
          {rows
            .slice()
            .reverse()
            .map((r) => (
              <li key={r.points}>
                {formatPoints(r.points)} т.: {r.count}
              </li>
            ))}
        </ul>
      }
    >
      <div style={{ height: 220 }}>
        <Bar data={data} options={options} aria-label="Разпределение на чакащите деца по точки" role="img" />
      </div>
    </ChartCard>
  );
}
