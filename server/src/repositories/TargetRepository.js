const logger = require('../logger');

const TARGET_SELECT = `
  SELECT pt.*, byr.year_name,
         COALESCE(p.brand_name, p.name) AS product_name,
         p.product_code,
         d.name AS division,
         g.name AS group_name,
         p.tp AS per_unit_price
  FROM product_targets pt
  JOIN business_years byr ON pt.business_year_id = byr.id
  JOIN products p ON pt.product_id = p.id
  LEFT JOIN divisions d ON p.division_id = d.id
  LEFT JOIN groups g ON p.group_id = g.id
`;

class TargetRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row) {
    if (!row) return null;
    let areasDistribution = [];
    try {
      areasDistribution = JSON.parse(row.areas_distribution);
    } catch (e) {
      logger.error('Failed to parse areas_distribution JSON:', e);
    }

    return {
      id: row.id,
      businessYearId: row.business_year_id,
      yearName: row.year_name || '',
      productId: row.product_id,
      productName: row.product_name || '',
      productCode: row.product_code || '',
      division: row.division || '',
      groupName: row.group_name || '',
      perUnitPrice: row.per_unit_price || 0.0,
      annualTargetQty: row.annual_target_qty,
      areasDistribution: areasDistribution,
      notes: row.notes || ''
    };
  }

  async findAll() {
    const rows = await this.db.all(`${TARGET_SELECT} ORDER BY byr.year_name DESC, product_name ASC`);
    return rows.map((r) => this._mapRow(r));
  }

  async findById(id) {
    const row = await this.db.get(`${TARGET_SELECT} WHERE pt.id = ?`, [id]);
    return this._mapRow(row);
  }

  _distribution(t) {
    return typeof t.areasDistribution === 'string' ? t.areasDistribution : JSON.stringify(t.areasDistribution);
  }

  async create(t) {
    const row = await this.db.get(`
      INSERT INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution, notes)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `, [t.businessYearId, t.productId, t.annualTargetQty, this._distribution(t), t.notes || null]);
    return this.findById(row.id);
  }

  async update(id, t) {
    await this.db.run(`
      UPDATE product_targets
      SET business_year_id = ?, product_id = ?, annual_target_qty = ?, areas_distribution = ?, notes = ?
      WHERE id = ?
    `, [t.businessYearId, t.productId, t.annualTargetQty, this._distribution(t), t.notes || null, id]);
    return this.findById(id);
  }

  async delete(id) {
    const res = await this.db.run('DELETE FROM product_targets WHERE id = ?', [id]);
    return res.changes > 0;
  }

  /**
   * Creates a business year (1 July – 30 June) in the database. Its targets come from the latest
   * earlier year: copied as they are, or with the same products and area split but quantity 0.
   */
  async createBusinessYear({ yearName, copyPreviousTargets = false } = {}) {
    const name = String(yearName || '').trim();
    const match = name.match(/^(\d{4})-(\d{4})$/);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) {
      throw new Error('Enter the business year as two following years, for example 2027-2028.');
    }
    const startYear = Number(match[1]);
    if (startYear < 2000 || startYear > 2100) throw new Error('Enter a business year between 2000 and 2100.');
    const startDate = `${startYear}-07-01`;
    const endDate = `${startYear + 1}-06-30`;

    return this.db.transaction(async (tx) => {
      const existing = await tx.get('SELECT id FROM business_years WHERE year_name = ?', [name]);
      if (existing) throw new Error(`Business year ${name} already exists.`);
      const created = await tx.get(
        'INSERT INTO business_years (year_name, start_date, end_date, is_active) VALUES (?, ?, ?, 1) RETURNING id',
        [name, startDate, endDate]
      );

      const previous = await tx.get(
        'SELECT id, year_name FROM business_years WHERE himmel_date(start_date) < himmel_date(?) ORDER BY himmel_date(start_date) DESC LIMIT 1',
        [startDate]
      );
      const previousTargets = previous
        ? await tx.all('SELECT product_id, annual_target_qty, areas_distribution, notes FROM product_targets WHERE business_year_id = ?', [previous.id])
        : [];

      let targets = 0;
      if (copyPreviousTargets) {
        for (const t of previousTargets) {
          await tx.run(
            'INSERT INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution, notes) VALUES (?, ?, ?, ?, ?)',
            [created.id, t.product_id, t.annual_target_qty, t.areas_distribution, t.notes]
          );
          targets++;
        }
      } else {
        // Same products and area split as the year before, quantities 0. (A target always needs an
        // area split that adds up to 100%, so products without one get their target added by hand.)
        for (const t of previousTargets) {
          await tx.run(
            'INSERT INTO product_targets (business_year_id, product_id, annual_target_qty, areas_distribution) VALUES (?, ?, 0, ?)',
            [created.id, t.product_id, t.areas_distribution]
          );
          targets++;
        }
      }
      return { id: created.id, value: name, startDate, endDate, copiedFrom: copyPreviousTargets && previous ? previous.year_name : null, targets };
    });
  }

  async getActiveBusinessYears() {
    const rows = await this.db.all('SELECT id, year_name, start_date, end_date FROM business_years ORDER BY year_name DESC');
    return rows.map((r) => ({
      id: r.id,
      value: r.year_name,
      label: `${r.year_name} (${r.start_date} to ${r.end_date})`,
      startDate: r.start_date,
      endDate: r.end_date
    }));
  }
}

module.exports = TargetRepository;
