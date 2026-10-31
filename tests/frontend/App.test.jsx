import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../../frontend/src/App.jsx';
import { mockApi } from './data.js';

const cards = () => screen.queryAllByRole('article');
const tile = (label) => screen.getByText(label).closest('.stat-tile');

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(mockApi()));
  });

  it('loads and shows all kindergartens as cards with summary tiles', async () => {
    render(<App />);
    await waitFor(() => expect(cards()).toHaveLength(9));
    expect(within(tile('Заведения')).getByText('9')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ДГ №1 Червената шапчица (с яслени групи)' })).toHaveAttribute('href', '/kindergarten/171');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('searches in Latin letters and updates the URL', async () => {
    render(<App />);
    await waitFor(() => expect(cards()).toHaveLength(9));
    fireEvent.change(screen.getByLabelText('Търсене на детска градина'), { target: { value: 'cherven' } });
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(screen.getByRole('heading', { name: /Червената шапчица/ })).toBeInTheDocument();
    expect(window.location.search).toContain('q=cherven');
  });

  it('filters by district, combines with search, and can be cleared', async () => {
    render(<App />);
    await waitFor(() => expect(cards()).toHaveLength(9));

    fireEvent.click(screen.getByRole('button', { name: /^Люлин\s*3$/ }));
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(within(tile('Заведения')).getByText('3')).toBeInTheDocument();
    expect(window.location.search).toMatch(/regions=19/);

    fireEvent.click(screen.getByRole('button', { name: /^Младост\s*2$/ }));
    await waitFor(() => expect(cards()).toHaveLength(5));

    fireEvent.click(screen.getByRole('button', { name: 'Изчисти всичко' }));
    await waitFor(() => expect(cards()).toHaveLength(9));
  });

  it('restores filters from the URL and shows charts in the compare view', async () => {
    window.history.replaceState(null, '', '/?view=compare&regions=19');
    render(<App />);
    const bars = await screen.findAllByTestId('chart-bar');
    expect(bars).toHaveLength(2);
    // Comparison chart: reference row + the selected district.
    const comparison = screen.getByLabelText('Сравнение на районите по видове групи');
    expect(within(comparison).getByText(/^Цяла София:/)).toBeInTheDocument();
    expect(within(comparison).getByText(/^Люлин:/)).toBeInTheDocument();
    expect(screen.getByTestId('chart-doughnut')).toBeInTheDocument();
    expect(within(tile('Заведения')).getByText('3')).toBeInTheDocument();
  });

  it('shows an error with a retry button when the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Данните не могат да бъдат заредени');
    vi.stubGlobal('fetch', vi.fn(mockApi()));
    fireEvent.click(screen.getByRole('button', { name: /Опитай отново/ }));
    await waitFor(() => expect(cards()).toHaveLength(9));
  });
});
