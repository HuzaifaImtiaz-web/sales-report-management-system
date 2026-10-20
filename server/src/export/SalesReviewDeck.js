/**
 * Sales Review deck (PowerPoint): one presentation for the sales team and the monthly management
 * meeting, for any period and optionally one area or team member. Layout follows the approved
 * design (1280 × 720 design pixels = a 13.33 × 7.5 inch widescreen slide).
 * Every number and sentence comes from SalesReviewDataService; slides without data are left out.
 */
const PptxGenJS = require('pptxgenjs');
const AssetManager = require('./ppt/assets');

const C = {
  crimson: 'A91D22', crimsonDark: '8B1418', tint: 'F1C9CA', tintStrong: 'D9777A',
  navy: '0B132B', navyCard: '16203A', navyLine: '26314F', navyMuted: 'CBD5E1',
  gold: 'FFC72C', goldText: '3D2E00', green: '16A34A', greenText: '15803D', greenBright: '4ADE80', red: 'DC2626', redText: 'B91C1C',
  ink: '111827', grey: '4B5563', muted: '6B7280', line: 'E5E7EB', light: 'F8F9FA', track: 'F1F2F4', white: 'FFFFFF',
  paleGreen: 'F0FDF4', paleGold: 'FFF8E1', paleRed: 'FEF2F2', pendingText: '6B4E00',
};
const FONT = 'Segoe UI';
const LOGO_RATIO = 292 / 78;
const DETAIL_ROWS_PER_SLIDE = 12;
const MAX_DETAIL_SLIDES = 20;

const X = (px) => px / 96; // design pixels → inches
const T = (px) => Math.round(px * 0.75 * 10) / 10; // design pixels → points

