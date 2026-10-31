import { useState } from 'react';
import Icon from '../Icon.jsx';
import { downloadFile, saveBlob } from '../../api/client.js';

const FORMATS = [
  { ext: 'xlsx', label: 'Excel' },
  { ext: 'pdf', label: 'PDF' },
];

/** Downloads the kindergarten's ratings and statistics (all groups) as Excel or PDF. */
export default function ReportDownload({ id, shortName }) {
  const [busy, setBusy] = useState(null); // the format being prepared
  const [error, setError] = useState(null);

  const download = async (ext) => {
    setBusy(ext);
    setError(null);
    try {
      const { blob, filename } = await downloadFile(`/api/kindergartens/${id}/report.${ext}`);
      saveBlob(blob, filename || `${shortName || `kindergarten-${id}`}.${ext}`);
    } catch (err) {
      setError({ ext, message: err.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="chart-card report-card">
      <div className="report-text">
        <h2 className="report-title">
          <Icon name="download" size={18} /> Изтегли класиране и статистика
        </h2>
        <p className="report-sub">Всички групи: места, чакащи и последно класиране.</p>
      </div>
      <div className="report-actions">
        {FORMATS.map((f) => (
          <button
            key={f.ext}
            type="button"
            className="btn btn-outline-primary action-btn"
            onClick={() => download(f.ext)}
            disabled={busy !== null}
            aria-label={`Изтегли като ${f.label}`}
          >
            {busy === f.ext ? (
              <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            ) : (
              <Icon name="download" size={16} />
            )}
            {f.label}
          </button>
        ))}
      </div>
      {busy && (
        <p className="report-status" role="status">
          Подготвяме файла… Това може да отнеме няколко секунди.
        </p>
      )}
      {error && (
        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 mb-0 report-error" role="alert">
          <span className="flex-grow-1">{error.message}</span>
          <button type="button" className="btn btn-sm btn-light" onClick={() => download(error.ext)}>
            Опитай отново
          </button>
        </div>
      )}
    </div>
  );
}
