// Kindergarten report → Excel workbook (one long table per sheet, easy to filter).
import ExcelJS from 'exceljs';
import { STAGE_LABEL, formatDate, formatDateTime, groupNotes, sectionLabel } from './report.js';

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6ECF5' } };
const TOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
const THIN = { style: 'thin', color: { argb: 'FFC9D1DC' } };

/**
 * Writes a table at `startRow`: a bold header and one row per item.
 * `columns` are [{ header, width, value: (item) => cell value }].
 * Returns the number of the last row written.
 */
function writeTable(ws, startRow, columns, items, { filter = true } = {}) {
  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = Math.max(col.width ?? 0, c.width ?? 12);
  });

  const header = ws.getRow(startRow);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = { bottom: THIN };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });

  items.forEach((item, j) => {
    const row = ws.getRow(startRow + 1 + j);
    columns.forEach((c, i) => {
      const value = c.value(item);
      row.getCell(i + 1).value = value === undefined ? null : value;
    });
  });

  const lastRow = startRow + items.length;
  ws.views = [{ state: 'frozen', ySplit: startRow }];
  if (filter && items.length > 0) {
    ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: lastRow, column: columns.length } };
  }
  return lastRow;
}

/** One-line message in an otherwise empty table. */
function emptyNote(ws, row, text) {
  ws.getRow(row).getCell(1).value = text;
  ws.getRow(row).getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
}

const num = (n) => (n == null ? null : n);

function summarySheet(wb, report) {
  const ws = wb.addWorksheet('Обобщение');
  const k = report.kindergarten;

  ws.getCell('A1').value = k.name;
  ws.getCell('A1').font = { bold: true, size: 14 };
  const info = [
    ['Адрес', k.address],
    ['Район', k.regionName],
    ['Директор', k.director],
    ['Телефони', k.phones.join(', ')],
    ['Учебна година', report.schoolYear],
    ['Данни от kg.sofia.bg към', formatDateTime(report.dataAt)],
    ['Отчетът е създаден на', formatDateTime(report.generatedAt)],
    ['Източник', report.sourceUrl],
  ].filter(([, v]) => v);
  info.forEach(([label, value], i) => {
    const row = ws.getRow(3 + i);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = value;
  });
  let next = 3 + info.length;
  if (report.stale) {
    ws.getRow(next).getCell(1).value = 'kg.sofia.bg не отговаря — показани са последните запазени данни.';
    ws.getRow(next).getCell(1).font = { italic: true, color: { argb: 'FFB45309' } };
    next += 1;
  }

  const columns = [
    { header: 'Група', width: 34, value: (g) => g.label },
    { header: 'Вид', width: 14, value: (g) => g.kindLabel },
    { header: 'Набор', width: 8, value: (g) => num(g.birthYear) },
    { header: 'Учебна година', width: 12, value: (g) => g.schoolYear },
    { header: 'Паралелки', width: 10, value: (g) => g.groupCount },
    { header: 'Места', width: 9, value: (g) => g.totals.capacity },
    { header: 'Записани', width: 10, value: (g) => g.totals.enrolled },
    { header: 'Класирани незаписани', width: 12, value: (g) => g.totals.notEnrolled },
    { header: 'Свободни', width: 10, value: (g) => g.totals.free },
    { header: 'Чакащи', width: 9, value: (g) => num(g.waiting?.stats?.waiting) },
    { header: 'Най-много точки (чакащи)', width: 12, value: (g) => num(g.waiting?.stats?.maxPoints) },
    { header: 'Най-малко точки (чакащи)', width: 12, value: (g) => num(g.waiting?.stats?.minPoints) },
    { header: 'Последно класиране', width: 13, value: (g) => (g.ranking ? formatDate(g.ranking.date) : null) },
    { header: 'Класирани', width: 10, value: (g) => num(g.ranking?.stats?.rated) },
    { header: 'Некласирани', width: 11, value: (g) => num(g.ranking?.stats?.notRated) },
    { header: 'Минимален бал (общ ред)', width: 12, value: (g) => num(g.ranking?.stats?.cutoff) },
    { header: 'Бележка', width: 40, value: (g) => groupNotes(g).join('; ') || null },
  ];
  const tableStart = next + 1;
  const last = writeTable(ws, tableStart, columns, report.groups, { filter: false });
  ws.getRow(tableStart).height = 32;

  if (report.groups.length === 0) {
    emptyNote(ws, tableStart + 1, 'Няма публикувани групи за тази градина.');
    return;
  }

  const s = report.summary;
  const total = ws.getRow(last + 1);
  const label = report.schoolYear ? `Общо за учебна ${report.schoolYear} г.` : 'Общо';
  const totals = { 1: label, 5: s.groups, 6: s.capacity, 7: s.enrolled, 8: s.notEnrolled, 9: s.free, 10: s.waiting };
  for (const [col, value] of Object.entries(totals)) total.getCell(Number(col)).value = value;
  for (let c = 1; c <= columns.length; c++) {
    total.getCell(c).font = { bold: true };
    total.getCell(c).fill = TOTAL_FILL;
    total.getCell(c).border = { top: THIN };
  }
}

