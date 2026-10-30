import { Link } from '../router.jsx';

/**
 * The app's mark: a house whose roof follows Vitosha's two peaks, with a sun
 * above and a sprout growing from the door - a "children's garden" in Sofia.
 * The same drawing is used for the favicon (public/favicon.svg).
 */
export function LogoMark({ size = 40, className = '', title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`logo-mark ${className}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <rect width="64" height="64" rx="18" fill="#ffffff" />
      <circle cx="47" cy="15" r="6" fill="#ffb703" />
      {/* Roof: Vitosha's twin peaks */}
      <path
        d="M9 33 22 19l6 6 6-7 21 15"
        fill="none"
        stroke="#1b2f5e"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Walls */}
      <path d="M15 31v19h34V31" fill="none" stroke="#1b2f5e" strokeWidth="4.5" strokeLinejoin="round" />
      {/* Sprout as the door */}
      <path d="M32 50v-9" stroke="#1f9d6b" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 43c-6 0-8.5-3.5-8.5-7 4.5 0 8.5 2.2 8.5 7Z" fill="#2bb673" />
      <path d="M32 41c0-5 3-8 8.5-8 0 4.2-3 8-8.5 8Z" fill="#2bb673" />
    </svg>
  );
}

/** Mark + name, linking to the home page. */
export function Brand({ size = 32, showName = true, className = '' }) {
  return (
    <Link to="/" className={`brand ${className}`} aria-label="Детски градини София — начало">
      <LogoMark size={size} />
      {showName && (
        <span className="brand-name">
          <strong>Детски градини</strong>
          <span>София</span>
        </span>
      )}
    </Link>
  );
}
