const logger = require('../../logger.cjs');

class BusinessYearValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(year) {
    const { id, yearName, startDate, endDate, isActive } = year;

    if (!yearName || typeof yearName !== 'string' || yearName.trim().length === 0) {
      throw new Error('Business Year Name cannot be empty.');
    }

    if (!startDate || !endDate) {
      throw new Error('Start Date and End Date are required.');
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (isNaN(start) || isNaN(end)) {
      throw new Error('Invalid Date format.');
    }

    if (start > end) {
      throw new Error('Start Date must be before or equal to End Date.');
    }

    // Check duplicate name
    const normalizedName = yearName.trim().toLowerCase();
    const duplicateQuery = id
      ? this.db.prepare('SELECT id FROM business_years WHERE LOWER(year_name) = ? AND id != ?')
      : this.db.prepare('SELECT id FROM business_years WHERE LOWER(year_name) = ?');

    const dup = id ? duplicateQuery.get(normalizedName, id) : duplicateQuery.get(normalizedName);
    if (dup) {
      throw new Error('Business Year Name already exists.');
    }

    // Overlap Check: start_date <= new_end AND end_date >= new_start
    const overlapQuery = id
      ? this.db.prepare('SELECT id, year_name FROM business_years WHERE date(start_date) <= date(?) AND date(end_date) >= date(?) AND id != ?')
      : this.db.prepare('SELECT id, year_name FROM business_years WHERE date(start_date) <= date(?) AND date(end_date) >= date(?)');

    const overlap = id
      ? overlapQuery.get(endDate, startDate, id)
      : overlapQuery.get(endDate, startDate);

    if (overlap) {
      throw new Error(`Business Year overlaps another year: ${overlap.year_name}.`);
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Business Year ID is required for deletion.');

    // Check if active
    const year = this.db.prepare('SELECT is_active FROM business_years WHERE id = ?').get(id);
    if (year && year.is_active === 1) {
      throw new Error('Active Business Year cannot be deleted.');
    }

    // Check if contains product targets
    const targetCount = this.db.prepare('SELECT COUNT(*) as count FROM product_targets WHERE business_year_id = ?').get(id).count;
    if (targetCount > 0) {
      throw new Error('Business Year cannot be deleted because it contains Product Targets.');
    }
  }
}

module.exports = BusinessYearValidator;
