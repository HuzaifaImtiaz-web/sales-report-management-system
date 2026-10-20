// Numbers for the Sales Review PowerPoint deck: any period, optionally one area or one team member.
// Everything a slide says (titles, key points, focus points, speaker notes) is derived from these
// numbers, so the deck never shows a sentence the data does not support.

const SALES_STATUSES = ['Approved', 'Completed']; // same rule as the dashboard
const SALES_SQL = `o.status IN ('Approved', 'Completed')`;
const DAY = 86400000;
const MAX_PERIOD_DAYS = 366 * 5;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

const iso = (d) => d.toISOString().slice(0, 10);
const num = (v) => Number(v) || 0;

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayIn(timeZone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timeZone || 'UTC' });
}

function formatPeriod(start, end) {
  const a = parseDate(start);
  const b = parseDate(end);
  const [d1, m1, y1] = [a.getUTCDate(), a.getUTCMonth(), a.getUTCFullYear()];
  const [d2, m2, y2] = [b.getUTCDate(), b.getUTCMonth(), b.getUTCFullYear()];
  if (start === end) return `${d1} ${MONTHS[m1]} ${y1}`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1]} ${y1}`;
  if (y1 === y2) return `${d1} ${SHORT_MONTHS[m1]} – ${d2} ${SHORT_MONTHS[m2]} ${y2}`;
  return `${d1} ${SHORT_MONTHS[m1]} ${y1} – ${d2} ${SHORT_MONTHS[m2]} ${y2}`;
}

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

// "A", "A and B", "A, B and C"
function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function parseDistribution(text) {
  try {
    const value = JSON.parse(text || '[]');
    return Array.isArray(value) ? value : [];
  } catch (e) {
    return [];
  }
}

const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

class SalesReviewDataService {
  constructor(db, { timeZone } = {}) {
    this.db = db;
    this.timeZone = timeZone || 'UTC';
  }

  resolvePeriod(filters = {}) {
    const today = parseDate(todayIn(this.timeZone));
    let start = parseDate(filters.startDate);
    let end = parseDate(filters.endDate);
    if (!end) end = start && start > today ? start : today;
    if (!start) start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    if (start > end) [start, end] = [end, start];
    let days = Math.round((end - start) / DAY) + 1;
    if (days > MAX_PERIOD_DAYS) {
      start = new Date(end.getTime() - (MAX_PERIOD_DAYS - 1) * DAY);
      days = MAX_PERIOD_DAYS;
    }
    const prevEnd = new Date(start.getTime() - DAY);
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * DAY);
    return {
      start: iso(start),
      end: iso(end),
      days,
      prevStart: iso(prevStart),
      prevEnd: iso(prevEnd),
      label: formatPeriod(iso(start), iso(end)),
    };
  }

  // Area / team member filters arrive as an id (Reports, Export Center) or a name (older callers).
  async findOne(table, value) {
    if (value === undefined || value === null || String(value).trim() === '' || String(value) === 'All') return null;
    const raw = String(value).trim();
    const row = /^\d+$/.test(raw)
      ? await this.db.get(`SELECT id, name FROM ${table} WHERE id = ?`, [Number(raw)])
      : await this.db.get(`SELECT id, name FROM ${table} WHERE lower(name) = lower(?) ORDER BY id LIMIT 1`, [raw]);
    if (!row) throw new Error(`The ${table === 'areas' ? 'area' : 'team member'} chosen for the report was not found.`);
    return row;
  }

  async resolveScope(filters = {}) {
    const area = await this.findOne('areas', filters.areaId ?? filters.area);
    const teamMember = await this.findOne('team_members', filters.teamMemberId ?? filters.teamMember);
    const where = [];
    const params = [];
    if (area) {
      where.push('o.area_id = ?');
      params.push(area.id);
    }
    if (teamMember) {
      where.push('o.team_member_id = ?');
      params.push(teamMember.id);
    }
    const labels = [area ? area.name : 'All areas', teamMember ? teamMember.name : 'All team members'];
    return { area, teamMember, sql: where.length ? ` AND ${where.join(' AND ')}` : '', params, labels };
  }

  periodSql(alias = 'o') {
    return ` AND himmel_date(${alias}.order_date) BETWEEN himmel_date(?) AND himmel_date(?)`;
  }

  async salesTotal(from, to, scope) {
    const row = await this.db.get(
      `SELECT COALESCE(SUM(o.total_amount), 0) AS total FROM orders o WHERE ${SALES_SQL}${this.periodSql()}${scope.sql}`,
      [from, to, ...scope.params]
    );
    return num(row && row.total);
  }

  // Months shown on the trend chart: the period's months, or the 6 months up to its end when the
  // period is shorter than 3 months. More than 24 months are shown by quarter.
  trendBuckets(period) {
    const start = parseDate(period.start);
    const end = parseDate(period.end);
    const monthIndex = (d) => d.getUTCFullYear() * 12 + d.getUTCMonth();
    const first = monthIndex(start);
    const last = monthIndex(end);
    const spanMonths = last - first + 1;
    const from = spanMonths < 3 ? last - 5 : first;
    const months = [];
    for (let m = from; m <= last; m++) {
      const y = Math.floor(m / 12);
      const mo = m % 12;
      months.push({ key: `${y}-${String(mo + 1).padStart(2, '0')}`, label: SHORT_MONTHS[mo], year: y, inPeriod: m >= first });
    }
    // Year shown on the first bar and wherever the year changes
    months.forEach((b, i) => {
      if (i === 0 || months[i - 1].year !== b.year) b.label = `${b.label} ${String(b.year).slice(2)}`;
    });
    if (months.length <= 24) return { unit: 'month', buckets: months };
    const quarters = [];
    for (const m of months) {
      const q = `${m.year}-Q${Math.floor((Number(m.key.slice(5)) - 1) / 3) + 1}`;
      let bucket = quarters.find((x) => x.key === q);
      if (!bucket) {
        bucket = { key: q, label: q.replace('-', ' '), months: [], inPeriod: false };
        quarters.push(bucket);
      }
      bucket.months.push(m.key);
      bucket.inPeriod = bucket.inPeriod || m.inPeriod;
    }
    return { unit: 'quarter', buckets: quarters };
  }

  async trend(period, scope) {
    const { unit, buckets } = this.trendBuckets(period);
    const firstMonth = unit === 'month' ? buckets[0].key : buckets[0].months[0];
    const rows = await this.db.all(
      `SELECT to_char(himmel_date(o.order_date), 'YYYY-MM') AS month, COALESCE(SUM(o.total_amount), 0) AS total
       FROM orders o
       WHERE ${SALES_SQL} AND himmel_date(o.order_date) BETWEEN himmel_date(?) AND himmel_date(?)${scope.sql}
       GROUP BY 1`,
      [`${firstMonth}-01`, period.end, ...scope.params]
    );
    const byMonth = new Map(rows.map((r) => [r.month, num(r.total)]));
    return {
      unit,
      points: buckets.map((b) => ({
        label: b.label,
        inPeriod: b.inPeriod,
        value: unit === 'month' ? byMonth.get(b.key) || 0 : b.months.reduce((s, k) => s + (byMonth.get(k) || 0), 0),
      })),
    };
  }

  // Targets for the period: each business year's yearly target, scaled to the part of that year the
  // period covers, then to the chosen area / team member using the target's distribution.
  async targets(period, scope) {
    const years = await this.db.all(
      `SELECT id, start_date, end_date FROM business_years
       WHERE himmel_date(start_date) <= himmel_date(?) AND himmel_date(end_date) >= himmel_date(?)`,
      [period.end, period.start]
    );
    const products = new Map();
    const areas = new Map();
    const members = new Map();
    let total = 0;
    const add = (map, key, extra, value) => {
      const entry = map.get(key) || { ...extra, target: 0 };
      entry.target += value;
      map.set(key, entry);
    };

    for (const year of years) {
      const ys = parseDate(String(year.start_date).slice(0, 10));
      const ye = parseDate(String(year.end_date).slice(0, 10));
      if (!ys || !ye) continue;
      const overlapStart = Math.max(ys.getTime(), parseDate(period.start).getTime());
      const overlapEnd = Math.min(ye.getTime(), parseDate(period.end).getTime());
      if (overlapEnd < overlapStart) continue;
      const share = ((overlapEnd - overlapStart) / DAY + 1) / ((ye - ys) / DAY + 1);

      const rows = await this.db.all(
        `SELECT pt.product_id, pt.annual_target_qty, pt.areas_distribution, p.brand_name, p.tp
         FROM product_targets pt JOIN products p ON p.id = pt.product_id
         WHERE pt.business_year_id = ?`,
        [year.id]
      );
      for (const row of rows) {
        const yearQty = num(row.annual_target_qty) * share;
        const tp = num(row.tp);
        const dist = parseDistribution(row.areas_distribution);
        let scopeShare = 1;
        if (scope.area || scope.teamMember) {
          scopeShare = 0;
          for (const a of dist) {
            if (scope.area && !sameName(a.areaName, scope.area.name)) continue;
            const areaShare = num(a.percentage) / 100;
            if (scope.teamMember) {
              for (const m of a.teamMembers || []) {
                if (sameName(m.name, scope.teamMember.name)) scopeShare += areaShare * (num(m.percentage) / 100);
              }
            } else {
              scopeShare += areaShare;
            }
          }
        }
        const qty = yearQty * scopeShare;
        if (qty > 0) {
          add(products, row.product_id, { name: row.brand_name, tp }, qty);
          total += qty * tp;
        }
        for (const a of dist) {
          const areaQty = yearQty * (num(a.percentage) / 100);
          if (areaQty <= 0) continue;
          add(areas, String(a.areaName || '').trim().toLowerCase(), {}, areaQty * tp);
          for (const m of a.teamMembers || []) {
            const memberValue = areaQty * (num(m.percentage) / 100) * tp;
            if (memberValue > 0) add(members, String(m.name || '').trim().toLowerCase(), {}, memberValue);
          }
        }
      }
    }
    return { total, products, areas, members };
  }

  async build(filters = {}) {
    const period = this.resolvePeriod(filters);
    const scope = await this.resolveScope(filters);
    const P = [period.start, period.end];

    const orders = await this.db.all(
      `SELECT o.id, o.order_number, o.order_date, o.total_amount, o.status,
              d.name AS doctor_name, i.name AS institution_name, a.name AS area_name, tm.name AS team_member_name
       FROM orders o
       LEFT JOIN doctors d ON d.id = o.doctor_id
       LEFT JOIN institutions i ON i.id = o.institution_id
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN team_members tm ON tm.id = o.team_member_id
       WHERE o.status <> 'Draft'${this.periodSql()}${scope.sql}
       ORDER BY himmel_date(o.order_date) DESC, o.id DESC`,
      [...P, ...scope.params]
    );

    const sales = orders.filter((o) => SALES_STATUSES.includes(o.status));
    const salesTotal = sales.reduce((s, o) => s + num(o.total_amount), 0);
    const previousSales = await this.salesTotal(period.prevStart, period.prevEnd, scope);
    const salesChange = previousSales > 0 ? Math.round(((salesTotal - previousSales) / previousSales) * 100) : null;

    const statusOrder = ['Completed', 'Approved', 'Pending', 'Cancelled'];
    const statuses = statusOrder
      .map((status) => {
        const list = orders.filter((o) => o.status === status);
        return { status, count: list.length, value: list.reduce((s, o) => s + num(o.total_amount), 0) };
      })
      .filter((s) => s.count > 0 || s.status !== 'Approved');
    const pending = statuses.find((s) => s.status === 'Pending') || { count: 0, value: 0 };

    const productRows = await this.db.all(
      `SELECT p.id, p.brand_name AS name, dv.name AS division, SUM(oi.quantity) AS qty, SUM(oi.total_price) AS value
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN divisions dv ON dv.id = p.division_id
       WHERE ${SALES_SQL}${this.periodSql()}${scope.sql}
       GROUP BY p.id, p.brand_name, dv.name
       ORDER BY SUM(oi.total_price) DESC, p.brand_name`,
      [...P, ...scope.params]
    );
    const productSalesTotal = productRows.reduce((s, r) => s + num(r.value), 0);
    const products = productRows.map((r) => ({
      id: r.id,
      name: r.name,
      division: r.division || '',
      qty: num(r.qty),
      value: num(r.value),
      share: pct(num(r.value), productSalesTotal) || 0,
    }));
    const unitsSold = products.reduce((s, p) => s + p.qty, 0);
    const activeProductsRow = await this.db.get(`SELECT COUNT(*) AS n FROM products WHERE status = 'Active'`);

    const targets = await this.targets(period, scope);

    const productTargets = [...targets.products.entries()]
      .map(([id, t]) => {
        const sold = products.find((p) => p.id === Number(id));
        const achievedQty = sold ? sold.qty : 0;
        return { name: t.name, targetQty: t.target, achievedQty, percent: pct(achievedQty, t.target) || 0 };
      })
      .filter((t) => t.targetQty > 0)
      .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));

    const areaRows = await this.db.all(
      `SELECT a.id, a.name,
              COALESCE(SUM(o.total_amount), 0) AS value,
              (SELECT COUNT(*) FROM doctors d WHERE d.area_id = a.id AND d.is_active = 1) AS doctors,
              (SELECT COUNT(*) FROM team_members t WHERE t.area_id = a.id AND t.is_active = 1) AS team
       FROM areas a
       LEFT JOIN orders o ON o.area_id = a.id AND ${SALES_SQL}${this.periodSql()}${scope.sql}
       WHERE a.is_active = 1${scope.area ? ' AND a.id = ?' : ''}
       GROUP BY a.id, a.name
       ORDER BY 3 DESC, a.name`,
      [...P, ...scope.params, ...(scope.area ? [scope.area.id] : [])]
    );
    const areas = areaRows
      .map((r) => {
        // With one team member chosen, an area's whole target is not theirs to reach: no % then.
        const t = scope.teamMember ? null : targets.areas.get(String(r.name).trim().toLowerCase());
        const target = t ? t.target : 0;
        return { name: r.name, value: num(r.value), doctors: num(r.doctors), team: num(r.team), target, percent: pct(num(r.value), target) };
      })
      .filter((a) => a.value > 0 || a.target > 0);

    const teamRows = await this.db.all(
      `SELECT tm.id, tm.name, tm.role, a.name AS area_name, COALESCE(SUM(o.total_amount), 0) AS value
       FROM team_members tm
       LEFT JOIN areas a ON a.id = tm.area_id
       LEFT JOIN orders o ON o.team_member_id = tm.id AND ${SALES_SQL}${this.periodSql()}${scope.sql}
       WHERE tm.is_active = 1${scope.teamMember ? ' AND tm.id = ?' : ''}
       GROUP BY tm.id, tm.name, tm.role, a.name
       ORDER BY 5 DESC, tm.name`,
      [...P, ...scope.params, ...(scope.teamMember ? [scope.teamMember.id] : [])]
    );
    const team = teamRows
      .map((r) => {
        const t = targets.members.get(String(r.name).trim().toLowerCase());
        const target = t ? t.target : 0;
        return { name: r.name, role: r.role || '', area: r.area_name || '', value: num(r.value), target, percent: pct(num(r.value), target) };
      })
      .filter((m) => m.value > 0 || m.target > 0);

    const targetPercent = pct(salesTotal, targets.total);
    const completedCount = (statuses.find((s) => s.status === 'Completed') || { count: 0 }).count;
    const salesOrderValues = sales.map((o) => num(o.total_amount));

    const data = {
      period,
      scope: { labels: scope.labels, area: scope.area && scope.area.name, teamMember: scope.teamMember && scope.teamMember.name },
      kpis: {
        sales: salesTotal,
        previousSales,
        salesChange,
        orders: orders.length,
        completed: completedCount,
        pending: pending.count,
        pendingValue: pending.value,
        cancelled: (statuses.find((s) => s.status === 'Cancelled') || { count: 0 }).count,
        targetValue: targets.total,
        targetPercent,
        unitsSold,
        activeProducts: num(activeProductsRow && activeProductsRow.n),
        averageOrder: salesOrderValues.length ? salesTotal / salesOrderValues.length : 0,
        largestOrder: salesOrderValues.length ? Math.max(...salesOrderValues) : 0,
        completedShare: pct(completedCount, orders.length),
      },
      trend: await this.trend(period, scope),
      products,
      productTargets,
      areas,
      team,
      statuses,
      orders: orders.map((o) => ({
        number: o.order_number,
        date: String(o.order_date).slice(0, 10),
        customer: o.doctor_name || o.institution_name || '—',
        area: o.area_name || '—',
        teamMember: o.team_member_name || '—',
        amount: num(o.total_amount),
        status: o.status,
      })),
    };
    data.insights = this.insights(data);
    return data;
  }

  // Short statements for the summary and closing slides, each one backed by the numbers above.
  // Text is a list of runs: [{ text, bold }].
  insights(data) {
    const { kpis, products, areas, productTargets, scope } = data;
    const keyPoints = [];
    const focus = [];

    if (kpis.salesChange !== null && kpis.salesChange !== 0) {
      const up = kpis.salesChange > 0;
      keyPoints.push({
        kind: up ? 'up' : 'down',
        runs: [{ text: 'Sales ' }, { text: `${up ? 'up' : 'down'} ${Math.abs(kpis.salesChange)}%`, bold: true }, { text: ' on the previous period' }],
      });
    } else if (kpis.sales === 0) {
      keyPoints.push({ kind: 'alert', runs: [{ text: 'No sales were recorded in this period' }] });
    }

    if (products.length > 0) {
      keyPoints.push({
        kind: 'star',
        runs: [{ text: products[0].name, bold: true }, { text: ` is ${products[0].share}% of all sales` }],
      });
    }

    const weakAreas = scope.area ? [] : areas.filter((a) => a.percent !== null && a.percent < 60).sort((a, b) => a.percent - b.percent);
    if (weakAreas.length > 0) {
      const names = joinNames(weakAreas.slice(0, 2).map((a) => a.name));
      keyPoints.push({ kind: 'alert', runs: [{ text: names, bold: true }, { text: ` ${weakAreas.length > 1 ? 'are' : 'is'} below 60% of target` }] });
    } else if (kpis.pending > 0) {
      keyPoints.push({ kind: 'alert', runs: [{ text: `${kpis.pending} order${kpis.pending === 1 ? '' : 's'}`, bold: true }, { text: ' still pending' }] });
    }

    if (kpis.pending > 0) {
      focus.push([{ text: 'Close the ' }, { text: `${kpis.pending} pending order${kpis.pending === 1 ? '' : 's'}`, bold: true }, { text: ` worth Rs ${Math.round(kpis.pendingValue).toLocaleString('en-US')}` }]);
    }
    if (weakAreas.length > 0) {
      const names = joinNames(weakAreas.slice(0, 2).map((a) => a.name));
      focus.push([{ text: 'Support ' }, { text: names, bold: true }, { text: `, ${weakAreas.length > 1 ? 'both ' : ''}below 60% of target` }]);
    }
    const weakProduct = [...productTargets].sort((a, b) => a.percent - b.percent)[0];
    if (weakProduct && weakProduct.percent < 60) {
      focus.push([{ text: 'Lift ' }, { text: weakProduct.name, bold: true }, { text: ` from ${weakProduct.percent}% of its target` }]);
    }
    if (focus.length < 3 && products.length > 0) {
      focus.push([{ text: 'Keep ' }, { text: products[0].name, bold: true }, { text: ` growing, now ${products[0].share}% of sales` }]);
    }
    if (focus.length < 3 && kpis.targetPercent !== null && kpis.targetPercent < 100) {
      focus.push([{ text: 'Close the gap to target: ' }, { text: `${100 - kpis.targetPercent}% to go`, bold: true }]);
    }
    return { keyPoints: keyPoints.slice(0, 3), focus: focus.slice(0, 3) };
  }
}

SalesReviewDataService.formatPeriod = formatPeriod;
module.exports = SalesReviewDataService;
