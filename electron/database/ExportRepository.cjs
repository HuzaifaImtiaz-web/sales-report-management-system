const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pptxgen = require('pptxgenjs');
const { getStorageDirectory } = require('../paths.cjs');
const logger = require('../logger.cjs');
const PptReportService = require('../services/PptReportService.cjs');

class ExportRepository {
  /**
   * @param {object} dataSource  { fetchData(reportType, filters), fetchMasterData(filters), logExport(entry) }
   *                             backed by the cloud API (see electron/ipc.cjs)
   */
  constructor(dataSource = {}) {
    this.dataSource = dataSource;
  }

  getExportDirectory() {
    const dir = path.join(getStorageDirectory(), 'Exports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Report rows come from the cloud server (server/src/services/ExportDataService.js):
   * { title, columns, rows, summary } for one report type.
   */
  async fetchData(reportType, filters = {}) {
    return this.dataSource.fetchData(reportType, filters);
  }

  /**
   * Fetch all 12 modules into a single Master Export data object (built on the cloud server)
   */
  async fetchMasterData(filters = {}) {
    return this.dataSource.fetchMasterData(filters);
  }

  /**
   * Main export handler supporting Excel (.xlsx), PDF (.pdf), and PowerPoint (.pptx)
   */
  async generateExport({ reportType, format, filters = {}, targetFilePath = null, user = 'System' }) {
    const formatClean = (format || 'excel').toLowerCase().replace('.', '');
    const exportDir = this.getExportDirectory();

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const safeType = (reportType || 'Export').replace(/[^a-zA-Z0-9]/g, '_');
    let ext = 'xlsx';
    if (formatClean === 'pdf') ext = 'pdf';
    if (formatClean === 'pptx' || formatClean === 'powerpoint') ext = 'pptx';

    const defaultPrefix = safeType.toLowerCase().includes('master') ? 'Master_Export' : `Himmel_${safeType}`;
    const fileName = targetFilePath ? path.basename(targetFilePath) : `${defaultPrefix}_${timestampStr}.${ext}`;
    const filePath = targetFilePath || path.join(exportDir, fileName);

    logger.info(`Starting export: ${reportType} -> ${formatClean.toUpperCase()} at ${filePath}`);

    let totalRecords = 0;
    let totalAmount = 0;

    if (safeType.toLowerCase().includes('master')) {
      const masterData = await this.fetchMasterData(filters);
      totalRecords = masterData.summary.totalRecords;
      totalAmount = masterData.summary.totalAmount;

      if (ext === 'xlsx') {
        await this.generateMasterExcel(filePath, masterData, filters, user);
      } else if (ext === 'pdf') {
        await this.generateMasterPDF(filePath, masterData, filters, user);
      } else if (ext === 'pptx') {
        await this.generateMasterPowerPoint(filePath, masterData, filters, user);
      } else {
        throw new Error(`Unsupported export format '${format}'.`);
      }
    } else {
      const data = await this.fetchData(reportType, filters);
      totalRecords = data.summary.totalRecords;
      totalAmount = data.summary.totalAmount;

      if (ext === 'xlsx') {
        await this.generateExcel(filePath, data, filters, user);
      } else if (ext === 'pdf') {
        await this.generatePDF(filePath, data, filters, user);
      } else if (ext === 'pptx') {
        await this.generatePowerPoint(filePath, data, filters, user);
      } else {
        throw new Error(`Unsupported export format '${format}'.`);
      }
    }

    // Log action to the audit trail (stored in the cloud database, attributed to the signed-in user)
    if (typeof this.dataSource.logExport === 'function') {
      try {
        await this.dataSource.logExport({
          isMaster: safeType.toLowerCase().includes('master'),
          reportType,
          format: ext,
          fileName,
          totalRecords,
          filters
        });
      } catch (aErr) {
        logger.error('Failed to log export action to audit trail:', aErr);
      }
    }

    return {
      success: true,
      reportType,
      format: ext,
      fileName,
      filePath,
      totalRecords,
      totalAmount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Excel Export (.xlsx) using exceljs
   */
  async generateExcel(filePath, data, filters, user) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Himmel Pharmaceutical System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(data.title.substring(0, 30));

    // 1. Header Information Block
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'HIMMEL PHARMACEUTICAL LTD';
    titleCell.font = { bold: true, size: 16, color: { argb: '9E1B1E' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = `${data.title} | Generated: ${new Date().toLocaleString()} | User: ${user}`;
    subCell.font = { bold: true, size: 11, color: { argb: '475569' } };
    subCell.alignment = { horizontal: 'center' };

    let filterText = 'Filters: None';
    const filterParts = [];
    if (filters.startDate) filterParts.push(`Start: ${filters.startDate}`);
    if (filters.endDate) filterParts.push(`End: ${filters.endDate}`);
    if (filters.search) filterParts.push(`Search: "${filters.search}"`);
    if (filters.area) filterParts.push(`Area: ${filters.area}`);
    if (filters.status) filterParts.push(`Status: ${filters.status}`);
    if (filterParts.length > 0) filterText = `Filters: ${filterParts.join(' | ')}`;

    sheet.mergeCells('A3:H3');
    const filterCell = sheet.getCell('A3');
    filterCell.value = filterText;
    filterCell.font = { italic: true, size: 10, color: { argb: '64748B' } };
    filterCell.alignment = { horizontal: 'center' };

    sheet.addRow([]); // Blank row at row 4

    // 2. Table Column Headers (Row 5)
    const headerRowValues = data.columns.map(c => c.header);
    const headerRow = sheet.addRow(headerRowValues);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: '334155' } },
        bottom: { style: 'medium', color: { argb: '0F172A' } }
      };
    });

    // 3. Populate Rows
    data.rows.forEach((r, idx) => {
      const rowVals = data.columns.map(col => {
        const val = r[col.key];
        if (col.type === 'currency') {
          return Number(val) || 0;
        }
        return val !== null && val !== undefined ? val : '—';
      });
      const dataRow = sheet.addRow(rowVals);
      dataRow.height = 20;

      dataRow.eachCell((cell, colIdx) => {
        const colDef = data.columns[colIdx - 1];
        if (colDef && colDef.type === 'currency') {
          cell.numFmt = '"Rs "#,##0.00';
          cell.alignment = { horizontal: 'right' };
        } else if (colDef && colDef.type === 'number') {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'left' };
        }

        // Zebra striping
        if (idx % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
        }
      });
    });

