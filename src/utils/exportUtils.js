/**
 * One CSV cell, quoted. Text that starts with = + - @ (or a tab/CR) is prefixed with an apostrophe
 * so spreadsheet programs show it as text instead of running it as a formula ("CSV injection":
 * a username typed into a failed sign-in ends up in the audit log export, for example).
 */
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(fileName, lines) {
  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

export const exportToCSV = (filename, data, columns) => {
  if (!data || !data.length) return;

  const headers = columns.map((c) => csvCell(c.label || c.key)).join(',');
  const rows = data.map((row) => columns.map((col) => {
    let val = row[col.key];
    if (col.formatter && typeof col.formatter === 'function') {
      val = col.formatter(val, row);
    }
    return csvCell(val);
  }).join(','));

  downloadCsv(`${filename}_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
};
