import { Bar } from 'react-chartjs-2';
import ChartCard, { Legend } from '../charts/ChartCard.jsx';
import { chartTheme, tooltipOptions } from '../charts/palette.js';
import Icon from '../Icon.jsx';
import { GROUP_KIND_LABEL } from '../../utils/ranking.js';

/** Stacked series for the chart: enrolled, ranked-but-not-enrolled, free. */
const SERIES = [
  { key: 'enrolled', label: 'Записани', slot: 0 },
  { key: 'notEnrolled', label: 'Класирани, още незаписани', slot: 1 },
  { key: 'free', label: 'Свободни места', slot: 2 },
];

function PlacesChart({ groups, scheme }) {
  const theme = chartTheme(scheme);
  const series = SERIES.filter((s) => s.key !== 'notEnrolled' || groups.some((g) => g.totals.notEnrolled > 0));

  const data = {
    labels: groups.map((g) => g.label.replace(/,?\s*родени.*$/i, '')),
    datasets: series.map((s) => ({
      label: s.label,
      data: groups.map((g) => g.totals[s.key]),
      backgroundColor: theme.series[s.slot],
      borderColor: theme.surface,
      borderWidth: { right: 2 },
      borderSkipped: false,
      borderRadius: 4,
      maxBarThickness: 22,
    })),
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: { stacked: true, beginAtZero: true, ticks: { color: theme.muted, precision: 0 }, grid: { color: theme.grid }, border: { color: theme.axis } },
      y: { stacked: true, ticks: { color: theme.text, font: { size: 12 } }, grid: { display: false }, border: { color: theme.axis } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOptions(theme),
        mode: 'index',
        callbacks: {
          title: (items) => groups[items[0].dataIndex].label,
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}`,
          footer: (items) => `Места общо: ${groups[items[0].dataIndex].totals.capacity}`,
        },
      },
    },
  };

  return (
    <ChartCard
      title="Места по групи"
      subtitle="Колко от местата във всяка група са заети и колко са свободни"
      dataView={
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              {g.label}: {g.totals.capacity} места, {g.totals.enrolled} записани, {g.totals.free} свободни
            </li>
          ))}
        </ul>
      }
    >
      <Legend items={series.map((s) => ({ label: s.label, color: theme.series[s.slot] }))} />
      <div style={{ height: groups.length * 46 + 40 }}>
        <Bar data={data} options={options} aria-label="Места по групи" role="img" />
      </div>
    </ChartCard>
  );
}

function GroupCard({ group, onOpenRanking }) {
  const { totals } = group;
  const pct = (n) => (totals.capacity ? (n / totals.capacity) * 100 : 0);
  const quotas = group.quotas.filter((q) => q.capacity > 0 || q.free > 0);
  const canRank = group.ratings.length > 0 || group.waitingListVisible;

  return (
    <article className={`group-card kind-${group.kind}`}>
      <div className="group-card-top">
        <span className="group-kind">{GROUP_KIND_LABEL[group.kind]}</span>
        {group.groupCount > 1 && <span className="text-body-secondary small">{group.groupCount} паралелки</span>}
      </div>
      <h3 className="group-title">{group.label}</h3>

      <div className={`group-free ${totals.free > 0 ? 'has' : ''}`}>
        {totals.free > 0 ? (
          <>
            <strong>{totals.free}</strong> {totals.free === 1 ? 'свободно място' : 'свободни места'}
          </>
        ) : (
          'Няма свободни места'
        )}
      </div>

      <div
        className="places-bar"
        role="img"
        aria-label={`${totals.enrolled} записани, ${totals.notEnrolled} класирани незаписани, ${totals.free} свободни от ${totals.capacity} места`}
      >
        <span className="seg seg-enrolled" style={{ width: `${pct(totals.enrolled)}%` }} />
        <span className="seg seg-pending" style={{ width: `${pct(totals.notEnrolled)}%` }} />
        <span className="seg seg-free" style={{ width: `${pct(totals.free)}%` }} />
      </div>
      <div className="places-caption">
        {totals.enrolled} записани от {totals.capacity} места
        {totals.notEnrolled > 0 && ` · ${totals.notEnrolled} класирани чакат записване`}
      </div>

      {quotas.length > 1 && (
        <ul className="quota-list">
          {quotas.map((q) => (
            <li key={q.type}>
              <span>{q.label}</span>
              <span>
                {q.capacity} места · <strong className={q.free > 0 ? 'text-success' : ''}>{q.free} свободни</strong>
              </span>
            </li>
          ))}
        </ul>
      )}

      {group.comment && <p className="small text-body-secondary mb-2">{group.comment}</p>}

      {canRank && (
        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill mt-auto align-self-start" onClick={() => onOpenRanking(group.id)}>
          Класиране и чакащи <Icon name="arrow" size={14} />
        </button>
      )}
    </article>
  );
}

export default function GroupsSection({ groups, nextYearGroups, schoolYear, schoolYearNext, onOpenRanking, scheme }) {
  if (groups.length === 0 && nextYearGroups.length === 0) {
    return (
      <div className="chart-card">
        <h2 className="section-title">Групи и места</h2>
        <p className="text-body-secondary mb-0">Няма публикувани групи за тази градина.</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="section-title">
        Групи и места {schoolYear && <span className="section-sub">учебна {schoolYear} г.</span>}
      </h2>
      {groups.length > 0 && (
        <>
          <PlacesChart groups={groups} scheme={scheme} />
          <div className="group-grid mt-3">
            {groups.map((g) => (
              <GroupCard key={g.id} group={g} onOpenRanking={onOpenRanking} />
            ))}
          </div>
        </>
      )}
      {nextYearGroups.length > 0 && (
        <>
          <h3 className="h6 fw-bold mt-4">За учебна {schoolYearNext} г.</h3>
          <div className="group-grid">
            {nextYearGroups.map((g) => (
              <GroupCard key={g.id} group={g} onOpenRanking={onOpenRanking} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