    // 4. Totals Row (if applicable)
    if (data.rows.length > 0 && (data.summary.totalAmount > 0 || data.summary.totalQty > 0)) {
      const totalVals = data.columns.map((col, idx) => {
        if (idx === 0) return 'TOTAL / SUMMARY';
        if (col.type === 'currency') return data.summary.totalAmount;
        if (col.key === 'annual_target' || col.key === 'total_orders') return data.summary.totalQty;
        return '';
      });

      const totalRow = sheet.addRow(totalVals);
      totalRow.height = 24;
      totalRow.eachCell((cell, colIdx) => {
        cell.font = { bold: true, color: { argb: '9E1B1E' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
        cell.border = { top: { style: 'double', color: { argb: '9E1B1E' } }, bottom: { style: 'double', color: { argb: '9E1B1E' } } };
        const colDef = data.columns[colIdx - 1];
        if (colDef && colDef.type === 'currency') {
          cell.numFmt = '"Rs "#,##0.00';
        }
      });
    }

    // Auto column widths
    sheet.columns.forEach((col, idx) => {
      const colDef = data.columns[idx];
      if (colDef) {
        col.width = Math.max(colDef.width || 15, 12);
      }
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 5 }];

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * PDF Export (.pdf) using pdfkit
   */
  async generatePDF(filePath, data, filters, user) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header Banner
      doc.rect(30, 25, 782, 45).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 33);
      doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text(data.title.toUpperCase(), 45, 52);

      const timestamp = new Date().toLocaleString();
      doc.fillColor('#94A3B8').fontSize(9).text(`Generated: ${timestamp}`, 580, 35, { align: 'right' });
      doc.text(`User: ${user}`, 580, 50, { align: 'right' });

      // Filters summary bar
      doc.rect(30, 75, 782, 20).fill('#F8FAFC');
      let filterStr = `Total Records: ${data.summary.totalRecords}`;
      if (data.summary.totalAmount > 0) {
        filterStr += `  |  Total Value: Rs ${data.summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      }
      if (filters.search) filterStr += `  |  Search: "${filters.search}"`;
      if (filters.status) filterStr += `  |  Status: ${filters.status}`;
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(filterStr, 40, 80);

      // Table Setup
      let y = 105;
      const startX = 30;
      const totalW = 782;

      // Draw Column Headers
      doc.rect(startX, y, totalW, 20).fill('#9E1B1E');
      let x = startX;
      const colWidths = data.columns.map(c => Math.floor((c.width / 160) * totalW));

      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      data.columns.forEach((col, i) => {
        const w = colWidths[i];
        doc.text(col.header, x + 4, y + 5, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left' });
        x += w;
      });

      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8);
      data.rows.forEach((row, rowIdx) => {
        if (y > 520) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          y = 40;
          // Redraw Table Header on new page
          doc.rect(startX, y, totalW, 20).fill('#9E1B1E');
          let rx = startX;
          doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
          data.columns.forEach((col, i) => {
            const w = colWidths[i];
            doc.text(col.header, rx + 4, y + 5, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left' });
            rx += w;
          });
          y += 20;
          doc.font('Helvetica').fontSize(8);
        }

        // Zebra background
        if (rowIdx % 2 === 1) {
          doc.rect(startX, y, totalW, 18).fill('#F8FAFC');
        }

        let cx = startX;
        doc.fillColor('#1E293B');
        data.columns.forEach((col, colIdx) => {
          const w = colWidths[colIdx];
          let val = row[col.key];
          if (col.type === 'currency') {
            val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs 0.00';
          } else if (val === null || val === undefined) {
            val = '—';
          } else {
            val = String(val);
          }
          doc.text(val, cx + 4, y + 4, { width: w - 8, align: col.type === 'currency' || col.type === 'number' ? 'right' : 'left', lineBreak: false });
          cx += w;
        });

        // Bottom row border
        doc.moveTo(startX, y + 18).lineTo(startX + totalW, y + 18).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        y += 18;
      });

      // Footer with Page Numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
          `Himmel Pharmaceutical Sales System  |  Confidential  |  Page ${i + 1} of ${pages.count}`,
          30,
          560,
          { width: 782, align: 'center' }
        );
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * PowerPoint Export (.pptx) using PptReportService
   */
  async generatePowerPoint(filePath, data, filters, user) {
    return PptReportService.generateReport({
      reportType: data.title,
      filters,
      data,
      user,
      targetFilePath: filePath
    });
  }

  /**
   * Master Excel Export (.xlsx) containing 12 worksheets
   */
  async generateMasterExcel(filePath, masterData, filters, user) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Himmel Pharmaceutical System';
    workbook.created = new Date();

    for (const [modName, data] of Object.entries(masterData.modules)) {
      const sheetName = modName.substring(0, 31).replace(/[\/*?:\[\]]/g, '_');
      const sheet = workbook.addWorksheet(sheetName);

      // Header Information Block
      sheet.mergeCells('A1:H1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'HIMMEL PHARMACEUTICAL LTD';
      titleCell.font = { bold: true, size: 16, color: { argb: '9E1B1E' } };
      titleCell.alignment = { horizontal: 'center' };

      sheet.mergeCells('A2:H2');
      const subCell = sheet.getCell('A2');
      subCell.value = `${data.title} (Master Export) | Generated: ${new Date().toLocaleString()} | User: ${user}`;
      subCell.font = { bold: true, size: 11, color: { argb: '475569' } };
      subCell.alignment = { horizontal: 'center' };

      let filterText = 'Filters: None';
      const filterParts = [];
      if (filters.startDate) filterParts.push(`Start: ${filters.startDate}`);
      if (filters.endDate) filterParts.push(`End: ${filters.endDate}`);
      if (filters.search) filterParts.push(`Search: "${filters.search}"`);
      if (filters.area) filterParts.push(`Area: ${filters.area}`);
      if (filters.status) filterParts.push(`Status: ${filters.status}`);
      if (filterParts.length > 0) filterText = `Filters: ${filterParts.join(' | ')}`;

      sheet.mergeCells('A3:H3');
      const filterCell = sheet.getCell('A3');
      filterCell.value = filterText;
      filterCell.font = { italic: true, size: 10, color: { argb: '64748B' } };
      filterCell.alignment = { horizontal: 'center' };

      sheet.addRow([]);

      // Table Column Headers
      const headerRowValues = data.columns.map(c => c.header);
      const headerRow = sheet.addRow(headerRowValues);
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: '334155' } },
          bottom: { style: 'medium', color: { argb: '0F172A' } }
        };
      });

      // Populate Rows
      data.rows.forEach((r, idx) => {
        const rowVals = data.columns.map(col => {
          const val = r[col.key];
          if (col.type === 'currency') return Number(val) || 0;
          return val !== null && val !== undefined ? val : '—';
        });
        const dataRow = sheet.addRow(rowVals);
        dataRow.height = 20;

        dataRow.eachCell((cell, colIdx) => {
          const colDef = data.columns[colIdx - 1];
          if (colDef && colDef.type === 'currency') {
            cell.numFmt = '"Rs "#,##0.00';
            cell.alignment = { horizontal: 'right' };
          } else if (colDef && colDef.type === 'number') {
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }

          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
          }
        });
      });

      // Totals Row
      if (data.rows.length > 0 && (data.summary.totalAmount > 0 || data.summary.totalQty > 0)) {
        const totalVals = data.columns.map((col, idx) => {
          if (idx === 0) return 'TOTAL / SUMMARY';
          if (col.type === 'currency') return data.summary.totalAmount;
          if (col.key === 'annual_target' || col.key === 'total_orders') return data.summary.totalQty;
          return '';
        });

        const totalRow = sheet.addRow(totalVals);
        totalRow.height = 24;
        totalRow.eachCell((cell, colIdx) => {
          cell.font = { bold: true, color: { argb: '9E1B1E' }, size: 11 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF2F2' } };
          cell.border = { top: { style: 'double', color: { argb: '9E1B1E' } }, bottom: { style: 'double', color: { argb: '9E1B1E' } } };
          const colDef = data.columns[colIdx - 1];
          if (colDef && colDef.type === 'currency') {
            cell.numFmt = '"Rs "#,##0.00';
          }
        });
      }

      sheet.columns.forEach((col, idx) => {
        const colDef = data.columns[idx];
        if (colDef) {
          col.width = Math.max(colDef.width || 15, 12);
        }
      });
      sheet.views = [{ state: 'frozen', ySplit: 5 }];
    }

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * Master PDF Export (.pdf) containing cover page, executive summary, and multi-module sections
   */
  async generateMasterPDF(filePath, masterData, filters, user) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // 1. COVER PAGE
      doc.rect(0, 0, 842, 595).fill('#1E293B');
      doc.fillColor('#9E1B1E').fontSize(28).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 50, 180, { align: 'center' });
      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('MASTER ENTERPRISE SYSTEM EXPORT', 50, 230, { align: 'center' });
      doc.fillColor('#CBD5E1').fontSize(14).font('Helvetica').text('Comprehensive Multi-Module Business Intelligence Report', 50, 270, { align: 'center' });
      
      const filterSummaryText = filters.search ? `Filter: Search "${filters.search}"` : 'Scope: Full Business System';
      doc.fillColor('#94A3B8').fontSize(11).text(`Generated By: ${user}  |  Date: ${new Date().toLocaleString()}  |  ${filterSummaryText}`, 50, 480, { align: 'center' });

      // 2. EXECUTIVE SUMMARY PAGE
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      doc.rect(30, 25, 782, 45).fill('#1E293B');
      doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 33);
      doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text('MASTER EXPORT — EXECUTIVE SUMMARY', 45, 52);

      let yPos = 90;
      doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Module Summary Overview', 40, yPos);
      yPos += 25;

      doc.rect(40, yPos, 760, 22).fill('#9E1B1E');
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('Module Name', 50, yPos + 6);
      doc.text('Total Records', 300, yPos + 6);
      doc.text('Total Value (Rs)', 500, yPos + 6, { width: 150, align: 'right' });
      yPos += 22;

      for (const [modName, data] of Object.entries(masterData.modules)) {
        if (yPos > 520) {
          doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
          yPos = 40;
        }
        doc.rect(40, yPos, 760, 20).fill(yPos % 40 === 0 ? '#F8FAFC' : '#FFFFFF');
        doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(modName, 50, yPos + 5);
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(String(data.summary.totalRecords || 0), 300, yPos + 5);
        const valStr = data.summary.totalAmount > 0 ? `Rs ${data.summary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(valStr, 500, yPos + 5, { width: 150, align: 'right' });
        yPos += 20;
      }

      // 3. MODULE DETAIL SECTIONS
      for (const [modName, data] of Object.entries(masterData.modules)) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
        doc.rect(30, 25, 782, 40).fill('#1E293B');
        doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('HIMMEL PHARMACEUTICAL LTD', 45, 32);
        doc.fillColor('#F1F5F9').fontSize(10).font('Helvetica').text(modName.toUpperCase(), 45, 48);
        doc.fillColor('#94A3B8').fontSize(9).text(`Records: ${data.summary.totalRecords}`, 600, 38, { align: 'right' });

        let mY = 80;
        const colCount = Math.max(1, data.columns.length);
        const colWidth = Math.min(100, Math.floor(760 / colCount));

        doc.rect(40, mY, 760, 20).fill('#334155');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        data.columns.forEach((col, cIdx) => {
          doc.text(col.header, 45 + cIdx * colWidth, mY + 6, { width: colWidth - 5, ellipsis: true });
        });
        mY += 20;

        data.rows.slice(0, 22).forEach((r, rIdx) => {
          if (mY > 520) {
            doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
            mY = 40;
          }
          doc.rect(40, mY, 760, 18).fill(rIdx % 2 === 1 ? '#F8FAFC' : '#FFFFFF');
          doc.fillColor('#1E293B').fontSize(8).font('Helvetica');
          data.columns.forEach((col, cIdx) => {
            let val = r[col.key];
            if (col.type === 'currency') {
              val = val !== null && val !== undefined ? `Rs ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Rs 0.00';
            } else {
              val = val !== null && val !== undefined ? String(val) : '—';
            }
            doc.text(val, 45 + cIdx * colWidth, mY + 5, { width: colWidth - 5, ellipsis: true });
          });
          mY += 18;
        });
      }

      // 4. END OF REPORT PAGE
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 });
      doc.rect(0, 0, 842, 595).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text('END OF MASTER REPORT', 50, 260, { align: 'center' });
      doc.fillColor('#94A3B8').fontSize(12).font('Helvetica').text('Himmel Pharmaceutical Ltd — Master Enterprise Export System', 50, 300, { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * Master PowerPoint Export (.pptx) using PptReportService
   */
  async generateMasterPowerPoint(filePath, masterData, filters, user) {
    return PptReportService.generateMasterReport({
      masterData,
      filters,
      user,
      targetFilePath: filePath
    });
  }

  /**
   * Retrieve list of generated export files
   */
  getExportHistory() {
    const exportDir = this.getExportDirectory();
    if (!fs.existsSync(exportDir)) return [];

    const files = fs.readdirSync(exportDir);
    return files
      .filter(f => (f.startsWith('Himmel_') || f.startsWith('Master_Export')) && (f.endsWith('.xlsx') || f.endsWith('.pdf') || f.endsWith('.pptx')))
      .map(fileName => {
        const fullPath = path.join(exportDir, fileName);
        const stats = fs.statSync(fullPath);
        let format = 'EXCEL';
        if (fileName.endsWith('.pdf')) format = 'PDF';
        if (fileName.endsWith('.pptx')) format = 'POWERPOINT';

        return {
          id: fileName,
          fileName,
          filePath: fullPath,
          format,
          sizeBytes: stats.size,
          formattedSize: `${(stats.size / 1024).toFixed(1)} KB`,
          createdDate: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }
}

module.exports = ExportRepository;
