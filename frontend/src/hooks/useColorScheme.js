import { useEffect, useState } from 'react';

const query = '(prefers-color-scheme: dark)';
const getScheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.(query).matches ? 'dark' : 'light';

/** Follows the OS light/dark setting and tells Bootstrap about it. */
export function useColorScheme() {
  const [scheme, setScheme] = useState(getScheme);

  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = () => setScheme(getScheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', scheme);
  }, [scheme]);

  return scheme;
}
