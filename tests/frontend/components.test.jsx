import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RegionFilter from '../../frontend/src/components/RegionFilter.jsx';
import KindergartenCard from '../../frontend/src/components/KindergartenCard.jsx';
import KindergartenGrid from '../../frontend/src/components/KindergartenGrid.jsx';
import TypeDonut from '../../frontend/src/components/charts/TypeDonut.jsx';
import { sampleData } from './data.js';

const { kindergartens, regions } = sampleData();

describe('RegionFilter', () => {
  const counts = new Map(regions.map((r) => [r.id, r.count]));

  it('shows every district with its count and toggles on click', () => {
    const onToggle = vi.fn();
    render(<RegionFilter regions={regions} counts={counts} selected={[]} onToggle={onToggle} onClear={() => {}} />);
    const chip = screen.getByRole('button', { name: /Люлин/ });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    expect(within(chip).getByText('3')).toBeInTheDocument();
    fireEvent.click(chip);
    expect(onToggle).toHaveBeenCalledWith(regions.find((r) => r.name === 'Люлин').id);
  });

  it('marks selected districts and enables "all districts"', () => {
    const onClear = vi.fn();
    const id = regions[0].id;
    render(<RegionFilter regions={regions} counts={counts} selected={[id]} onToggle={() => {}} onClear={onClear} />);
    expect(screen.getByRole('button', { name: new RegExp(regions[0].name) })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Всички райони' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('narrows the chip list with the district search box (Latin works too)', () => {
    render(<RegionFilter regions={regions} counts={counts} selected={[]} onToggle={() => {}} onClear={() => {}} />);
    fireEvent.change(screen.getByLabelText('Намери район'), { target: { value: 'mlad' } });
    expect(screen.getByRole('button', { name: /Младост/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Люлин/ })).not.toBeInTheDocument();
  });
});

describe('KindergartenCard', () => {
  const kg = kindergartens.find((k) => k.id === 171);

  it('shows the title info: name, type, district, address, phone, groups', () => {
    render(<KindergartenCard kg={kg} onRegionClick={() => {}} regionSelected={false} />);
    expect(screen.getByRole('heading', { name: kg.name })).toBeInTheDocument();
    expect(screen.getByText('Детска градина с ясла')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Брегалница/ })).toHaveAttribute('href', expect.stringContaining('google.com/maps'));
    expect(screen.getByRole('link', { name: '02/831 70 17' })).toHaveAttribute('href', 'tel:+35928317017');
    expect(screen.getByRole('list', { name: 'Групи' }).children).toHaveLength(3);
  });

  it('filters by district when the district chip is clicked', () => {
    const onRegionClick = vi.fn();
    render(<KindergartenCard kg={kg} onRegionClick={onRegionClick} regionSelected={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Възраждане' }));
    expect(onRegionClick).toHaveBeenCalledWith(kg.regionId);
  });

  it('says when no phone is published', () => {
    render(<KindergartenCard kg={kindergartens.find((k) => k.id === 74)} onRegionClick={() => {}} regionSelected={false} />);
    expect(screen.getByText('Няма публикуван телефон')).toBeInTheDocument();
  });
});

describe('KindergartenGrid', () => {
  it('shows 24 cards at a time with a "show more" button', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ...kindergartens[0], id: i + 1, name: `ДГ №${i + 1}` }));
    render(<KindergartenGrid items={many} selectedRegions={[]} onRegionClick={() => {}} />);
    expect(screen.getAllByRole('article')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: /Покажи още 6/ }));
    expect(screen.getAllByRole('article')).toHaveLength(30);
    expect(screen.queryByRole('button', { name: /Покажи още/ })).not.toBeInTheDocument();
  });
});

describe('TypeDonut', () => {
  it('renders type counts and a legend with percentages', () => {
    render(<TypeDonut items={kindergartens} scheme="light" />);
    const chart = screen.getByTestId('chart-doughnut');
    expect(within(chart).getByText('Самостоятелна детска ясла: 2')).toBeInTheDocument();
    expect(screen.getByText('6 · 67%')).toBeInTheDocument();
  });
});
