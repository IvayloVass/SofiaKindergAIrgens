import { Bar } from 'react-chartjs-2';
import ChartCard from './ChartCard.jsx';
import { chartTheme, tooltipOptions } from './palette.js';
import { countByRegion } from '../../utils/stats.js';

const ROW_HEIGHT = 24;

/**
 * Kindergartens per district (for the current search). Selected districts are
 * highlighted; clicking a bar adds/removes that district from the filter.
 */
export default function DistrictBar({ items, regions, selected, onToggle, scheme }) {
  const theme = chartTheme(scheme);
  const rows = countByRegion(items, regions);
  const anySelected = selected.length > 0;
  const colors = rows.map((r) => (!anySelected || selected.includes(r.id) ? theme.series[0] : theme.dim));

  const data = {
    labels: rows.map((r) => r.name),
    datasets: [
      {
        label: 'Детски градини',
        data: rows.map((r) => r.count),
        backgroundColor: colors,
        hoverBackgroundColor: theme.series[0],
        borderRadius: 4,
        borderSkipped: 'start',
        barThickness: 14,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    onClick: (_evt, elements) => {
      if (elements[0]) onToggle(rows[elements[0].index].id);
    },
    onHover: (evt, elements) => {
      if (evt.native?.target) evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { color: theme.muted, precision: 0 },
        grid: { color: theme.grid },
        border: { color: theme.axis },
      },
      y: {
        ticks: { color: theme.text, autoSkip: false, font: { size: 12 } },
        grid: { display: false },
        border: { color: theme.axis },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions(theme),
        displayColors: false,
        callbacks: {
          label: (ctx) => ` ${ctx.raw} заведения`,
          footer: (ctx) => (selected.includes(rows[ctx[0].dataIndex].id) ? 'Клик: премахни от филтъра' : 'Клик: добави към филтъра'),
        },
      },
    },
  };

  return (
    <ChartCard
      title="Заведения по райони"
      subtitle="Кликнете върху лента, за да добавите или премахнете района от филтъра"
      dataView={
        <ul className="columns-2">
          {rows.map((r) => (
            <li key={r.id}>
              {r.name}: {r.count}
            </li>
          ))}
        </ul>
      }
    >
      <div style={{ height: rows.length * ROW_HEIGHT + 40 }}>
        <Bar data={data} options={options} aria-label="Стълбовидна диаграма на заведенията по райони" role="img" />
      </div>
    </ChartCard>
  );
}
