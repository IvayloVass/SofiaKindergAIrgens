import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RegionFilter from '../../frontend/src/components/RegionFilter.jsx';
import KindergartenCard from '../../frontend/src/components/KindergartenCard.jsx';
import PlacesDonut from '../../frontend/src/components/charts/PlacesDonut.jsx';
import { sampleData } from './data.js';

const { kindergartens, regions } = sampleData();

describe('RegionFilter', () => {
  it('shows every district with its count and toggles on click', () => {
    const counts = new Map(regions.map((r) => [r.id, r.count]));
    const onToggle = vi.fn();
    render(<RegionFilter regions={regions} counts={counts} selected={[]} onToggle={onToggle} onClear={() => {}} />);
    const chip = screen.getByRole('button', { name: /Люлин/ });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(within(chip).getByText('3')).toBeInTheDocument();
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith(regions.find((r) => r.name === 'Люлин').id);
  });
});

describe('KindergartenCard', () => {
  it('shows the name, type, address, phone and groups', () => {
    const kg = kindergartens.find((k) => k.id === 171);
    render(<KindergartenCard kg={kg} onRegionClick={() => {}} regionSelected={false} />);
    expect(screen.getByRole('heading', { name: kg.name })).toBeInTheDocument();
    expect(screen.getByText('Детска градина с ясла')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Брегалница/ })).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(screen.getByRole('link', { name: '02/831 70 17' })).toHaveAttribute('href', 'tel:+35928317017');
    expect(screen.getByRole('list', { name: 'Групи' }).children).toHaveLength(3);
  });
});

describe('PlacesDonut', () => {
  it('shows taken vs free places for the whole list', () => {
    const withPlaces = [
      { id: 1, places: { capacity: 160, enrolled: 140, free: 18 } },
      { id: 2, places: { capacity: 40, enrolled: 38, free: 2 } },
      { id: 3, places: null },
    ];
    render(<PlacesDonut items={withPlaces} scheme="light" scopeLabel="в цяла София" />);
    const chart = screen.getByTestId('chart-doughnut');
    expect(within(chart).getByText('Заети: 180')).toBeInTheDocument();
    expect(within(chart).getByText('Свободни: 20')).toBeInTheDocument();
    expect(screen.getByText(/Няма данни за 1 от 3 заведения/)).toBeInTheDocument();
  });
});
