import Icon from '../Icon.jsx';
import { Link } from '../../router.jsx';
import { GROUPS, typeInfo } from '../../utils/types.js';
import { mapsHref, phoneHref } from '../../utils/format.js';

/** Top of the detail page: name, type, district, address and quick contact actions. */
export default function DetailHero({ detail, basic }) {
  const k = detail ?? basic;
  if (!k) {
    return (
      <header className="detail-hero">
        <div className="container-xxl px-3 px-md-4 placeholder-glow">
          <span className="placeholder col-3 rounded mb-3" />
          <span className="placeholder col-8 rounded mb-3" style={{ height: '2.2rem' }} />
          <span className="placeholder col-5 rounded" />
        </div>
      </header>
    );
  }

  const type = typeInfo(k.type);
  const phones = detail?.contacts.phones ?? basic?.phones ?? [];
  const emails = detail?.contacts.emails ?? [];
  const websites = detail?.contacts.websites ?? [];
  const regionId = detail?.regionId ?? basic?.regionId;

  return (
    <header className={`detail-hero type-slot-${type.slot + 1}`}>
      <div className="container-xxl px-3 px-md-4">
        <div className="detail-hero-top">
          <span className="kg-type">{type.label}</span>
          {regionId && (
            <Link to={`/?regions=${regionId}`} className="kg-region" title={`Всички градини в район ${k.regionName}`}>
              район {k.regionName}
            </Link>
          )}
        </div>

        <h1 className="detail-title">{k.name}</h1>

        <div className="detail-lines">
          {k.address && (
            <a className="kg-line" href={mapsHref(k)} target="_blank" rel="noreferrer">
              <Icon name="pin" size={18} />
              <span>{k.address}</span>
            </a>
          )}
          {detail?.director && (
            <div className="kg-line">
              <Icon name="user" size={18} />
              <span>
                Директор: <strong>{detail.director}</strong>
              </span>
            </div>
          )}
        </div>

        <ul className="kg-groups mt-3" aria-label="Групи">
          {GROUPS.map((g) => (
            <li key={g.key} className={k[g.key] ? 'has' : 'no'}>
              <Icon name={k[g.key] ? 'check' : 'minus'} size={14} />
              <span>{g.label}</span>
              <span className="visually-hidden">{k[g.key] ? ': има' : ': няма'}</span>
            </li>
          ))}
        </ul>

        <div className="detail-actions">
          {phones.map((p) => (
            <a key={p} className="btn btn-primary action-btn" href={phoneHref(p)}>
              <Icon name="phone" size={16} /> {p}
            </a>
          ))}
          {emails.map((e) => (
            <a key={e} className="btn btn-outline-primary action-btn" href={`mailto:${e}`}>
              <Icon name="mail" size={16} /> {e}
            </a>
          ))}
          {websites.map((w) => (
            <a key={w} className="btn btn-outline-primary action-btn" href={w} target="_blank" rel="noreferrer">
              <Icon name="web" size={16} /> Уебсайт
            </a>
          ))}
          {k.address && (
            <a className="btn btn-outline-primary action-btn" href={mapsHref(k)} target="_blank" rel="noreferrer">
              <Icon name="pin" size={16} /> Карта
            </a>
          )}
          <a
            className="btn btn-outline-secondary action-btn"
            href={`https://kg.sofia.bg/#/kindergarten/${k.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="external" size={16} /> В kg.sofia.bg
          </a>
        </div>
      </div>
    </header>
  );
}
