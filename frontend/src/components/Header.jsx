import Icon from './Icon.jsx';
import { formatDate } from '../utils/format.js';

export default function Header({ meta, total }) {
  return (
    <header className="hero">
      <div className="container-xxl px-3 px-md-4">
        <div className="hero-content">
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
          <p className="hero-note mb-0">
            <Icon name="info" size={16} /> Изберете детска градина, за да видите групите, свободните места, класирането и
            списъка с чакащи.
          </p>
        </div>
      </div>
    </header>
  );
}
