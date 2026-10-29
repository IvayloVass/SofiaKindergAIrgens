import { ArcElement, BarElement, CategoryScale, Chart, LinearScale, Tooltip } from 'chart.js';

// Register only the Chart.js parts we use (keeps the bundle small).
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);
Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Validated colorblind-safe categorical palette (fixed order, light & dark steps).
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500'],
};

const CHROME = {
  light: { surface: '#ffffff', text: '#0b0b0b', muted: '#6b6a66', grid: '#e1e0d9', axis: '#c3c2b7', dim: '#d5d4cd' },
  dark: { surface: '#1d1c22', text: '#f0efec', muted: '#a9a8a0', grid: '#2c2c2a', axis: '#383835', dim: '#45444a' },
};

export function chartTheme(scheme) {
  const mode = scheme === 'dark' ? 'dark' : 'light';
  return { series: SERIES[mode], ...CHROME[mode] };
}

/** Shared tooltip look. */
export function tooltipOptions(theme) {
  return {
    backgroundColor: theme.text,
    titleColor: theme.surface,
    bodyColor: theme.surface,
    padding: 10,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 4,
  };
}