function quotasSheet(wb, report) {
  const ws = wb.addWorksheet('Места по квоти');
  const rows = report.groups.flatMap((g) => g.quotas.map((q) => ({ g, q })));
  writeTable(ws, 1, [
    { header: 'Група', width: 34, value: ({ g }) => g.label },
    { header: 'Учебна година', width: 12, value: ({ g }) => g.schoolYear },
    { header: 'Квота', width: 22, value: ({ q }) => q.label },
    { header: 'Места', width: 9, value: ({ q }) => q.capacity },
    { header: 'Записани', width: 10, value: ({ q }) => q.enrolled },
    { header: 'Класирани незаписани', width: 12, value: ({ q }) => q.notEnrolled },
    { header: 'Свободни', width: 10, value: ({ q }) => q.free },
  ], rows);
  if (rows.length === 0) emptyNote(ws, 2, 'Няма данни за места.');
}

function waitingSheet(wb, report) {
  const ws = wb.addWorksheet('Чакащи');
  const rows = report.groups.flatMap((g) =>
    (g.waiting?.lists ?? []).flatMap((l) => l.entries.map((e) => ({ g, l, e }))),
  );
  writeTable(ws, 1, [
    { header: 'Група', width: 34, value: ({ g }) => g.label },
    { header: 'Учебна година', width: 12, value: ({ g }) => g.schoolYear },
    { header: 'Квота', width: 22, value: ({ l }) => l.label },
    { header: 'Място', width: 8, value: ({ e }) => e.rank },
    { header: 'Инициали', width: 10, value: ({ e }) => e.initials },
    { header: 'Входящ №', width: 12, value: ({ e }) => e.applicationNumber }, // kept as text
    { header: 'Точки', width: 8, value: ({ e }) => e.points },
    { header: 'Желание №', width: 10, value: ({ e }) => num(e.wishOrder) },
  ], rows);
  if (rows.length === 0) emptyNote(ws, 2, 'Няма чакащи деца.');
}

function rankingSheet(wb, report) {
  const ws = wb.addWorksheet('Класиране');
  const rows = report.groups.flatMap((g) =>
    ['rated', 'notRated'].flatMap((stage) =>
      (g.ranking?.stages?.[stage] ?? []).flatMap((s) => s.entries.map((e) => ({ g, stage, s, e }))),
    ),
  );
  writeTable(ws, 1, [
    { header: 'Група', width: 34, value: ({ g }) => g.label },
    { header: 'Дата на класиране', width: 13, value: ({ g }) => formatDate(g.ranking.date) },
    { header: 'Етап', width: 13, value: ({ stage }) => STAGE_LABEL[stage] },
    { header: 'Раздел', width: 22, value: ({ s }) => sectionLabel(s.title) },
    { header: 'Място', width: 8, value: ({ e }) => e.rank },
    { header: 'Инициали', width: 10, value: ({ e }) => e.initials },
    { header: 'Входящ №', width: 12, value: ({ e }) => e.applicationNumber }, // kept as text
    { header: 'Точки', width: 8, value: ({ e }) => e.points },
    { header: 'Бележка', width: 30, value: ({ e }) => e.note || null },
  ], rows);
  if (rows.length === 0) emptyNote(ws, 2, 'Няма публикувано класиране.');
}

/** Report → .xlsx file contents. */
export async function toXlsx(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Детски градини София';
  wb.title = `${report.kindergarten.name} — класиране и статистика`;
  wb.created = new Date(report.generatedAt);

  summarySheet(wb, report);
  quotasSheet(wb, report);
  waitingSheet(wb, report);
  rankingSheet(wb, report);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
