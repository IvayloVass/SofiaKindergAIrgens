import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(document.title).toMatch(/Червената шапчица/);
  });

  it('shows contacts, places and groups', async () => {
    await openDetailFromList();
    expect(screen.getByRole('link', { name: /odz_1@abv\.bg/ })).toHaveAttribute('href', 'mailto:odz_1@abv.bg');
    expect(screen.getByRole('link', { name: /Уебсайт/ })).toHaveAttribute('href', 'http://detskagradina-1.com/');
    expect(screen.getByRole('link', { name: /02\/831 70 17/ })).toHaveAttribute('href', 'tel:+35928317017');

    const free = screen.getByText('Свободни места', { selector: '.stat-label' }).closest('.stat-tile');
    expect(within(free).getByText('18')).toBeInTheDocument(); // 0 + 2 + 3 + 0 + 13
    expect(screen.getByRole('heading', { level: 3, name: '2-ра ясла, родени 2024 г.' })).toBeInTheDocument();
    expect(screen.getByTestId('chart-bar')).toBeInTheDocument(); // places per group
    expect(screen.getByText('УВАЖАЕМИ РОДИТЕЛИ,')).toBeInTheDocument();
  });

  it('shows the waiting list and finds a child by application number', async () => {
    await openDetailFromList();
    const ranking = document.getElementById('ranking');
    await within(ranking).findByText('РБК');
    expect(within(ranking).getByText('Общ ред · 8 деца')).toBeInTheDocument();

    fireEvent.change(within(ranking).getByPlaceholderText('Входящ номер на детето'), { target: { value: '2401 8148' } });
    expect(within(ranking).getByRole('status')).toHaveTextContent('Входящ № 24018148 е на 1. място в „Общ ред“ с 20 т.');
    expect(within(ranking).getByText('РБК').closest('li')).toHaveClass('is-me');

    fireEvent.change(within(ranking).getByPlaceholderText('Входящ номер на детето'), { target: { value: '99999999' } });
    expect(within(ranking).getByRole('status')).toHaveTextContent('не е в този списък');
  });

  it('shows a ranking date with ranked children, enrolment dates and stages', async () => {
    await openDetailFromList();
    const ranking = document.getElementById('ranking');
    fireEvent.click(within(ranking).getByRole('tab', { name: /Класиране 16/ }));
    await within(ranking).findByText('ЯБГ');
    expect(within(ranking).getByText(/Записване на новокласирани от 19.10.2026 до 30.10.2026/)).toBeInTheDocument();

    fireEvent.click(within(ranking).getByRole('tab', { name: 'Преди класирането' }));
    expect(within(ranking).getByText(/Общи критерии · 5 деца · 0 места/)).toBeInTheDocument();
  });

  it('goes back to the list with the filters kept', async () => {
    window.history.replaceState(null, '', '/?regions=03');
    render(<App />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    fireEvent.click(screen.getByRole('link', { name: 'ДГ №1 Червената шапчица (с яслени групи)' }));
    await screen.findByText('Боряна Ковачева');

    fireEvent.click(screen.getByRole('button', { name: /Всички градини/ }));
    // history.back() in jsdom is async and fires popstate.
    await waitFor(() => expect(window.location.pathname).toBe('/'));
    await act(async () => {});
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(window.location.search).toBe('?regions=03');
  });

  it('works when opened directly by URL', async () => {
    window.history.replaceState(null, '', '/kindergarten/171');
    render(<App />);
    expect(await screen.findByText('Боряна Ковачева')).toBeInTheDocument();
  });

  it('shows a friendly page for an unknown kindergarten', async () => {
    window.history.replaceState(null, '', '/kindergarten/424242');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Няма такава детска градина' })).toBeInTheDocument();
  });
});
