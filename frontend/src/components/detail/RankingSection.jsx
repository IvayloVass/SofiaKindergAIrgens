import { useEffect, useState } from 'react';
import Icon from '../Icon.jsx';
import EntryList from './EntryList.jsx';
import PointsHistogram from './PointsHistogram.jsx';
import { useApi } from '../../hooks/useApi.js';
import {
  cleanApplicationNumber,
  cutoffPoints,
  findApplication,
  formatPoints,
  formatShortDate,
  waitingSummary,
} from '../../utils/ranking.js';

const STAGES = [
  { key: 'rated', label: 'Класирани' },
  { key: 'notRated', label: 'Некласирани' },
  { key: 'entry', label: 'Преди класирането' },
];

/** Group picker + waiting list / rankings for the chosen group. */
export default function RankingSection({ kindergartenId, groups, selectedGroupId, onSelectGroup, scheme }) {
  const rankable = groups.filter((g) => g.ratings.length > 0 || g.waitingListVisible);
  const group = rankable.find((g) => g.id === selectedGroupId) ?? rankable[0];

  if (!group) {
    return (
      <div className="chart-card">
        <h2 className="section-title">Класиране и чакащи</h2>
        <p className="text-body-secondary mb-0">Няма публикувано класиране за тази градина.</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="section-title">Класиране и чакащи</h2>
      <p className="text-body-secondary small mb-3">
        Изберете група. Списъците съдържат само инициали и входящ номер — така, както ги публикува Столична община.
      </p>
      <div className="pill-tabs" role="tablist" aria-label="Група">
        {rankable.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={g.id === group.id}
            className={g.id === group.id ? 'active' : ''}
            onClick={() => onSelectGroup(g.id)}
          >
            {g.label.replace(/,?\s*родени.*$/i, '')}
            {g.birthYear && <span className="pill-sub">{g.birthYear} г.</span>}
          </button>
        ))}
      </div>
      <GroupRanking key={group.id} kindergartenId={kindergartenId} group={group} scheme={scheme} />
    </>
  );
}

function GroupRanking({ kindergartenId, group, scheme }) {
  const ratingsNewestFirst = [...group.ratings].reverse();
  const [view, setView] = useState(group.waitingListVisible ? 'waiting' : String(ratingsNewestFirst[0]?.id));
  const [lookup, setLookup] = useState('');
  const number = cleanApplicationNumber(lookup);

  return (
    <div className="chart-card ranking-card">
      <div className="ranking-head">
        <div className="view-switch scrollable" role="tablist" aria-label="Списък">
          {group.waitingListVisible && (
            <button type="button" role="tab" aria-selected={view === 'waiting'} className={view === 'waiting' ? 'active' : ''} onClick={() => setView('waiting')}>
              <Icon name="people" size={16} /> Чакащи
            </button>
          )}
          {ratingsNewestFirst.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={view === String(r.id)}
              className={view === String(r.id) ? 'active' : ''}
              onClick={() => setView(String(r.id))}
            >
              <Icon name="calendar" size={16} /> Класиране {formatShortDate(r.date)}
            </button>
          ))}
        </div>

        <label className="lookup">
          <span className="visually-hidden">Входящ номер на детето</span>
          <Icon name="search" size={16} />
          <input
            type="search"
            inputMode="numeric"
            className="form-control form-control-sm"
            placeholder="Входящ номер на детето"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
          />
        </label>
      </div>

      {view === 'waiting' ? (
        <WaitingView kindergartenId={kindergartenId} group={group} number={number} scheme={scheme} />
      ) : (
        <RankingView kindergartenId={kindergartenId} group={group} ratingId={view} number={number} />
      )}
    </div>
  );
}

