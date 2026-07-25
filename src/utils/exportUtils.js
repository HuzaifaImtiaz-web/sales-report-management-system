export const exportToCSV = (filename, data, columns) => {
  if (!data || !data.length) return;

  const headers = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`).join(',');

  const rows = data.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (col.formatter && typeof col.formatter === 'function') {
        val = col.formatter(val, row);
      }
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
