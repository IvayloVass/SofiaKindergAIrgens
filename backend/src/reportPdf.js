// Kindergarten report → printable A4 PDF.
import { createRequire } from 'node:module';
import PDFDocument from 'pdfkit';
import { STAGE_LABEL, formatDate, formatDateTime, formatPoints, groupNotes, sectionLabel } from './report.js';

// pdfkit's built-in fonts have no Cyrillic letters, so we embed DejaVu Sans.
const require = createRequire(import.meta.url);
const FONTS = {
  regular: require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf'),
  bold: require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf'),
};

const COLOR = { text: '#1f2937', muted: '#6b7280', accent: '#1d4ed8', warn: '#b45309', header: '#e6ecf5', zebra: '#f6f8fb', total: '#eef0f3', line: '#c9d1dc' };
const MARGIN = { top: 48, bottom: 56, left: 40, right: 40 };
const FONT_SIZE = 8.5;
const HEADER_FONT_SIZE = 7.5;
const PAD = 3.5;

const contentWidth = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;
const bottomY = (doc) => doc.page.height - doc.page.margins.bottom;

/** Starts a new page unless `height` points still fit on this one. */
function ensureSpace(doc, height) {
  if (doc.y + height > bottomY(doc)) doc.addPage();
}

/**
 * Draws a table that may run over several pages; the header row is repeated on each page.
 * `columns`: [{ header, weight, align }]. `rows`: arrays of cells, or { cells, bold } for a totals row.
 */
function drawTable(doc, columns, rows) {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const totalWeight = columns.reduce((acc, c) => acc + c.weight, 0);
  const widths = columns.map((c) => (c.weight / totalWeight) * width);

  const heightOf = (cells, font, size = FONT_SIZE) => {
    doc.font(font).fontSize(size);
    return Math.max(...cells.map((t, i) => doc.heightOfString(String(t ?? ''), { width: widths[i] - 2 * PAD }))) + 2 * PAD;
  };

  const paint = (cells, { font, fill, size = FONT_SIZE }) => {
    const h = heightOf(cells, font, size);
    const y = doc.y;
    if (fill) doc.rect(left, y, width, h).fill(fill);
    let x = left;
    cells.forEach((t, i) => {
      doc.fillColor(COLOR.text).font(font).fontSize(size)
        .text(String(t ?? ''), x + PAD, y + PAD, { width: widths[i] - 2 * PAD, align: columns[i].align ?? 'left' });
      x += widths[i];
    });
    doc.moveTo(left, y + h).lineTo(left + width, y + h).lineWidth(0.4).strokeColor(COLOR.line).stroke();
    doc.x = left;
    doc.y = y + h;
  };

  const header = columns.map((c) => c.header);
  const headerHeight = heightOf(header, 'bold', HEADER_FONT_SIZE);
  const paintHeader = () => paint(header, { font: 'bold', fill: COLOR.header, size: HEADER_FONT_SIZE });

  const normalized = rows.map((r) => (Array.isArray(r) ? { cells: r } : r));
  const firstHeight = normalized.length ? heightOf(normalized[0].cells, 'regular') : 0;
  ensureSpace(doc, headerHeight + firstHeight);
  paintHeader();

  normalized.forEach((row, i) => {
    const font = row.bold ? 'bold' : 'regular';
    if (doc.y + heightOf(row.cells, font) > bottomY(doc)) {
      doc.addPage();
      paintHeader();
    }
    paint(row.cells, { font, fill: row.bold ? COLOR.total : i % 2 ? COLOR.zebra : null });
  });
  doc.moveDown(0.8);
}

function heading(doc, text, { size = 13, space = 60 } = {}) {
  ensureSpace(doc, space);
  doc.fillColor(COLOR.text).font('bold').fontSize(size).text(text);
  doc.moveDown(0.3);
}

function line(doc, text, { color = COLOR.muted, size = 9, font = 'regular' } = {}) {
  doc.fillColor(color).font(font).fontSize(size).text(text);
}

