import { memo } from 'react';
import Icon from './Icon.jsx';
import { GROUPS, typeInfo } from '../utils/types.js';
import { mapsHref, phoneHref } from '../utils/format.js';
import { Link, kindergartenPath } from '../router.jsx';

function KindergartenCard({ kg, onRegionClick, regionSelected }) {
  const type = typeInfo(kg.type);
  return (
    <article className={`kg-card type-slot-${type.slot + 1}`}>
      <div className="kg-card-top">
        <span className="kg-type">{type.label}</span>
        <button
          type="button"
          className={`kg-region ${regionSelected ? 'is-on' : ''}`}
          onClick={() => onRegionClick(kg.regionId)}
          title={regionSelected ? `Премахни филтъра „${kg.regionName}“` : `Покажи само район „${kg.regionName}“`}
        >
          {kg.regionName}
        </button>
      </div>

      <h3 className="kg-name">
        {/* The link covers the whole card (see .kg-card-link::after); inner buttons/links sit above it. */}
        <Link to={kindergartenPath(kg.id)} className="kg-card-link">
          {kg.name}
        </Link>
      </h3>

      <ul className="kg-groups" aria-label="Групи">
        {GROUPS.map((g) => (
          <li key={g.key} className={kg[g.key] ? 'has' : 'no'}>
            <Icon name={kg[g.key] ? 'check' : 'minus'} size={14} />
            <span>{g.short}</span>
            <span className="visually-hidden">{kg[g.key] ? ': има' : ': няма'}</span>
          </li>
        ))}
      </ul>

      <div className="kg-contacts">
        {kg.address && (
          <a className="kg-line" href={mapsHref(kg)} target="_blank" rel="noreferrer" title="Отвори в Google Maps">
            <Icon name="pin" size={16} />
            <span>{kg.address}</span>
          </a>
        )}
        {kg.phones.length > 0 ? (
          <div className="kg-line">
            <Icon name="phone" size={16} />
            <span className="kg-phones">
              {kg.phones.map((p) => (
                <a key={p} href={phoneHref(p)}>
                  {p}
                </a>
              ))}
            </span>
          </div>
        ) : (
          <div className="kg-line text-body-tertiary">
            <Icon name="phone" size={16} />
            <span>Няма публикуван телефон</span>
          </div>
        )}
      </div>

      <div className="kg-more" aria-hidden="true">
        Групи, места и класиране <Icon name="arrow" size={16} />
      </div>
    </article>
  );
}

export default memo(KindergartenCard);
