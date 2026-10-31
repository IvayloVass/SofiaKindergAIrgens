import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../../frontend/src/App.jsx';
import { mockApi } from './data.js';

const cards = () => screen.queryAllByRole('article');

async function openDetailFromList() {
  render(<App />);
  await waitFor(() => expect(cards()).toHaveLength(9));
  fireEvent.click(screen.getByRole('link', { name: 'ДГ №1 Червената шапчица (с яслени групи)' }));
  await screen.findByText('Боряна Ковачева');
}

describe('Kindergarten detail page', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(mockApi()));
  });

  it('opens from the list as its own page with a URL', async () => {
    await openDetailFromList();
    expect(window.location.pathname).toBe('/kindergarten/171');
    expect(screen.getByRole('heading', { level: 1, name: 'ДГ №1 Червената шапчица (с яслени групи)' })).toBeInTheDocument();
  });

  it('shows contacts, places and groups', async () => {
    await openDetailFromList();
    expect(screen.getByRole('link', { name: /odz_1@abv\.bg/ })).toHaveAttribute('href', 'mailto:odz_1@abv.bg');
    expect(screen.getByRole('link', { name: /02\/831 70 17/ })).toHaveAttribute('href', 'tel:+35928317017');

    const free = screen.getByText('Свободни места', { selector: '.stat-label' }).closest('.stat-tile');
    expect(within(free).getByText('18')).toBeInTheDocument(); // 0 + 2 + 3 + 0 + 13
    expect(screen.getByRole('heading', { level: 3, name: '2-ра ясла, родени 2024 г.' })).toBeInTheDocument();
  });

  it('shows the waiting list and finds a child by application number', async () => {
    await openDetailFromList();
    const ranking = document.getElementById('ranking');
    await within(ranking).findByText('РБК');

    fireEvent.change(within(ranking).getByPlaceholderText('Входящ номер на детето'), { target: { value: '2401 8148' } });
    expect(within(ranking).getByRole('status')).toHaveTextContent('Входящ № 24018148 е на 1. място в „Общ ред“ с 20 т.');
    expect(within(ranking).getByText('РБК').closest('li')).toHaveClass('is-me');
  });

  it('downloads the report as Excel or PDF', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:report');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      click.saved = this.download;
    });

    await openDetailFromList();
    expect(screen.getByRole('button', { name: 'Изтегли като Excel' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Изтегли като PDF' }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith('/api/kindergartens/171/report.pdf');
    expect(click.saved).toBe('Червената шапчица - класиране 2026-10-31.pdf');
    click.mockRestore();
  });
});
