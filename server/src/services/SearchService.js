const logger = require('../logger');

const EMPTY_RESULT = {
  products: [],
  doctors: [],
  institutions: [],
  areas: [],
  teamMembers: [],
  orders: []
};

class SearchService {
  constructor(db) {
    this.db = db;
  }

  async globalSearch(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return { ...EMPTY_RESULT };
    }

    const term = `%${query.trim().slice(0, 100).toLowerCase()}%`;

    try {
      const [products, doctors, institutions, areas, teamMembers, orders] = await Promise.all([
        this.db.all(`
          SELECT id, product_code, brand_name, generic_name, status
          FROM products
          WHERE LOWER(COALESCE(product_code, '')) LIKE ?
             OR LOWER(COALESCE(brand_name, '')) LIKE ?
             OR LOWER(COALESCE(generic_name, '')) LIKE ?
          LIMIT 5
        `, [term, term, term]),

        this.db.all(`
          SELECT id, name, specialty, hospital, city, is_active
          FROM doctors
          WHERE LOWER(COALESCE(name, '')) LIKE ?
             OR LOWER(COALESCE(specialty, '')) LIKE ?
             OR LOWER(COALESCE(hospital, '')) LIKE ?
             OR LOWER(COALESCE(city, '')) LIKE ?
          LIMIT 5
        `, [term, term, term, term]),

        this.db.all(`
          SELECT id, name, type, code, is_active
          FROM institutions
          WHERE LOWER(COALESCE(name, '')) LIKE ?
             OR LOWER(COALESCE(type, '')) LIKE ?
             OR LOWER(COALESCE(code, '')) LIKE ?
          LIMIT 5
        `, [term, term, term]),

        this.db.all(`
          SELECT id, name, city, region, is_active
          FROM areas
          WHERE LOWER(COALESCE(name, '')) LIKE ?
             OR LOWER(COALESCE(city, '')) LIKE ?
             OR LOWER(COALESCE(region, '')) LIKE ?
          LIMIT 5
        `, [term, term, term]),

        this.db.all(`
          SELECT id, name, role, is_active
          FROM team_members
          WHERE LOWER(COALESCE(name, '')) LIKE ?
             OR LOWER(COALESCE(role, '')) LIKE ?
          LIMIT 5
        `, [term, term]),

        this.db.all(`
          SELECT o.id, o.order_number, o.order_date, o.status, o.total_amount,
                 COALESCE(d.name, '') AS doctor_name,
                 COALESCE(i.name, '') AS institution_name
          FROM orders o
          LEFT JOIN doctors d ON o.doctor_id = d.id
          LEFT JOIN institutions i ON o.institution_id = i.id
          WHERE LOWER(COALESCE(o.order_number, '')) LIKE ?
             OR LOWER(COALESCE(d.name, '')) LIKE ?
             OR LOWER(COALESCE(i.name, '')) LIKE ?
             OR LOWER(COALESCE(o.status, '')) LIKE ?
          LIMIT 5
        `, [term, term, term, term])
      ]);

      return { products, doctors, institutions, areas, teamMembers, orders };
    } catch (err) {
      logger.error('Error in SearchService.globalSearch:', err);
      return { ...EMPTY_RESULT };
    }
  }
}

module.exports = SearchService;