function titleBlock(doc, report) {
  const k = report.kindergarten;
  line(doc, 'КЛАСИРАНЕ И СТАТИСТИКА', { color: COLOR.accent, size: 9, font: 'bold' });
  doc.moveDown(0.2);
  doc.fillColor(COLOR.text).font('bold').fontSize(17).text(k.name);
  doc.moveDown(0.3);
  const facts = [
    k.address && `Адрес: ${k.address}`,
    k.regionName && `Район: ${k.regionName}`,
    k.director && `Директор: ${k.director}`,
    k.phones.length && `Телефони: ${k.phones.join(', ')}`,
    report.schoolYear && `Учебна година: ${report.schoolYear}`,
  ].filter(Boolean);
  facts.forEach((f) => line(doc, f, { color: COLOR.text, size: 10 }));
  doc.moveDown(0.4);
  line(doc, `Данни от kg.sofia.bg към ${formatDateTime(report.dataAt)} · отчетът е създаден на ${formatDateTime(report.generatedAt)}`);
  if (report.stale) line(doc, 'kg.sofia.bg не отговаря в момента — показани са последните запазени данни.', { color: COLOR.warn });
  doc.moveDown(1);
}

function summaryTable(doc, report) {
  heading(doc, 'Обобщение по групи');
  if (report.groups.length === 0) {
    line(doc, 'Няма публикувани групи за тази градина.');
    return;
  }
  const n = (v) => (v == null ? '—' : v);
  // Next-year groups are marked in the name; a separate year column doesn't fit on A4.
  const rows = report.groups.map((g) => [
    g.schoolYear && g.schoolYear !== report.schoolYear ? `${g.label} (учебна ${g.schoolYear})` : g.label,
    g.totals.capacity,
    g.totals.enrolled,
    g.totals.notEnrolled,
    g.totals.free,
    n(g.waiting?.stats?.waiting),
    g.ranking ? formatDate(g.ranking.date) : '—',
    formatPoints(g.ranking?.stats?.cutoff ?? null),
  ]);
  const s = report.summary;
  rows.push({
    bold: true,
    cells: [report.schoolYear ? `Общо за учебна ${report.schoolYear}` : 'Общо', s.capacity, s.enrolled, s.notEnrolled, s.free, s.waiting, '', ''],
  });
  const right = 'right';
  drawTable(doc, [
    { header: 'Група', weight: 25 },
    { header: 'Места', weight: 8.5, align: right },
    { header: 'Записани', weight: 11, align: right },
    { header: 'Класирани незаписани', weight: 12, align: right },
    { header: 'Свободни', weight: 11, align: right },
    { header: 'Чакащи', weight: 10, align: right },
    { header: 'Последно класиране', weight: 12.5 },
    { header: 'Мин. бал (общ ред)', weight: 10, align: right },
  ], rows);
}

const ENTRY_COLUMNS = (lastHeader) => [
  { header: 'Място', weight: 8, align: 'right' },
  { header: 'Инициали', weight: 12 },
  { header: 'Входящ №', weight: 16 },
  { header: 'Точки', weight: 10, align: 'right' },
  { header: lastHeader, weight: 30 },
];

const children = (n) => `${n} ${n === 1 ? 'дете' : 'деца'}`;

function waitingBlock(doc, group) {
  const w = group.waiting;
  if (!w) return;
  heading(doc, 'Чакащи', { size: 11, space: 50 });
  if (w.unavailable) {
    line(doc, 'Списъкът с чакащи не може да бъде зареден.', { color: COLOR.warn });
    doc.moveDown(0.6);
    return;
  }
  const s = w.stats;
  const range = s.waiting ? ` · точки от ${formatPoints(s.minPoints)} до ${formatPoints(s.maxPoints)}` : '';
  line(doc, `${children(s.waiting)} чакат · ${s.free} свободни места${range}`);
  doc.moveDown(0.4);
  for (const l of w.lists.filter((x) => x.entries.length > 0)) {
    line(doc, `${l.label} · ${children(l.entries.length)} · ${l.free} свободни`, { color: COLOR.text, font: 'bold' });
    doc.moveDown(0.2);
    drawTable(doc, ENTRY_COLUMNS('Желание №'), l.entries.map((e) => [e.rank, e.initials, e.applicationNumber, formatPoints(e.points), e.wishOrder ?? '']));
  }
}

