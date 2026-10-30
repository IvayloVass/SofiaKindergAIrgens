import { LogoMark } from './Logo.jsx';
import { formatDate } from '../utils/format.js';

/** Two-tone light bulb in a round badge, for the hint under the title. */
function TipIcon() {
  return (
    <span className="tip-badge" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8v.5h6v-.5c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5Z" fill="#ffc94d" />
        <path d="M9.5 18.5h5M10.5 21h3" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 6.5a3 3 0 0 0-3 3" fill="none" stroke="#fff6d6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/** Mountain line along the bottom of the hero (Vitosha), filled with the page colour so it blends in. */
function Mountains() {
  return (
    <svg className="hero-mountains" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 90V62l140-22 120 18 180-44 120 30 110-20 150 34 170-46 140 28 120-14 190 40V90Z" fill="currentColor" opacity="0.35" />
      <path d="M0 90V72l200-16 160 14 170-30 150 24 160-18 180 26 150-22 270 30V90Z" fill="currentColor" />
    </svg>
  );
}

export default function Header({ meta, total }) {
  return (
    <header className="hero">
      <div className="container-xxl px-3 px-md-4">
        <div className="hero-content">
          <LogoMark size={72} className="hero-logo" title="Детски градини София" />
          <p className="hero-eyebrow mb-2">Столична община · общински детски градини и ясли</p>
          <h1 className="hero-title">Детските градини в София</h1>
          <p className="hero-lead">
            Намерете бързо градина или ясла по име, адрес или район и сравнете районите с няколко клика.
          </p>
          <div className="hero-meta">
            {total > 0 && <span className="hero-chip">{total} заведения</span>}
            <span className="hero-chip">24 района</span>
            {meta?.lastSyncedAt && <span className="hero-chip">Обновено: {formatDate(meta.lastSyncedAt)}</span>}
          </div>
          <p className="hero-note mb-0">
            <TipIcon />
            <span>Изберете детска градина, за да видите групите, свободните места, класирането и списъка с чакащи.</span>
          </p>
        </div>
      </div>
      <Mountains />
    </header>
  );
}
