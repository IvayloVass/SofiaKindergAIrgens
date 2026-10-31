import { describe, expect, it } from 'vitest';
import { findApplication, placesSummary } from '../../frontend/src/utils/ranking.js';
import { matchRoute } from '../../frontend/src/router.jsx';
import { sampleDetail, sampleWaiting } from './data.js';

describe('ranking utils', () => {
  it('sums places over all groups', () => {
    expect(placesSummary(sampleDetail().groups)).toMatchObject({ capacity: 160, enrolled: 140, free: 18, withFree: 3, groups: 6 });
  });

  it('finds a child by application number across the waiting lists', () => {
    const lists = sampleWaiting().lists;
    expect(findApplication(lists, ' 24018148 ')).toEqual([
      { listLabel: 'Общ ред', entry: expect.objectContaining({ rank: 1, initials: 'РБК' }) },
    ]);
    expect(findApplication(lists, '12')).toEqual([]); // too short to search
  });
});

describe('router', () => {
  it('matches the detail and list routes', () => {
    expect(matchRoute('/kindergarten/171')).toEqual({ name: 'detail', id: 171 });
    expect(matchRoute('/')).toEqual({ name: 'list' });
    expect(matchRoute('/kindergarten/abc')).toEqual({ name: 'list' });
  });
});
