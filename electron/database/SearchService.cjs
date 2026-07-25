const dbProxy = require('./dbProxy.cjs');
const logger = require('../logger.cjs');

class SearchService {
  static globalSearch(query) {
    const db = dbProxy;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return {
        products: [],
        doctors: [],
        institutions: [],
        areas: [],
        teamMembers: [],
        orders: []
      };
    }

    const term = `%${query.trim().toLowerCase()}%`;

    try {
      const products = db.prepare(`
        SELECT id, product_code, brand_name, generic_name, status
        FROM products
        WHERE LOWER(COALESCE(product_code, '')) LIKE ? 
           OR LOWER(COALESCE(brand_name, '')) LIKE ? 
           OR LOWER(COALESCE(generic_name, '')) LIKE ?
        LIMIT 5
      `).all(term, term, term);

      const doctors = db.prepare(`
        SELECT id, name, specialty, hospital, phone, is_active
        FROM doctors
        WHERE LOWER(COALESCE(name, '')) LIKE ? 
           OR LOWER(COALESCE(specialty, '')) LIKE ? 
           OR LOWER(COALESCE(hospital, '')) LIKE ?
        LIMIT 5
      `).all(term, term, term);

      const institutions = db.prepare(`
        SELECT id, name, type, code, is_active
        FROM institutions
        WHERE LOWER(COALESCE(name, '')) LIKE ? 
           OR LOWER(COALESCE(type, '')) LIKE ? 
           OR LOWER(COALESCE(code, '')) LIKE ?
        LIMIT 5
      `).all(term, term, term);

      const areas = db.prepare(`
        SELECT id, name, code, is_active
        FROM areas
        WHERE LOWER(COALESCE(name, '')) LIKE ? 
           OR LOWER(COALESCE(code, '')) LIKE ?
        LIMIT 5
      `).all(term, term);

      const teamMembers = db.prepare(`
        SELECT id, name, role, email, is_active
        FROM team_members
        WHERE LOWER(COALESCE(name, '')) LIKE ? 
           OR LOWER(COALESCE(role, '')) LIKE ? 
           OR LOWER(COALESCE(email, '')) LIKE ?
        LIMIT 5
      `).all(term, term, term);

      const orders = db.prepare(`
        SELECT o.id, o.order_number, o.order_date, o.status, o.total_amount,
               COALESCE(d.name, '') as doctor_name,
               COALESCE(i.name, '') as institution_name
        FROM orders o
        LEFT JOIN doctors d ON o.doctor_id = d.id
        LEFT JOIN institutions i ON o.institution_id = i.id
        WHERE LOWER(COALESCE(o.order_number, '')) LIKE ? 
           OR LOWER(COALESCE(d.name, '')) LIKE ? 
           OR LOWER(COALESCE(i.name, '')) LIKE ? 
           OR LOWER(COALESCE(o.status, '')) LIKE ?
        LIMIT 5
      `).all(term, term, term, term);

      return {
        products,
        doctors,
        institutions,
        areas,
        teamMembers,
        orders
      };
    } catch (err) {
      logger.error('Error in SearchService.globalSearch:', err);
      return {
        products: [],
        doctors: [],
        institutions: [],
        areas: [],
        teamMembers: [],
        orders: []
      };
    }
  }
}

module.exports = SearchService;