function LookupResult({ number, matches }) {
  if (number.length < 4) return null;
  if (matches.length === 0) {
    return (
      <div className="lookup-result is-miss" role="status">
        Входящ № {number} не е в този списък.
      </div>
    );
  }
  return (
    <div className="lookup-result is-hit" role="status">
      {matches.map(({ listLabel, entry }) => (
        <div key={listLabel}>
          <Icon name="check" size={16} /> Входящ № {number} е на <strong>{entry.rank}. място</strong> в „{listLabel}“ с{' '}
          <strong>{formatPoints(entry.points)} т.</strong>
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="placeholder-glow py-3" aria-busy="true">
      <span className="placeholder col-12 rounded mb-2" style={{ height: 120 }} />
      <span className="placeholder col-8 rounded" />
    </div>
  );
}

function LoadError({ error, reload }) {
  return (
    <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 mt-3 mb-0" role="alert">
      <span className="flex-grow-1">{error?.message || 'Списъкът не може да бъде зареден.'}</span>
      <button type="button" className="btn btn-sm btn-light" onClick={reload}>
        Опитай отново
      </button>
    </div>
  );
}

function WaitingView({ kindergartenId, group, number, scheme }) {
  const { status, data, error, reload } = useApi(`/api/kindergartens/${kindergartenId}/groups/${group.id}/waiting`);
  if (status === 'loading') return <Loading />;
  if (status === 'error') return <LoadError error={error} reload={reload} />;
  if (status !== 'ready') return <p className="text-body-secondary mt-3 mb-0">Няма списък с чакащи за тази група.</p>;

  const lists = data.lists.filter((l) => l.entries.length > 0);
  const s = waitingSummary(data.lists);
  const matches = findApplication(lists, number);
  const general = data.lists.find((l) => l.category === 'general');

  return (
    <div className="mt-3">
      <div className="mini-tiles">
        <MiniTile label="Чакащи деца" value={s.waiting} />
        <MiniTile label="Свободни места" value={s.free} good={s.free > 0} />
        <MiniTile label="Най-много точки" value={formatPoints(s.maxPoints)} />
        <MiniTile label="Най-малко точки" value={formatPoints(s.minPoints)} />
      </div>

      <LookupResult number={number} matches={matches} />

      {s.waiting === 0 ? (
        <p className="text-body-secondary mb-0">Няма чакащи деца за тази група.</p>
      ) : (
        <>
          {general?.entries.length > 1 && (
            <PointsHistogram entries={general.entries} highlightPoints={matches[0]?.entry.points ?? null} scheme={scheme} />
          )}
          <div className="entry-columns">
            {lists.map((l) => (
              <EntryList key={l.category} label={`${l.label} · ${l.entries.length} деца`} entries={l.entries} highlight={number} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RankingView({ kindergartenId, group, ratingId, number }) {
  const { status, data, error, reload } = useApi(`/api/kindergartens/${kindergartenId}/groups/${group.id}/rankings/${ratingId}`);
  const [stage, setStage] = useState('rated');
  useEffect(() => setStage('rated'), [ratingId]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <LoadError error={error} reload={reload} />;
  if (status !== 'ready') return <p className="text-body-secondary mt-3 mb-0">Класирането не е налично.</p>;

  const list = data[stage];
  const sections = list.sections.filter((s) => s.entries.length > 0);
  const ratedSections = data.rated.sections.filter((s) => s.entries.length > 0);
  const ratedCount = ratedSections.reduce((acc, s) => acc + s.entries.length, 0);
  const notRatedCount = data.notRated.sections.reduce((acc, s) => acc + s.entries.length, 0);
  const cutoff = cutoffPoints(ratedSections.filter((s) => s.category === 'general'));
  const matches = findApplication(
    STAGES.flatMap((st) => data[st.key].sections.map((s) => ({ ...s, label: `${st.label}: ${shortSection(s.title)}` }))),
    number,
  );

  return (
    <div className="mt-3">
      <div className="mini-tiles">
        <MiniTile label="Класирани деца" value={ratedCount} good={ratedCount > 0} />
        <MiniTile label="Некласирани" value={notRatedCount} />
        <MiniTile label="Минимален бал (общ ред)" value={formatPoints(cutoff)} />
        <MiniTile label="Набор" value={data.rated.cohort?.replace(/^Набор\s*/i, '') || group.birthYear || '—'} />
      </div>

      {data.rated.note && (
        <div className="enroll-note">
          <Icon name="calendar" size={16} /> {data.rated.note}
        </div>
      )}

      <LookupResult number={number} matches={matches} />

      <div className="stage-switch" role="tablist" aria-label="Етап">
        {STAGES.map((st) => (
          <button key={st.key} type="button" role="tab" aria-selected={stage === st.key} className={stage === st.key ? 'active' : ''} onClick={() => setStage(st.key)}>
            {st.label}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <p className="text-body-secondary mb-0">
          {stage === 'rated' ? 'В това класиране няма класирани деца за тази група.' : 'Списъкът е празен.'}
        </p>
      ) : (
        <div className="entry-columns">
          {sections.map((s) => (
            <EntryList
              key={s.title}
              label={`${shortSection(s.title)} · ${s.entries.length} ${s.entries.length === 1 ? 'дете' : 'деца'}${s.places != null ? ` · ${s.places} места` : ''}`}
              entries={s.entries}
              highlight={number}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** "Списък класирани по общи критерии на 16.10.2026" → "Общи критерии" */
function shortSection(title = '') {
  if (/СОП/.test(title)) return 'СОП';
  if (/хронични/i.test(title)) return 'Хронични заболявания';
  if (/общи/i.test(title)) return 'Общи критерии';
  return title;
}

function MiniTile({ label, value, good }) {
  return (
    <div className={`mini-tile ${good ? 'is-good' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="mini-value">{value}</div>
    </div>
  );
}
