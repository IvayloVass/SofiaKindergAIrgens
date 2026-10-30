import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function SearchBar({ value, onChange }) {
  const inputRef = useRef(null);

  // "/" focuses the search box, like on many popular sites.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="search-box" role="search">
      <Icon name="search" className="search-icon" size={20} />
      <input
        ref={inputRef}
        type="search"
        className="form-control form-control-lg search-input"
        placeholder="Търсене"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
      />
      {value && (
        <button type="button" className="btn search-clear" onClick={() => onChange('')} aria-label="Изчисти търсенето">
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