const money = (v) => `Rs ${Math.round(Number(v) || 0).toLocaleString('en-US')}`;
function compact(v) {
  const n = Number(v) || 0;
  if (n >= 1e6) return `Rs ${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e4) return `Rs ${Math.round(n / 1e3)}k`;
  return money(n);
}
const clip = (s, n) => {
  const str = String(s || '');
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
};
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const plain = (runs) => runs.map((r) => r.text).join('');

class Builder {
  constructor(data, { user, timeZone }) {
    this.data = data;
    this.user = user || 'System';
    this.timeZone = timeZone || 'UTC';
    this.pptx = new PptxGenJS();
    this.pptx.layout = 'LAYOUT_WIDE';
    this.pptx.author = 'Himmel Sales Management';
    this.pptx.company = 'Himmel Pharmaceuticals Pvt Ltd';
    this.pptx.title = `Sales Review ${data.period.label}`;
    this.page = 0;
    this.logo = AssetManager.logoData;
  }

  // ---------- drawing helpers (design pixels) ----------
  text(slide, content, { x, y, w, h, size = 16, color = C.ink, bold = false, align = 'left', valign = 'top', italic = false, charSpacing, lineSpacing }) {
    const runs = Array.isArray(content)
      ? content.map((r) => ({ text: r.text, options: { bold: r.bold || bold, color: r.color || color } }))
      : String(content);
    slide.addText(runs, {
      x: X(x), y: X(y), w: X(w), h: X(h),
      fontFace: FONT, fontSize: T(size), color, bold, italic, align, valign, margin: 0,
      ...(charSpacing ? { charSpacing } : {}),
      ...(lineSpacing ? { lineSpacingMultiple: lineSpacing } : {}),
    });
  }

  box(slide, { x, y, w, h, fill, radius = 0, line, shadow = false }) {
    slide.addShape(radius ? this.pptx.ShapeType.roundRect : this.pptx.ShapeType.rect, {
      x: X(x), y: X(y), w: X(w), h: X(h),
      fill: { color: fill },
      line: line ? { color: line.color, width: line.width || 1 } : { type: 'none' },
      ...(radius ? { rectRadius: X(radius) } : {}),
      ...(shadow ? { shadow: { type: 'outer', color: '0B132B', opacity: 0.18, blur: 12, offset: 4, angle: 90 } } : {}),
    });
  }

  circle(slide, { x, y, d, fill, line }) {
    slide.addShape(this.pptx.ShapeType.ellipse, {
      x: X(x), y: X(y), w: X(d), h: X(d),
      fill: fill ? { color: fill } : { type: 'none' },
      line: line ? { color: line.color, width: line.width || 1, transparency: line.transparency || 0 } : { type: 'none' },
    });
  }

  logoImage(slide, { x, y, h }) {
    if (this.logo) slide.addImage({ data: this.logo, x: X(x), y: X(y), w: X(h * LOGO_RATIO), h: X(h) });
    else this.text(slide, 'HIMMEL', { x, y, w: h * LOGO_RATIO, h, size: h * 0.6, bold: true, color: C.crimson });
  }

  logoCard(slide, { x, y, h, pad = 12 }) {
    this.box(slide, { x, y, w: h * LOGO_RATIO + pad * 2, h: h + pad * 1.4, fill: C.white, radius: 12 });
    this.logoImage(slide, { x: x + pad, y: y + pad * 0.7, h });
  }

  bar(slide, { x, y, w, h, percent, fill, track = C.track }) {
    this.box(slide, { x, y, w, h, fill: track, radius: h / 2 });
    const width = Math.max(0, Math.min(100, percent || 0)) / 100 * w;
    if (width >= h) this.box(slide, { x, y, w: width, h, fill, radius: h / 2 });
  }

  newSlide({ background = C.white, label, title, dark = false, logoOnCard = false, topBar = true } = {}) {
    const slide = this.pptx.addSlide();
    slide.background = { color: background };
    this.page += 1;
    if (topBar && !dark && background === C.white) this.box(slide, { x: 0, y: 0, w: 1280, h: 10, fill: C.crimson });
    if (title) {
      this.text(slide, label, { x: 64, y: 48, w: 900, h: 22, size: 15, bold: true, color: dark ? C.gold : C.crimson, charSpacing: 2 });
      this.text(slide, title, { x: 64, y: 76, w: 980, h: 54, size: 38, bold: true, color: dark ? C.white : C.ink, valign: 'middle' });
      if (logoOnCard || dark) this.logoCard(slide, { x: 1072, y: 48, h: 30, pad: 12 });
      else this.logoImage(slide, { x: 1080, y: 52, h: 36 });
    }
    return slide;
  }

  footer(slide, { dark = false, note = '' } = {}) {
    const color = dark ? C.navyMuted : C.muted;
    const text = `Himmel Sales Review · ${this.data.period.label}${note ? ` · ${note}` : ''}`;
    this.text(slide, text, { x: 64, y: 670, w: 1000, h: 20, size: 14, color });
    this.text(slide, String(this.page).padStart(2, '0'), { x: 1116, y: 670, w: 100, h: 20, size: 14, bold: true, color: dark ? C.gold : C.crimson, align: 'right' });
  }

  // ---------- slides ----------
  cover() {
    const { period, scope } = this.data;
    const slide = this.pptx.addSlide();
    this.page += 1;
    slide.background = { color: C.crimson };
    this.circle(slide, { x: 780, y: -300, d: 760, fill: C.crimsonDark });
    this.circle(slide, { x: 900, y: -180, d: 520, line: { color: C.white, width: 1.5, transparency: 80 } });
    this.circle(slide, { x: -160, y: 560, d: 380, fill: C.crimsonDark });
    this.box(slide, { x: 1186, y: 536, w: 14, h: 120, fill: C.gold, radius: 7 });
    this.logoCard(slide, { x: 80, y: 64, h: 52, pad: 22 });

    const labelW = Math.min(520, 40 + period.label.length * 11);
    this.box(slide, { x: 80, y: 262, w: labelW, h: 40, fill: C.gold, radius: 20 });
    this.text(slide, period.label, { x: 80, y: 262, w: labelW, h: 40, size: 18, bold: true, color: C.goldText, align: 'center', valign: 'middle' });
    this.text(slide, 'Sales Review', { x: 80, y: 318, w: 900, h: 110, size: 96, bold: true, color: C.white, valign: 'middle' });
    this.text(slide, 'Results for management and the sales team', { x: 80, y: 438, w: 900, h: 44, size: 28, color: C.white });
    let chipX = 80;
    for (const label of scope.labels) {
      const w = 34 + label.length * 9;
      this.box(slide, { x: chipX, y: 500, w, h: 38, fill: C.crimsonDark, radius: 10 });
      this.text(slide, label, { x: chipX, y: 500, w, h: 38, size: 16, bold: true, color: C.white, align: 'center', valign: 'middle' });
      chipX += w + 12;
    }
    const created = new Date().toLocaleDateString('en-GB', { timeZone: this.timeZone, day: 'numeric', month: 'long', year: 'numeric' });
    this.text(slide, `Prepared by ${clip(this.user, 40)}`, { x: 80, y: 608, w: 700, h: 24, size: 16, bold: true, color: C.white });
    this.text(slide, `Created ${created} · Himmel Sales Management`, { x: 80, y: 634, w: 700, h: 24, size: 16, color: C.white });

    slide.addNotes([
      `Sales Review for ${period.label}.`,
      `Scope: ${scope.labels.join(', ')}.`,
      'All figures come from the Himmel Sales Management system. Sales count approved and completed orders.',
    ].join('\n'));
  }

  summary() {
    const { kpis, insights } = this.data;
    const slide = this.pptx.addSlide();
    this.page += 1;
    slide.background = { color: C.light };
    this.box(slide, { x: 0, y: 0, w: 470, h: 720, fill: C.navy });
    this.circle(slide, { x: -110, y: 560, d: 300, line: { color: C.crimson, width: 30 } });
    this.text(slide, 'AT A GLANCE', { x: 48, y: 56, w: 380, h: 22, size: 15, bold: true, color: C.gold, charSpacing: 2 });
    this.text(slide, 'This period in numbers', { x: 48, y: 86, w: 380, h: 110, size: 46, bold: true, color: C.white, lineSpacing: 0.95 });

    const icon = { up: [C.green, '▲', C.white], down: [C.crimson, '▼', C.white], star: [C.crimson, '★', C.white], alert: [C.gold, '!', C.goldText] };
    insights.keyPoints.forEach((point, i) => {
      const y = 240 + i * 100;
      const [fill, glyph, glyphColor] = icon[point.kind] || icon.star;
      this.box(slide, { x: 48, y, w: 44, h: 44, fill, radius: 12 });
      this.text(slide, glyph, { x: 48, y, w: 44, h: 44, size: 20, bold: true, color: glyphColor, align: 'center', valign: 'middle' });
      this.text(slide, point.runs, { x: 108, y: y - 2, w: 320, h: 80, size: 20, color: C.white });
    });

    const cards = [
      { label: 'Sales', value: compact(kpis.sales), accent: C.crimson,
        sub: kpis.salesChange === null ? 'No sales in the previous period' : `${kpis.salesChange >= 0 ? '▲' : '▼'} ${Math.abs(kpis.salesChange)}% vs previous period`,
        subColor: kpis.salesChange === null ? C.grey : kpis.salesChange >= 0 ? C.greenText : C.redText },
      { label: 'Orders', value: kpis.orders.toLocaleString('en-US'), accent: C.navy,
        sub: `${kpis.completed} completed · ${kpis.pending} pending · ${kpis.cancelled} cancelled`, subColor: C.grey },
      { label: 'Target reached', value: kpis.targetPercent === null ? '—' : `${kpis.targetPercent}%`, accent: C.gold,
        sub: kpis.targetPercent === null ? 'No targets set for this period' : null, progress: kpis.targetPercent },
      { label: 'Units sold', value: kpis.unitsSold.toLocaleString('en-US'), accent: C.green,
        sub: `${kpis.activeProducts} active products`, subColor: C.grey },
    ];
    cards.forEach((card, i) => {
      const x = 526 + (i % 2) * 361;
      const y = 56 + Math.floor(i / 2) * 295;
      this.box(slide, { x, y, w: 337, h: 271, fill: C.white, radius: 20 });
      this.box(slide, { x: x + 32, y: y + 28, w: 48, h: 6, fill: card.accent, radius: 3 });
      this.text(slide, card.label, { x: x + 32, y: y + 50, w: 280, h: 26, size: 18, bold: true, color: C.grey });
      this.text(slide, card.value, { x: x + 32, y: y + 96, w: 290, h: 70, size: 52, bold: true, valign: 'middle' });
      if (card.progress !== undefined && card.progress !== null) {
        this.bar(slide, { x: x + 32, y: y + 205, w: 273, h: 12, percent: card.progress, fill: C.crimson });
      } else if (card.sub) {
        this.text(slide, card.sub, { x: x + 32, y: y + 196, w: 285, h: 48, size: 16, bold: card.subColor !== C.grey, color: card.subColor || C.grey });
      }
    });
    this.text(slide, `Himmel Sales Review · ${this.data.period.label}`, { x: 526, y: 670, w: 560, h: 20, size: 14, color: C.muted });
    this.text(slide, String(this.page).padStart(2, '0'), { x: 1124, y: 670, w: 100, h: 20, size: 14, bold: true, color: C.crimson, align: 'right' });

    slide.addNotes([
      `Sales: ${money(kpis.sales)}${kpis.salesChange === null ? '' : ` (${kpis.salesChange >= 0 ? 'up' : 'down'} ${Math.abs(kpis.salesChange)}% on the previous period of the same length, ${money(kpis.previousSales)})`}.`,
      `Orders: ${kpis.orders} in total; ${kpis.completed} completed, ${kpis.pending} pending, ${kpis.cancelled} cancelled.`,
      kpis.targetPercent === null ? 'No targets are set for this period.' : `Target: ${kpis.targetPercent}% reached (${money(kpis.sales)} of ${money(kpis.targetValue)}).`,
      `Units sold: ${kpis.unitsSold.toLocaleString('en-US')}.`,
      ...insights.keyPoints.map((p) => `• ${plain(p.runs)}.`),
    ].join('\n'));
  }

  trend() {
    const { trend, kpis } = this.data;
    const points = trend.points;
    if (!points.some((p) => p.value > 0)) return;
    const unitWord = trend.unit === 'month' ? 'month' : 'quarter';
    let streak = 0;
    for (let i = points.length - 1; i > 0 && points[i].value > points[i - 1].value; i--) streak++;
    const title = streak >= 2
      ? `Sales grew ${streak} ${unitWord}s in a row`
      : kpis.salesChange
        ? `Sales ${kpis.salesChange > 0 ? 'up' : 'down'} ${Math.abs(kpis.salesChange)}% on the previous period`
        : `Sales by ${unitWord}`;
    const slide = this.newSlide({ label: 'SALES TREND', title });

    const max = Math.max(...points.map((p) => p.value));
    const fmt = max >= 1e6 ? '#,##0.0,,"M"' : max >= 1e4 ? '#,##0,"k"' : '#,##0';
    const labels = points.map((p) => p.label);
    slide.addChart(this.pptx.ChartType.bar, [
      { name: 'Before this period', labels, values: points.map((p) => (p.inPeriod ? 0 : p.value)) },
      { name: 'This period', labels, values: points.map((p) => (p.inPeriod ? p.value : 0)) },
    ], {
      x: X(64), y: X(150), w: X(820), h: X(500),
      barDir: 'col', barGrouping: 'stacked', barGapWidthPct: 45,
      chartColors: [C.tint, C.crimson], showLegend: false,
      catAxisLabelColor: C.muted, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 11,
      valAxisLabelColor: C.muted, valAxisLabelFontFace: FONT, valAxisLabelFontSize: 10, valAxisLabelFormatCode: fmt,
      valGridLine: { color: 'EEEEEE', size: 0.75 }, catGridLine: { style: 'none' },
      catAxisLineShow: true, valAxisLineShow: false,
    });

    const best = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
    const nonZero = points.filter((p) => p.value > 0);
    const average = nonZero.reduce((s, p) => s + p.value, 0) / (nonZero.length || 1);
    const last = points[points.length - 1];
    const vsAverage = average > 0 ? Math.round(((last.value - average) / average) * 100) : 0;

    this.box(slide, { x: 916, y: 150, w: 300, h: 230, fill: C.navy, radius: 20 });
    this.text(slide, `BEST ${unitWord.toUpperCase()}`, { x: 944, y: 176, w: 250, h: 22, size: 15, bold: true, color: C.gold, charSpacing: 2 });
    this.text(slide, best.label, { x: 944, y: 204, w: 250, h: 56, size: 44, bold: true, color: C.white, valign: 'middle' });
    this.text(slide, money(best.value), { x: 944, y: 266, w: 250, h: 30, size: 20, color: C.white });
    if (kpis.salesChange !== null) {
      this.text(slide, `${kpis.salesChange >= 0 ? '▲' : '▼'} ${Math.abs(kpis.salesChange)}% vs previous period`, { x: 944, y: 306, w: 260, h: 28, size: 16, bold: true, color: kpis.salesChange >= 0 ? C.greenBright : 'FCA5A5' });
    }
    this.box(slide, { x: 916, y: 400, w: 300, h: 210, fill: C.light, radius: 20 });
    this.text(slide, `Average ${unitWord} with sales`, { x: 944, y: 426, w: 260, h: 26, size: 16, bold: true, color: C.grey });
    this.text(slide, compact(average), { x: 944, y: 460, w: 250, h: 50, size: 34, bold: true, valign: 'middle' });
    const latestText = last.value > 0
      ? `The latest ${unitWord} was ${Math.abs(vsAverage)}% ${vsAverage >= 0 ? 'above' : 'below'} average`
      : `No sales yet in ${last.label}`;
    this.text(slide, latestText, { x: 944, y: 522, w: 250, h: 60, size: 16, color: C.grey });
    this.footer(slide, { note: `sales per ${unitWord}` });

    slide.addNotes([
      `Sales per ${unitWord}; the darker bars are inside the chosen period.`,
      `Best ${unitWord}: ${best.label} with ${money(best.value)}.`,
      `Average ${unitWord} with sales: ${money(average)}. ${last.value > 0 ? `The latest ${unitWord} (${last.label}) was ${Math.abs(vsAverage)}% ${vsAverage >= 0 ? 'above' : 'below'} average.` : `No sales yet in ${last.label}.`}`,
      streak >= 2 ? `Sales have grown ${streak} ${unitWord}s in a row.` : '',
    ].filter(Boolean).join('\n'));
  }

  targets() {
    const { productTargets, kpis } = this.data;
    if (!productTargets.length || kpis.targetPercent === null) return;
    const slide = this.newSlide({ label: 'TARGETS', title: `${kpis.targetPercent}% of the period's target reached` });

    this.box(slide, { x: 64, y: 150, w: 360, h: 490, fill: C.light, radius: 24 });
    const reached = Math.min(kpis.targetPercent, 100);
    slide.addChart(this.pptx.ChartType.doughnut, [{ name: 'Target', labels: ['Reached', 'Remaining'], values: [reached, 100 - reached] }], {
      x: X(124), y: X(180), w: X(240), h: X(240), holeSize: 74, showLegend: false, showValue: false, showPercent: false, showLabel: false,
      chartColors: [kpis.targetPercent >= 100 ? C.green : C.crimson, C.tint], dataBorder: { pt: 0, color: C.light },
    });
    this.text(slide, `${kpis.targetPercent}%`, { x: 124, y: 262, w: 240, h: 60, size: 52, bold: true, align: 'center', valign: 'middle' });
    this.text(slide, 'of the target', { x: 124, y: 320, w: 240, h: 24, size: 15, color: C.grey, align: 'center' });
    this.text(slide, 'Target', { x: 84, y: 470, w: 160, h: 22, size: 15, color: C.grey, align: 'center' });
    this.text(slide, compact(kpis.targetValue), { x: 84, y: 494, w: 160, h: 32, size: 22, bold: true, align: 'center' });
    this.text(slide, 'Achieved', { x: 244, y: 470, w: 160, h: 22, size: 15, color: C.grey, align: 'center' });
    this.text(slide, compact(kpis.sales), { x: 244, y: 494, w: 160, h: 32, size: 22, bold: true, color: C.crimson, align: 'center' });
    this.text(slide, 'Period target = yearly target × share of the year', { x: 84, y: 560, w: 320, h: 44, size: 13, color: C.muted, align: 'center' });

    const list = productTargets.length > 6 ? [...productTargets.slice(0, 3), ...productTargets.slice(-3)] : productTargets;
    const top = 150 + Math.max(0, (490 - list.length * 82) / 2);
    list.forEach((t, i) => {
      const y = top + i * 82;
      this.text(slide, clip(t.name, 34), { x: 472, y, w: 480, h: 30, size: 20, bold: true, valign: 'middle' });
      if (t.percent >= 100) {
        this.box(slide, { x: 1036, y: y + 2, w: 180, h: 28, fill: C.green, radius: 14 });
        this.text(slide, `${t.percent}% · achieved`, { x: 1036, y: y + 2, w: 180, h: 28, size: 15, bold: true, color: C.white, align: 'center', valign: 'middle' });
      } else if (t.percent < 50) {
        this.box(slide, { x: 996, y: y + 2, w: 220, h: 28, fill: C.gold, radius: 14 });
        this.text(slide, `${t.percent}% · needs attention`, { x: 996, y: y + 2, w: 220, h: 28, size: 15, bold: true, color: C.goldText, align: 'center', valign: 'middle' });
      } else {
        this.text(slide, `${t.percent}%`, { x: 1036, y, w: 180, h: 30, size: 18, bold: true, align: 'right', valign: 'middle' });
      }
      this.bar(slide, { x: 472, y: y + 44, w: 744, h: 16, percent: t.percent, fill: t.percent >= 100 ? C.green : C.crimson });
    });
    this.footer(slide, { note: productTargets.length > 6 ? `best 3 and lowest 3 of ${productTargets.length} products, by quantity` : 'by quantity sold' });

    slide.addNotes([
      `Overall: ${kpis.targetPercent}% of the period's target reached (${money(kpis.sales)} of ${money(kpis.targetValue)}).`,
      'The period target is the yearly target multiplied by the part of the business year the period covers.',
      ...productTargets.map((t) => `• ${t.name}: ${t.percent}% (${Math.round(t.achievedQty).toLocaleString('en-US')} of ${Math.round(t.targetQty).toLocaleString('en-US')} units).`),
    ].join('\n'));
  }

  products() {
    const { products } = this.data;
    if (!products.length) return;
    const top3 = products.slice(0, 3);
    const share3 = top3.reduce((s, p) => s + p.share, 0);
    const title = products.length >= 3 ? `Three products bring in ${share3}% of sales` : `${clip(products[0].name, 30)} leads with ${products[0].share}% of sales`;
    const slide = this.pptx.addSlide();
    this.page += 1;
    slide.background = { color: C.light };
    this.box(slide, { x: 0, y: 0, w: 1280, h: 290, fill: C.crimson });
    this.circle(slide, { x: 980, y: -240, d: 420, fill: C.crimsonDark });
    this.text(slide, 'TOP PRODUCTS', { x: 64, y: 48, w: 900, h: 22, size: 15, bold: true, color: C.gold, charSpacing: 2 });
    this.text(slide, title, { x: 64, y: 76, w: 980, h: 54, size: 38, bold: true, color: C.white, valign: 'middle' });
    this.logoCard(slide, { x: 1072, y: 48, h: 30, pad: 12 });

    const medal = [[C.gold, C.goldText], [C.line, C.ink], [C.tint, '6E0F13']];
    const cardW = (1152 - 2 * 24) / 3;
    top3.forEach((p, i) => {
      const x = 64 + i * (cardW + 24);
      this.box(slide, { x, y: 158, w: cardW, h: 228, fill: C.white, radius: 20, shadow: true });
      this.circle(slide, { x: x + 28, y: 182, d: 44, fill: medal[i][0] });
      this.text(slide, String(i + 1), { x: x + 28, y: 182, w: 44, h: 44, size: 22, bold: true, color: medal[i][1], align: 'center', valign: 'middle' });
      this.text(slide, `${p.share}% of sales`, { x: x + cardW - 200, y: 192, w: 172, h: 24, size: 16, bold: true, color: C.crimson, align: 'right' });
      this.text(slide, clip(p.name, 24), { x: x + 28, y: 238, w: cardW - 56, h: 36, size: 26, bold: true, valign: 'middle' });
      this.text(slide, money(p.value), { x: x + 28, y: 278, w: cardW - 56, h: 46, size: 36, bold: true, valign: 'middle' });
      this.text(slide, `${p.qty.toLocaleString('en-US')} units${p.division ? ` · ${clip(p.division, 18)}` : ''}`, { x: x + 28, y: 330, w: cardW - 56, h: 24, size: 16, color: C.grey });
    });

    const rest = products.slice(3, 9);
    const maxRest = rest.length ? rest[0].value : 0;
    rest.forEach((p, i) => {
      const col = Math.floor(i / 3);
      const row = i % 3;
      const x = 64 + col * 600;
      const y = 430 + row * 62;
      this.text(slide, String(i + 4), { x, y, w: 30, h: 28, size: 17, bold: true, color: C.muted, valign: 'middle' });
      this.text(slide, clip(p.name, 18), { x: x + 36, y, w: 170, h: 28, size: 17, bold: true, valign: 'middle' });
      this.bar(slide, { x: x + 214, y: y + 8, w: 220, h: 12, percent: maxRest ? (p.value / maxRest) * 100 : 0, fill: C.tintStrong, track: C.line });
      this.text(slide, compact(p.value), { x: x + 444, y, w: 108, h: 28, size: 17, bold: true, align: 'right', valign: 'middle' });
    });
    this.footer(slide, { note: products.length > 9 ? `top 9 of ${products.length} products` : 'by sales value' });

    slide.addNotes([
      products.length >= 3 ? `The top three products bring in ${share3}% of sales.` : '',
      ...products.slice(0, 9).map((p, i) => `${i + 1}. ${p.name}: ${money(p.value)}, ${p.qty.toLocaleString('en-US')} units, ${p.share}% of sales.`),
    ].filter(Boolean).join('\n'));
  }

  areas() {
    const { areas, scope } = this.data;
    if (!areas.length) return;
    const shown = areas.slice(0, 6);
    const best = shown[0];
    const withTarget = areas.filter((a) => a.percent !== null);
    const weakest = withTarget.length ? withTarget.reduce((a, b) => (b.percent < a.percent ? b : a)) : null;
    const title = areas.length >= 2 && weakest && weakest.percent < 60 && weakest.name !== best.name
      ? `${clip(best.name, 20)} leads; ${clip(weakest.name, 20)} needs support`
      : `${clip(best.name, 24)} leads with ${compact(best.value)}`;
    const slide = this.newSlide({ background: C.navy, dark: true, label: scope.area ? 'AREA' : 'AREAS', title });
    this.circle(slide, { x: 1060, y: 520, d: 360, line: { color: C.crimson, width: 36 } });

    const cols = 3;
    const cardW = (1152 - 2 * 20) / cols;
    const cardH = 220;
    shown.forEach((a, i) => {
      const x = 64 + (i % cols) * (cardW + 20);
      const y = 158 + Math.floor(i / cols) * (cardH + 20);
      const status = a.percent === null ? null : a.percent >= 80 ? [C.greenBright, '052E16', C.greenBright] : a.percent >= 60 ? [C.crimson, C.white, 'E0484D'] : [C.gold, C.goldText, C.gold];
      this.box(slide, { x, y, w: cardW, h: cardH, fill: C.navyCard, radius: 20, line: status && a.percent < 60 ? { color: C.gold, width: 2 } : null });
      this.text(slide, clip(a.name, 20), { x: x + 26, y: y + 24, w: cardW - 130, h: 32, size: 22, bold: true, color: C.white, valign: 'middle' });
      if (status) {
        this.box(slide, { x: x + cardW - 96, y: y + 28, w: 70, h: 26, fill: status[0], radius: 13 });
        this.text(slide, `${a.percent}%`, { x: x + cardW - 96, y: y + 28, w: 70, h: 26, size: 14, bold: true, color: status[1], align: 'center', valign: 'middle' });
      }
      this.text(slide, money(a.value), { x: x + 26, y: y + 70, w: cardW - 52, h: 46, size: 34, bold: true, color: C.white, valign: 'middle' });
      if (status) this.bar(slide, { x: x + 26, y: y + 130, w: cardW - 52, h: 10, percent: a.percent, fill: status[2], track: C.navyLine });
      this.text(slide, `${a.doctors} doctor${a.doctors === 1 ? '' : 's'} · ${a.team} team member${a.team === 1 ? '' : 's'}`, { x: x + 26, y: y + 156, w: cardW - 52, h: 24, size: 15, color: C.navyMuted });
    });
    this.footer(slide, { dark: true, note: `${areas.length > 6 ? `6 of ${areas.length} areas · ` : ''}% = share of the area's target reached` });

    slide.addNotes(areas.map((a) => `• ${a.name}: ${money(a.value)}${a.percent === null ? '' : `, ${a.percent}% of its target`}.`).join('\n'));
  }

  team() {
    const { team } = this.data;
    if (!team.length) return;
    const [lead, ...others] = team;
    const title = lead.percent !== null && lead.percent >= 100 ? `${clip(lead.name, 26)} passed the target` : `${clip(lead.name, 26)} leads the team`;
    const slide = this.newSlide({ label: 'TEAM', title });

    this.box(slide, { x: 64, y: 158, w: 340, h: 480, fill: C.crimson, radius: 24 });
    this.box(slide, { x: 84, y: 182, w: 160, h: 30, fill: C.gold, radius: 15 });
    this.text(slide, 'TOP PERFORMER', { x: 84, y: 182, w: 160, h: 30, size: 13, bold: true, color: C.goldText, align: 'center', valign: 'middle', charSpacing: 1 });
    this.circle(slide, { x: 96, y: 236, d: 88, fill: C.white });
    this.text(slide, initials(lead.name), { x: 96, y: 236, w: 88, h: 88, size: 32, bold: true, color: C.crimson, align: 'center', valign: 'middle' });
    this.text(slide, clip(lead.name, 22), { x: 96, y: 342, w: 290, h: 40, size: 30, bold: true, color: C.white, valign: 'middle' });
    this.text(slide, clip([lead.role, lead.area].filter(Boolean).join(' · '), 34), { x: 96, y: 386, w: 290, h: 26, size: 17, color: C.white });
    this.text(slide, 'Sales', { x: 96, y: 540, w: 140, h: 22, size: 15, color: C.white });
    this.text(slide, compact(lead.value), { x: 96, y: 564, w: 150, h: 40, size: 30, bold: true, color: C.white, valign: 'middle' });
    if (lead.percent !== null) {
      this.text(slide, 'Target', { x: 252, y: 540, w: 130, h: 22, size: 15, color: C.white });
      this.text(slide, `${lead.percent}%`, { x: 252, y: 564, w: 130, h: 40, size: 30, bold: true, color: C.white, valign: 'middle' });
    }

    const rows = others.slice(0, 5);
    const maxValue = lead.value || 1;
    const top = 158 + Math.max(0, (480 - rows.length * 88) / 2);
    rows.forEach((m, i) => {
      const y = top + i * 88;
      this.box(slide, { x: 444, y, w: 772, h: 76, fill: C.light, radius: 16 });
      this.text(slide, String(i + 2), { x: 462, y, w: 28, h: 76, size: 20, bold: true, color: C.muted, valign: 'middle' });
      this.circle(slide, { x: 496, y: y + 14, d: 48, fill: C.navy });
      this.text(slide, initials(m.name), { x: 496, y: y + 14, w: 48, h: 48, size: 15, bold: true, color: C.white, align: 'center', valign: 'middle' });
      this.text(slide, clip(m.name, 20), { x: 560, y: y + 12, w: 200, h: 28, size: 19, bold: true, valign: 'middle' });
      this.text(slide, clip(m.area, 22), { x: 560, y: y + 40, w: 200, h: 24, size: 15, color: C.grey });
      this.bar(slide, { x: 772, y: y + 32, w: 230, h: 12, percent: (m.value / maxValue) * 100, fill: C.crimson, track: C.line });
      this.text(slide, compact(m.value), { x: 1012, y, w: 110, h: 76, size: 18, bold: true, align: 'right', valign: 'middle' });
      this.text(slide, m.percent === null ? '—' : `${m.percent}%`, { x: 1126, y, w: 72, h: 76, size: 17, bold: true, color: C.grey, align: 'right', valign: 'middle' });
    });
    this.footer(slide, { note: `${team.length > 6 ? `top 6 of ${team.length} · ` : ''}% = share of personal target reached` });

    slide.addNotes(team.slice(0, 12).map((m, i) => `${i + 1}. ${m.name}${m.area ? ` (${m.area})` : ''}: ${money(m.value)}${m.percent === null ? '' : `, ${m.percent}% of target`}.`).join('\n'));
  }

  orders() {
    const { statuses, kpis } = this.data;
    if (!kpis.orders) return;
    const slide = this.newSlide({
      label: 'ORDERS',
      title: `${kpis.completedShare}% of orders completed; ${kpis.pending ? `${kpis.pending} still pending` : 'none pending'}`,
    });
    const look = {
      Completed: [C.green, C.paleGreen], Approved: ['0B132B', C.light], Pending: [C.gold, C.paleGold], Cancelled: [C.red, C.paleRed],
    };
    const shown = statuses.filter((s) => s.count > 0 || ['Completed', 'Pending', 'Cancelled'].includes(s.status));
    const withOrders = shown.filter((s) => s.count > 0);
    slide.addChart(this.pptx.ChartType.doughnut, [{ name: 'Orders', labels: withOrders.map((s) => s.status), values: withOrders.map((s) => s.count) }], {
      x: X(64), y: X(170), w: X(340), h: X(340), holeSize: 62, showLegend: false, showValue: false, showPercent: false, showLabel: false,
      chartColors: withOrders.map((s) => look[s.status][0]), dataBorder: { pt: 1, color: C.white },
    });
    this.text(slide, String(kpis.orders), { x: 64, y: 300, w: 340, h: 60, size: 60, bold: true, align: 'center', valign: 'middle' });
    this.text(slide, 'orders', { x: 64, y: 362, w: 340, h: 26, size: 18, color: C.grey, align: 'center' });

    shown.forEach((s, i) => {
      const y = 170 + i * 92;
      const [color, pale] = look[s.status];
      this.box(slide, { x: 460, y, w: 756, h: 76, fill: pale, radius: 18 });
      this.box(slide, { x: 486, y: y + 28, w: 20, h: 20, fill: color, radius: 6 });
      this.text(slide, s.status, { x: 524, y, w: 300, h: 76, size: 22, bold: true, valign: 'middle' });
      this.text(slide, String(s.count), { x: 830, y, w: 120, h: 76, size: 30, bold: true, align: 'right', valign: 'middle' });
      this.text(slide, money(s.value), { x: 970, y, w: 220, h: 76, size: 20, color: '374151', align: 'right', valign: 'middle' });
    });
    const statY = 170 + shown.length * 92 + 8;
    [['Average order', money(kpis.averageOrder)], ['Largest order', money(kpis.largestOrder)]].forEach(([label, value], i) => {
      const x = 460 + i * 390;
      this.box(slide, { x, y: statY, w: 366, h: 84, fill: C.white, radius: 18, line: { color: C.line } });
      this.text(slide, label, { x: x + 22, y: statY + 14, w: 320, h: 22, size: 15, color: C.grey });
      this.text(slide, value, { x: x + 22, y: statY + 38, w: 320, h: 34, size: 26, bold: true, valign: 'middle' });
    });
    this.footer(slide, { note: 'average and largest order: approved and completed orders only' });

    slide.addNotes([
      `${kpis.orders} orders in this period.`,
      ...shown.map((s) => `• ${s.status}: ${s.count} (${money(s.value)}).`),
      `Average order: ${money(kpis.averageOrder)}; largest order: ${money(kpis.largestOrder)}.`,
    ].join('\n'));
  }

  details() {
    const { orders } = this.data;
    if (!orders.length) return;
    const pages = Math.min(Math.ceil(orders.length / DETAIL_ROWS_PER_SLIDE), MAX_DETAIL_SLIDES);
    const statusColor = { Completed: C.greenText, Approved: C.navy, Pending: C.pendingText, Cancelled: C.redText };
    for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
      const slice = orders.slice(pageIndex * DETAIL_ROWS_PER_SLIDE, (pageIndex + 1) * DETAIL_ROWS_PER_SLIDE);
      const slide = this.newSlide({ label: `DETAILS · ${pageIndex + 1} OF ${pages}`, title: pageIndex === 0 ? 'All orders in this period' : 'All orders in this period (continued)' });
      const head = ['Order', 'Date', 'Customer', 'Area', 'Team member', 'Amount', 'Status'].map((h, i) => ({
        text: h,
        options: { bold: true, color: C.white, fill: { color: C.crimson }, align: i === 5 ? 'right' : 'left' },
      }));
      const rows = slice.map((o, r) => {
        const fill = { color: r % 2 ? C.light : C.white };
        const cell = (text, extra = {}) => ({ text, options: { fill, color: C.ink, ...extra } });
        return [
          cell(clip(o.number, 18), { bold: true }),
          cell(o.date),
          cell(clip(o.customer, 26)),
          cell(clip(o.area, 18)),
          cell(clip(o.teamMember, 18)),
          cell(money(o.amount), { bold: true, align: 'right' }),
          cell(o.status, { bold: true, color: statusColor[o.status] || C.grey }),
        ];
      });
      slide.addTable([head, ...rows], {
        x: X(64), y: X(148), w: X(1152),
        colW: [1.45, 1.15, 2.9, 1.85, 1.95, 1.45, 1.25].map((w) => w * (X(1152) / 12)),
        fontFace: FONT, fontSize: 11.5, rowH: X(38), valign: 'middle', margin: [0, X(12), 0, X(12)],
        border: { type: 'solid', pt: 0.5, color: C.line },
      });
      const last = pageIndex === pages - 1;
      const capped = last && orders.length > pages * DETAIL_ROWS_PER_SLIDE;
      this.footer(slide, { note: capped ? `first ${pages * DETAIL_ROWS_PER_SLIDE} of ${orders.length} orders; the Excel export has the full list` : last ? `${orders.length} orders` : 'continued on the next slide' });
      slide.addNotes(`Orders ${pageIndex * DETAIL_ROWS_PER_SLIDE + 1}–${pageIndex * DETAIL_ROWS_PER_SLIDE + slice.length} of ${orders.length}, newest first.`);
    }
  }

  closing() {
    const { insights } = this.data;
    const slide = this.pptx.addSlide();
    this.page += 1;
    slide.background = { color: C.navy };
    this.circle(slide, { x: -280, y: 440, d: 640, fill: C.crimson });
    this.circle(slide, { x: -180, y: 540, d: 440, line: { color: C.white, width: 1.5, transparency: 80 } });
    this.text(slide, 'NEXT STEPS', { x: 80, y: 64, w: 500, h: 22, size: 15, bold: true, color: C.gold, charSpacing: 2 });
    this.text(slide, 'Thank you', { x: 80, y: 96, w: 560, h: 100, size: 80, bold: true, color: C.white, valign: 'middle' });
    this.text(slide, 'Questions and discussion', { x: 80, y: 204, w: 560, h: 34, size: 24, color: C.navyMuted });
    this.logoCard(slide, { x: 80, y: 590, h: 40, pad: 14 });

    if (insights.focus.length) {
      const h = 120 + insights.focus.length * 92;
      const y = Math.max(64, (720 - h) / 2);
      this.box(slide, { x: 640, y, w: 560, h, fill: C.navyCard, radius: 24 });
      this.text(slide, 'Focus for the next period', { x: 680, y: y + 36, w: 480, h: 36, size: 28, bold: true, color: C.white, valign: 'middle' });
      insights.focus.forEach((runs, i) => {
        const iy = y + 96 + i * 92;
        this.circle(slide, { x: 680, y: iy, d: 40, fill: C.crimson });
        this.text(slide, String(i + 1), { x: 680, y: iy, w: 40, h: 40, size: 18, bold: true, color: C.white, align: 'center', valign: 'middle' });
        this.text(slide, runs, { x: 738, y: iy - 2, w: 430, h: 76, size: 20, color: C.white });
      });
    }
    slide.addNotes(insights.focus.length
      ? ['Suggested focus for the next period (from this period\'s numbers):', ...insights.focus.map((r, i) => `${i + 1}. ${plain(r)}.`)].join('\n')
      : 'Thank the team and open the discussion.');
  }

  async build() {
    this.cover();
    this.summary();
    this.trend();
    this.targets();
    this.products();
    this.areas();
    this.team();
    this.orders();
    this.details();
    this.closing();
    return this.pptx.write({ outputType: 'nodebuffer' });
  }
}

async function generateSalesReviewDeck(data, options = {}) {
  return new Builder(data, options).build();
}

module.exports = { generateSalesReviewDeck };
