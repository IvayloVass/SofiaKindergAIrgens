import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import DetailHero from '../components/detail/DetailHero.jsx';
import FactTiles from '../components/detail/FactTiles.jsx';
import GroupsSection from '../components/detail/GroupsSection.jsx';
import RankingSection from '../components/detail/RankingSection.jsx';
import ParentInfo from '../components/detail/ParentInfo.jsx';
import { useApi } from '../hooks/useApi.js';
import { Link, goBack } from '../router.jsx';
import { formatDate } from '../utils/format.js';

const SECTIONS = [
  { id: 'groups', label: 'Групи и места' },
  { id: 'ranking', label: 'Класиране и чакащи' },
  { id: 'parents', label: 'За родители' },
];

export default function DetailPage({ id, data, scheme }) {
  // Basic info from the list (if already loaded) shows instantly while details load.
  const basic = data.kindergartens.find((k) => k.id === id) ?? null;
  const { status, data: detail, error, reload } = useApi(`/api/kindergartens/${id}`);
  const [groupId, setGroupId] = useState(null);
  const rankingRef = useRef(null);

  const name = detail?.name ?? basic?.name;
  useEffect(() => {
    document.title = name ? `${name} · Детски градини София` : 'Детски градини София';
    return () => {
      document.title = 'Детски градини София';
    };
  }, [name]);

  const openRanking = (gid) => {
    setGroupId(gid);
    rankingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="detail-page">
      <nav className="detail-topbar" aria-label="Навигация">
        <div className="container-xxl px-3 px-md-4 d-flex align-items-center gap-2">
          <button type="button" className="btn btn-back" onClick={() => goBack('/')}>
            <Icon name="back" /> <span>Всички градини</span>
          </button>
          {status === 'ready' && (
            <div className="section-links d-none d-md-flex">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`}>
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {status === 'notfound' ? (
        <div className="container-xxl px-3 px-md-4 py-5">
          <div className="empty-state">
            <div className="empty-emoji" aria-hidden="true">🏫</div>
            <h1 className="h4">Няма такава детска градина</h1>
            <p className="text-body-secondary">Възможно е връзката да е остаряла или градината да е закрита.</p>
            <Link to="/" className="btn btn-primary rounded-pill px-4">
              Към всички градини
            </Link>
          </div>
        </div>
      ) : (
        <>
          <DetailHero detail={detail} basic={basic} />

          <div className="container-xxl px-3 px-md-4 py-4 detail-body">
            {status === 'error' && (
              <div className="alert alert-danger d-flex flex-wrap align-items-center gap-3" role="alert">
                <span className="flex-grow-1">Подробностите не могат да бъдат заредени. {error?.message}</span>
                <button type="button" className="btn btn-sm btn-light" onClick={reload}>
                  <Icon name="refresh" size={16} /> Опитай отново
                </button>
              </div>
            )}

            {status === 'loading' && <DetailSkeleton />}

            {status === 'ready' && detail && (
              <>
                {detail.stale && (
                  <div className="alert alert-warning small" role="status">
                    kg.sofia.bg не отговаря в момента. Показваме последните запазени данни от {formatDate(detail.fetchedAt)}.
                  </div>
                )}

                <FactTiles groups={detail.groups} schoolYear={detail.schoolYear} />

                <section id="groups" className="detail-section">
                  <GroupsSection
                    groups={detail.groups}
                    nextYearGroups={detail.nextYearGroups}
                    schoolYear={detail.schoolYear}
                    schoolYearNext={detail.schoolYearNext}
                    onOpenRanking={openRanking}
                    scheme={scheme}
                  />
                </section>

                <section id="ranking" className="detail-section" ref={rankingRef}>
                  <RankingSection
                    kindergartenId={detail.id}
                    groups={[...detail.groups, ...detail.nextYearGroups]}
                    selectedGroupId={groupId}
                    onSelectGroup={setGroupId}
                    scheme={scheme}
                  />
                </section>

                <section id="parents" className="detail-section">
                  <ParentInfo html={detail.infoForParents} director={detail.director} />
                </section>

                <p className="detail-updated">
                  Данни от{' '}
                  <a href={`https://kg.sofia.bg/#/kindergarten/${detail.id}`} target="_blank" rel="noreferrer">
                    kg.sofia.bg
                  </a>
                  , обновени на {formatDate(detail.fetchedAt)}.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="placeholder-glow" aria-busy="true" aria-label="Зареждане">
      <div className="stat-tiles">
        {[0, 1, 2, 3].map((i) => (
          <div className="stat-tile" key={i}>
            <span className="placeholder col-6 rounded mb-2" />
            <span className="placeholder col-4 rounded" style={{ height: '1.75rem' }} />
          </div>
        ))}
      </div>
      <div className="group-grid mt-4">
        {[0, 1, 2].map((i) => (
          <div className="group-card" key={i}>
            <span className="placeholder col-8 rounded mb-3" />
            <span className="placeholder col-12 rounded mb-2" style={{ height: 10 }} />
            <span className="placeholder col-6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
