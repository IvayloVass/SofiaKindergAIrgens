import { describe, expect, it } from 'vitest';
import detailFixture from '../fixtures/detail-171.json';
import ratedHtml from '../fixtures/rating-rated-446-6059.html?raw';
import { normalizeDetail, parseRatingHtml } from '../../backend/src/details.js';
import { sanitizeHtml } from '../../backend/src/sanitize.js';

describe('normalizeDetail', () => {
  it('extracts the main facts and business contacts only', () => {
    const d = normalizeDetail(detailFixture);
    expect(d).toMatchObject({
      id: 171,
      name: 'ДГ №1 Червената шапчица (с яслени групи)',
      director: 'Боряна Ковачева',
      regionName: 'Възраждане',
      contacts: { phones: ['02/831 70 17'], emails: ['odz_1@abv.bg'], websites: ['http://detskagradina-1.com/'] },
    });
    // The personal mobile number is not exposed.
    expect(JSON.stringify(d.contacts)).not.toContain('884');
  });
});

describe('sanitizeHtml', () => {
  // The parents info is rendered as HTML, so unsafe markup must never get through.
  it('removes scripts, event handlers and unsafe links', () => {
    const out = sanitizeHtml(
      '<p onclick="x()">a</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">b</a><iframe src="x"></iframe>',
    );
    expect(out).toBe('<p>a</p><a>b</a>');
    expect(out).not.toMatch(/script|onerror|onclick|javascript|iframe|img/i);
  });
});

describe('parseRatingHtml', () => {
  it('parses a ranking page into sections and entries', () => {
    const r = parseRatingHtml(ratedHtml);
    expect(r.heading).toBe('КЛАСИРАНЕ НА 16.10.2026');
    expect(r.sections.map((s) => s.category)).toEqual(['sop', 'chronic', 'general']);
    expect(r.sections[2].entries).toEqual([
      { rank: 1, initials: 'ЯБГ', applicationNumber: '21005584', points: 18, note: '' },
    ]);
  });
});
