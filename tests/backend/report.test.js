import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import { openDatabase } from '@kg/database';
import { createServer } from '../../backend/src/server.js';
import { syncNow } from '../../backend/src/sync.js';
import { buildReport } from '../../backend/src/report.js';
import { fakeDetailSource, fakeSourceFetch } from '../helpers.js';

// The fake source only knows group 9006's lists; the other groups' lists fail on purpose.
vi.spyOn(console, 'warn').mockImplementation(() => {});

async function setup() {
  const db = openDatabase(':memory:');
  await syncNow(db, { fetchImpl: fakeSourceFetch() });
  return db;
}

describe('buildReport()', () => {
  it('covers every group with places, waiting list and the latest ranking', async () => {
    const report = await buildReport(await setup(), 171, { fetchImpl: fakeDetailSource() });

    expect(report.kindergarten).toMatchObject({ id: 171, director: 'Боряна Ковачева' });
    expect(report.groups).toHaveLength(5);
    expect(report.summary.free).toBe(18); // 0 + 2 + 3 + 0 + 13

    const nursery = report.groups.find((g) => g.id === 9006);
    expect(nursery.waiting.stats.waiting).toBeGreaterThan(0);
    expect(nursery.ranking).toMatchObject({ id: 446, date: '2026-10-15T21:00:00.000+00:00' });
    expect(nursery.ranking.stats.rated).toBeGreaterThan(0);

    // A list the source can't deliver doesn't break the report.
    const other = report.groups.find((g) => g.id === 7471);
    expect(other.waiting).toEqual({ unavailable: true });
    expect(other.ranking).toMatchObject({ unavailable: true });
  });
});

describe('report download API', () => {
  let server;
  let base;

  beforeAll(async () => {
    server = createServer(await setup(), { fetchImpl: fakeDetailSource() });
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://localhost:${server.address().port}`;
  });

  afterAll(() => server?.close());

  it('GET report.xlsx returns a workbook with all groups', async () => {
    const res = await fetch(`${base}/api/kindergartens/171/report.xlsx`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers.get('content-disposition')).toMatch(/^attachment; filename="kindergarten-171-\d{4}-\d{2}-\d{2}\.xlsx"/);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await res.arrayBuffer());
    expect(wb.worksheets.map((ws) => ws.name)).toEqual(['Обобщение', 'Места по квоти', 'Чакащи', 'Класиране']);

    const summary = [];
    wb.getWorksheet('Обобщение').eachRow((row) => summary.push(row.getCell(1).value));
    expect(summary).toContain('2-ра ясла, родени 2024 г.');
    expect(wb.getWorksheet('Чакащи').getCell('F2').value).toBe('24018148'); // application number kept as text
  });

  it('GET report.pdf returns a PDF', async () => {
    const res = await fetch(`${base}/api/kindergartens/171/report.pdf`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('returns 404 for an unknown kindergarten', async () => {
    expect((await fetch(`${base}/api/kindergartens/999/report.pdf`)).status).toBe(404);
  });
});
