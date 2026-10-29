import Icon from './Icon.jsx';
import { formatDate } from '../utils/format.js';

export default function Header({ meta, total }) {
  return (
    <header className="hero">
      <div className="container-xxl px-3 px-md-4">
        <div className="hero-content">
          <p className="hero-eyebrow mb-2">Столична община · общински детски градини и ясли</p>
          <h1 className="hero-title">Детските градини в София</h1>
          <p className="hero-lead">
            Намерете бързо градина или ясла по име, адрес или район и сравнете районите с няколко клика.
          </p>
          <div className="hero-meta">
            {total > 0 && <span className="hero-chip">{total} заведения</span>}
            <span className="hero-chip">24 района</span>
            {meta?.lastSyncedAt && (
              <span className="hero-chip">Обновено: {formatDate(meta.lastSyncedAt)}</span>
            )}
          </div>
          {meta && meta.rankingsPublished === false && (
            <p className="hero-note mb-0">
              <Icon name="info" size={16} /> Официалното класиране все още не е публикувано. Данните са от{' '}
              <a href={meta.source} target="_blank" rel="noreferrer">
                kg.sofia.bg
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
