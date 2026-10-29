import { useState } from 'react';

const LONG = 900; // characters of HTML before we collapse it

/** "Info for parents" text published by the kindergarten (sanitized on the server). */
export default function ParentInfo({ html, director }) {
  const [open, setOpen] = useState(false);
  const long = html.length > LONG;

  return (
    <div className="chart-card">
      <h2 className="section-title">Информация за родители</h2>
      {html ? (
        <>
          <div className={`parent-info ${long && !open ? 'is-collapsed' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
          {long && (
            <button type="button" className="btn btn-link px-0" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? 'Скрий' : 'Покажи цялата информация'}
            </button>
          )}
        </>
      ) : (
        <p className="text-body-secondary mb-0">
          Градината не е публикувала допълнителна информация.
          {director && ` За въпроси се обърнете към директора — ${director}.`}
        </p>
      )}
    </div>
  );
}
