import { describe, expect, it } from 'vitest';
import { normalize } from '../../backend/src/normalize.js';
import { loadSourceFixture } from '../helpers.js';

describe('normalize', () => {
  const { kindergartens } = normalize(loadSourceFixture());

  it('keeps every kindergarten once, with its district', () => {
    expect(kindergartens).toHaveLength(9);
    expect(new Set(kindergartens.map((k) => k.id)).size).toBe(9);
    expect(kindergartens.every((k) => k.regionId)).toBe(true);
  });

  it('builds a clean record from the source shape', () => {
    const kg = kindergartens.find((k) => k.id === 171);
    expect(kg).toMatchObject({
      name: 'ДГ №1 Червената шапчица (с яслени групи)',
      type: 'ДГ (с яслени групи)',
      regionName: 'Възраждане',
      address: 'гр. София, ул. "Брегалница", №48',
      phones: ['02/831 70 17'],
    });
  });
});
