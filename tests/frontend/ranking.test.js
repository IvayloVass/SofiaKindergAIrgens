import { describe, expect, it } from 'vitest';
import {
  cleanApplicationNumber,
  cutoffPoints,
  findApplication,
  formatPoints,
  formatShortDate,
  placesSummary,
  pointsHistogram,
  waitingSummary,
} from '../../frontend/src/utils/ranking.js';
import { matchRoute } from '../../frontend/src/router.jsx';
import { sampleDetail, sampleWaiting } from './data.js';

describe('ranking utils', () => {
  it('sums places over all groups', () => {
    expect(placesSummary(sampleDetail().groups)).toMatchObject({ capacity: 160, enrolled: 140, free: 18, withFree: 3, groups: 6 });
  });

  it('summarizes a waiting list', () => {
    expect(waitingSummary(sampleWaiting().lists)).toMatchObject({ waiting: 8, free: 0, maxPoints: 20 });
  });

  it('builds a points histogram from highest to lowest', () => {
    expect(pointsHistogram([{ points: 18 }, { points: 20 }, { points: 18 }])).toEqual([
      { points: 20, count: 1 },
      { points: 18, count: 2 },
    ]);
  });

  it('finds an application number across lists', () => {
    const lists = sampleWaiting().lists;
    expect(findApplication(lists, ' 24018148 ')).toEqual([
      { listLabel: 'Общ ред', entry: expect.objectContaining({ rank: 1, initials: 'РБК' }) },
    ]);
    expect(findApplication(lists, '12')).toEqual([]); // too short to search
    expect(cleanApplicationNumber('№ 2401-8148')).toBe('24018148');
  });

  it('computes the cut-off as the lowest ranked points', () => {
    expect(cutoffPoints([{ entries: [{ points: 18 }, { points: 12.5 }] }])).toBe(12.5);
    expect(cutoffPoints([])).toBeNull();
  });

  it('formats points and dates', () => {
    expect(formatPoints(18)).toBe('18');
    expect(formatPoints(12.5)).toBe('12.5');
    expect(formatPoints(null)).toBe('—');
    // Stored in UTC, shown in Sofia time (the ranking of 16 Oct).
    expect(formatShortDate('2026-10-15T21:00:00.000+00:00')).toMatch(/16/);
  });
});

describe('router', () => {
  it('matches the detail and list routes', () => {
    expect(matchRoute('/kindergarten/171')).toEqual({ name: 'detail', id: 171 });
    expect(matchRoute('/kindergarten/171/')).toEqual({ name: 'detail', id: 171 });
    expect(matchRoute('/')).toEqual({ name: 'list' });
    expect(matchRoute('/kindergarten/abc')).toEqual({ name: 'list' });
  });
});