function rankingBlock(doc, group) {
  const r = group.ranking;
  if (!r) return;
  heading(doc, `Класиране от ${formatDate(r.date)}`, { size: 11, space: 50 });
  if (r.unavailable) {
    line(doc, 'Класирането не може да бъде заредено.', { color: COLOR.warn });
    doc.moveDown(0.6);
    return;
  }
  const facts = [`Класирани: ${r.stats.rated}`, `Некласирани: ${r.stats.notRated}`, `Минимален бал (общ ред): ${formatPoints(r.stats.cutoff)}`];
  if (r.cohort) facts.push(`Набор ${r.cohort}`);
  line(doc, facts.join(' · '));
  if (r.note) line(doc, r.note, { color: COLOR.text });
  doc.moveDown(0.4);
  for (const stage of ['rated', 'notRated']) {
    for (const s of r.stages[stage]) {
      const places = s.places != null ? ` · ${s.places} места` : '';
      line(doc, `${STAGE_LABEL[stage]} — ${sectionLabel(s.title)} · ${children(s.entries.length)}${places}`, { color: COLOR.text, font: 'bold' });
      doc.moveDown(0.2);
      drawTable(doc, ENTRY_COLUMNS('Бележка'), s.entries.map((e) => [e.rank, e.initials, e.applicationNumber, formatPoints(e.points), e.note]));
    }
  }
}

function groupSection(doc, group) {
  heading(doc, group.label, { size: 13, space: 120 });
  const sub = [group.kindLabel, group.schoolYear && `учебна ${group.schoolYear}`, group.groupCount > 1 && `${group.groupCount} паралелки`].filter(Boolean);
  line(doc, sub.join(' · '));
  if (group.comment) line(doc, group.comment);
  doc.moveDown(0.5);

  if (group.quotas.length > 0) {
    drawTable(doc, [
      { header: 'Квота', weight: 30 },
      { header: 'Места', weight: 10, align: 'right' },
      { header: 'Записани', weight: 12, align: 'right' },
      { header: 'Класирани незаписани', weight: 14, align: 'right' },
      { header: 'Свободни', weight: 12, align: 'right' },
    ], [
      ...group.quotas.map((q) => [q.label, q.capacity, q.enrolled, q.notEnrolled, q.free]),
      { bold: true, cells: ['Общо', group.totals.capacity, group.totals.enrolled, group.totals.notEnrolled, group.totals.free] },
    ]);
  }

  waitingBlock(doc, group);
  rankingBlock(doc, group);
  if (!group.ranking) line(doc, groupNotes(group).at(-1));
  doc.moveDown(1);
}

function footers(doc, report) {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    // Writing below the bottom margin would add a page, so lift the margin while drawing the footer.
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 34;
    const left = doc.page.margins.left;
    doc.fillColor(COLOR.muted).font('regular').fontSize(7.5);
    doc.text(`${report.kindergarten.shortName} · данни от kg.sofia.bg`, left, y, { width: contentWidth(doc) * 0.75, lineBreak: false });
    doc.text(`стр. ${i - start + 1} от ${count}`, left, y, { width: contentWidth(doc), align: 'right', lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
}

/** Report → .pdf file contents. */
export function toPdf(report) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: MARGIN,
    bufferPages: true,
    info: {
      Title: `${report.kindergarten.name} — класиране и статистика`,
      Author: 'Детски градини София',
      Subject: 'Места, чакащи и класиране по групи',
      CreationDate: new Date(report.generatedAt),
    },
  });
  doc.registerFont('regular', FONTS.regular);
  doc.registerFont('bold', FONTS.bold);

  const chunks = [];
  const done = new Promise((resolve, reject) => {
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  titleBlock(doc, report);
  summaryTable(doc, report);
  for (const group of report.groups) {
    doc.addPage();
    groupSection(doc, group);
  }
  footers(doc, report);
  doc.end();
  return done;
}
