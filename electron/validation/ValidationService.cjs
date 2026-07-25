const ProductValidator = require('./validators/ProductValidator.cjs');
const DoctorValidator = require('./validators/DoctorValidator.cjs');
const InstitutionValidator = require('./validators/InstitutionValidator.cjs');
const AreaValidator = require('./validators/AreaValidator.cjs');
const TeamMemberValidator = require('./validators/TeamMemberValidator.cjs');
const OrderValidator = require('./validators/OrderValidator.cjs');
const TargetValidator = require('./validators/TargetValidator.cjs');
const BusinessYearValidator = require('./validators/BusinessYearValidator.cjs');
const logger = require('../logger.cjs');

class ValidationService {
  constructor(db) {
    this.db = db;
    this.product = new ProductValidator(db);
    this.doctor = new DoctorValidator(db);
    this.institution = new InstitutionValidator(db);
    this.area = new AreaValidator(db);
    this.teamMember = new TeamMemberValidator(db);
    this.order = new OrderValidator(db);
    this.target = new TargetValidator(db);
    this.businessYear = new BusinessYearValidator(db);
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    let clean = str.trim().replace(/\s+/g, ' ');
    
    // HTML/Script tags
    if (/<[^>]*>|javascript:|script/i.test(clean)) {
      throw new Error('Validation Error: HTML or Script injection detected.');
    }
    // SQL Injection patterns
    if (/(\bUNION\b|\bSELECT\b|\bDROP\s+TABLE\b|\bDELETE\s+FROM\b|'--|--)/i.test(clean)) {
      throw new Error('Validation Error: SQL Injection attempt detected.');
    }
    // Control and invisible characters
    if (/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u202A-\u202E]/g.test(clean)) {
      throw new Error('Validation Error: Invisible characters or control characters detected.');
    }
    return clean;
  }

  sanitize(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = this.sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  }

  validate(moduleName, ruleName, fn) {
    try {
      fn();
      logger.info(`Validation Success [${moduleName}]: Rule '${ruleName}' - Result: PASSED`);
    } catch (err) {
      logger.error(`Validation Failure [${moduleName}]: Rule '${ruleName}' - Result: FAILED - Details: ${err.message}`);
      throw err;
    }
  }
}

module.exports = ValidationService;
