export default function EmptyState({ onReset }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji" aria-hidden="true">🔍</div>
      <h2 className="h5">Няма намерени детски градини</h2>
      <p className="text-body-secondary">Опитайте с друга дума или изберете повече райони.</p>
      <button type="button" className="btn btn-primary rounded-pill px-4" onClick={onReset}>
        Изчисти филтрите
      </button>
    </div>
  );
}

export function LoadingCards() {
  return (
    <div className="kg-grid" aria-busy="true" aria-label="Зареждане">
      {Array.from({ length: 9 }, (_, i) => (
        <div className="kg-card placeholder-glow" key={i}>
          <span className="placeholder col-5 rounded mb-3" />
          <span className="placeholder col-10 rounded mb-2" style={{ height: '1.25rem' }} />
          <span className="placeholder col-7 rounded mb-3" />
          <span className="placeholder col-9 rounded mb-1" />
          <span className="placeholder col-6 rounded" />
        </div>
      ))}
    </div>
  );
}
