import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

// jsdom has no matchMedia.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

// Chart.js needs a real canvas; in tests we render a simple stand-in that
// exposes the chart's labels and values so we can assert on them.
vi.mock('react-chartjs-2', () => {
  const Fake = (kind) =>
    function FakeChart({ data, ...rest }) {
      return (
        <div data-testid={`chart-${kind}`} aria-label={rest['aria-label']}>
          {data.labels.map((label, i) => (
            <span key={label} data-label={label}>
              {label}: {data.datasets.map((d) => d.data[i]).join('/')}
            </span>
          ))}
        </div>
      );
    };
  return { Bar: Fake('bar'), Doughnut: Fake('doughnut') };
});
