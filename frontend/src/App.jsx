import { useLayoutEffect, useMemo } from 'react';
import ListPage from './pages/ListPage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import { useKindergartens } from './hooks/useKindergartens.js';
import { useColorScheme } from './hooks/useColorScheme.js';
import { matchRoute, useLocation } from './router.jsx';

export default function App() {
  const scheme = useColorScheme();
  // Loaded once and kept while moving between pages.
  const data = useKindergartens();
  const location = useLocation();
  const pathname = location.split('?')[0];
  const route = useMemo(() => matchRoute(pathname), [pathname]);

  // New page → start at the top. Back to the list → return to where the user was.
  const listReady = data.status === 'ready';
  useLayoutEffect(() => {
    const y = window.history.state?.scrollY;
    if (route.name === 'list' && y != null) {
      if (listReady) window.scrollTo(0, y);
    } else {
      window.scrollTo(0, 0);
    }
  }, [route, listReady]);

  return (
    <>
      {route.name === 'detail' ? (
        <DetailPage key={route.id} id={route.id} data={data} scheme={scheme} />
      ) : (
        <ListPage data={data} scheme={scheme} />
      )}

      <footer className="site-footer">
        <div className="container-xxl px-3 px-md-4">
          Източник на данните:{' '}
          <a href="https://kg.sofia.bg/#/kindergartens" target="_blank" rel="noreferrer">
            ИСОДЗ на Столична община (kg.sofia.bg)
          </a>
          . Неофициално приложение, създадено с отворени данни.
        </div>
      </footer>
    </>
  );
}
