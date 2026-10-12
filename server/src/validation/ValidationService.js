const ProductValidator = require('./validators/ProductValidator');
const DoctorValidator = require('./validators/DoctorValidator');
const InstitutionValidator = require('./validators/InstitutionValidator');
const AreaValidator = require('./validators/AreaValidator');
const TeamMemberValidator = require('./validators/TeamMemberValidator');
const OrderValidator = require('./validators/OrderValidator');
const TargetValidator = require('./validators/TargetValidator');
const logger = require('../logger');

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
  }

  // Text fields from forms. SQL injection is not a concern here (every query is parameterized) and
  // the web app escapes everything it displays; this rejects markup outright so stored data can
  // never carry a script into another tool (exports, e-mail, a future screen).
  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    const clean = str.trim().replace(/\s+/g, ' ');

    if (clean.length > 5000) {
      throw new Error('Validation Error: text is too long (5,000 characters at most).');
    }
    // HTML tags/comments and script-running URLs. Plain text such as "prescription" or "Union
    // Hospital" is fine (the old word filter rejected both).
    if (/<\s*[a-z!/?]/i.test(clean) || /\b(?:javascript|vbscript)\s*:/i.test(clean) || /\bdata\s*:\s*text\/html/i.test(clean)) {
      throw new Error('Validation Error: HTML or script content is not allowed.');
    }
    // Control and invisible characters
    if (/[\u0000-\u001F\u007F-\u009F­​-‏‪-‮]/g.test(clean)) {
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
      return obj.map((item) => this.sanitize(item));
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

  // The checks query the database, so they are async and must be awaited here.
  async validate(moduleName, ruleName, fn) {
    try {
      await fn();
      logger.debug(`Validation Success [${moduleName}]: Rule '${ruleName}' - Result: PASSED`);
    } catch (err) {
      logger.warn(`Validation Failure [${moduleName}]: Rule '${ruleName}' - Result: FAILED - Details: ${err.message}`);
      throw err;
    }
  }
}

module.exports = ValidationService;
