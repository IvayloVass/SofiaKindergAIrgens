import { describe, expect, it } from 'vitest';
import detailFixture from '../fixtures/detail-171.json';
import waitingFixture from '../fixtures/waiting-9006.json';
import entryHtml from '../fixtures/rating-entry-446-9006.html?raw';
import ratedHtml from '../fixtures/rating-rated-446-6059.html?raw';
import { groupKind, normalizeDetail, normalizeWaiting, parseRatingHtml } from '../../backend/src/details.js';
import { sanitizeHtml } from '../../backend/src/sanitize.js';

describe('sanitizeHtml', () => {
  it('keeps simple formatting and drops everything else', () => {
    expect(sanitizeHtml('<p style="color:red"><strong>Здравейте</strong> <span>родители</span></p>')).toBe(
      '<p><strong>Здравейте</strong> родители</p>',
    );
  });

  it('removes scripts, event handlers and unsafe links', () => {
    const out = sanitizeHtml(
      '<p onclick="x()">a</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">b</a><iframe src="x"></iframe>',
    );
    expect(out).toBe('<p>a</p><a>b</a>');
    expect(out).not.toMatch(/script|onerror|onclick|javascript|iframe|img/i);
  });

  it('keeps safe links but forces them to open safely', () => {
    expect(sanitizeHtml('<a href="https://dg1.bg" class="x">сайт</a>')).toBe(
      '<a href="https://dg1.bg" target="_blank" rel="noopener noreferrer">сайт</a>',
    );
  });

  it('escapes stray angle brackets and removes empty paragraphs', () => {
    expect(sanitizeHtml('<p>деца < 3 г.</p><p>&nbsp;</p><p><strong> </strong></p>')).toBe('<p>деца &lt; 3 г.</p>');
  });
});

describe('normalizeDetail', () => {
  const d = normalizeDetail(detailFixture);

  it('returns null for unknown kindergartens', () => {
    expect(normalizeDetail({ schoolYear: '2026/2027' })).toBeNull();
  });

  it('extracts the main facts and business contacts only', () => {
    expect(d).toMatchObject({
      id: 171,
      name: 'ДГ №1 Червената шапчица (с яслени групи)',
      director: 'Боряна Ковачева',
      regionName: 'Възраждане',
      schoolYear: '2026/2027',
      contacts: { phones: ['02/831 70 17'], emails: ['odz_1@abv.bg'], websites: ['http://detskagradina-1.com/'] },
    });
    // The personal mobile number is not exposed.
    expect(JSON.stringify(d.contacts)).not.toContain('884');
    expect(d.mapUrl).toMatch(/^https:\/\/www\.google\.com\/maps/);
  });

  it('normalizes groups with places per quota and ranking dates', () => {
    expect(d.groups).toHaveLength(5);
    const nursery = d.groups[0];
    expect(nursery).toMatchObject({ id: 9006, birthYear: 2024, kind: 'nursery', waitingListVisible: true });
    expect(nursery.quotas.map((q) => q.type)).toEqual(['general', 'chronic', 'sop']); // work group (-1) dropped
    expect(nursery.totals).toEqual({ capacity: 22, enrolled: 22, free: 0, notEnrolled: 0 });
    expect(nursery.ratings.map((r) => r.id)).toEqual([444, 445, 446]);
    expect(d.groups.at(-1).kind).toBe('preparatory');
  });

  it('keeps the parents info as safe HTML', () => {
    expect(d.infoForParents).toContain('<strong>УВАЖАЕМИ РОДИТЕЛИ,</strong>');
    expect(d.infoForParents).not.toMatch(/style=|<span|&nbsp;/);
  });

  it('detects group kinds from labels', () => {
    expect(groupKind('1-ва ясла, родени 2025 г.')).toBe('nursery');
    expect(groupKind('Подготвителна група, родени 2020 г.')).toBe('preparatory');
    expect(groupKind('2-ра група, родени 2022 г.')).toBe('kindergarten');
  });
});

describe('normalizeWaiting', () => {
  const w = normalizeWaiting(waitingFixture);

  it('builds ranked lists per quota, highest points first', () => {
    expect(w).toMatchObject({ groupId: 9006, kindergartenId: 171 });
    const general = w.lists.find((l) => l.category === 'general');
    expect(general.entries[0]).toEqual({ rank: 1, initials: 'РБК', applicationNumber: '24018148', points: 20, wishOrder: 1 });
    const pts = general.entries.map((e) => e.points);
    expect(pts).toEqual([...pts].sort((a, b) => b - a));
    expect(w.lists.find((l) => l.category === 'sop').entries).toEqual([]);
  });

  it('returns null for an empty response', () => {
    expect(normalizeWaiting({})).toBeNull();
  });
});

describe('parseRatingHtml', () => {
  it('parses a ranking page into sections and entries', () => {
    const r = parseRatingHtml(ratedHtml);
    expect(r.heading).toBe('КЛАСИРАНЕ НА 16.10.2026');
    expect(r.cohort).toBe('Набор 2021');
    expect(r.note).toBe('Записване на новокласирани от 19.10.2026 до 30.10.2026 г.');
    expect(r.sections.map((s) => s.category)).toEqual(['sop', 'chronic', 'general']);
    expect(r.sections[2].entries).toEqual([
      { rank: 1, initials: 'ЯБГ', applicationNumber: '21005584', points: 18, note: '' },
    ]);
  });

  it('reads the number of places from the section title', () => {
    const r = parseRatingHtml(entryHtml);
    expect(r.sections.map((s) => s.places)).toEqual([0, 0, 0]);
    expect(r.sections[2].entries).toHaveLength(5);
  });

  it('handles empty input', () => {
    expect(parseRatingHtml('')).toEqual({ heading: null, cohort: null, note: null, sections: [] });
  });
});
