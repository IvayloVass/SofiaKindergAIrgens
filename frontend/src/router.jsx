// A tiny router on top of the History API (two pages don't need a router library).
import { useSyncExternalStore } from 'react';

const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener('popstate', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('popstate', callback);
  };
}

const getLocation = () => window.location.pathname + window.location.search;

/** Re-renders when the URL changes; returns the current path + query. */
export function useLocation() {
  return useSyncExternalStore(subscribe, getLocation, getLocation);
}

/** Goes to another page. Remembers the scroll position of the page we leave. */
export function navigate(to, { replace = false } = {}) {
  window.history.replaceState({ ...window.history.state, scrollY: window.scrollY }, '');
  const state = { fromApp: true };
  if (replace) window.history.replaceState(state, '', to);
  else window.history.pushState(state, '', to);
  notify();
}

/** Back to the previous page if it was inside the app, otherwise to `fallback`. */
export function goBack(fallback = '/') {
  if (window.history.state?.fromApp) window.history.back();
  else navigate(fallback);
}

export function matchRoute(pathname) {
  const detail = /^\/kindergarten\/(\d+)\/?$/.exec(pathname);
  if (detail) return { name: 'detail', id: Number(detail[1]) };
  return { name: 'list' };
}

export const kindergartenPath = (id) => `/kindergarten/${id}`;

/** <a> that navigates inside the app (but still works with ctrl/middle-click). */
export function Link({ to, onClick, children, ...props }) {
  const handleClick = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
