const logger = require('../../logger.cjs');

class ProductValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(product) {
    const brandName = product.brandName || product.name;
    const productCode = product.productCode || product.code;
    const packSize = product.packSize !== undefined ? product.packSize : product.packSizeQty;
    const tp = product.tp !== undefined ? product.tp : product.packPrice;
    const mrp = product.mrp !== undefined ? product.mrp : tp;
    const division = product.division || product.divisionName || product.category;
    const groupName = product.groupName || product.category;
    const genericName = product.genericName || product.generic_name;

    if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
      throw new Error('Brand Name/Product Name cannot be empty.');
    }

    if (!genericName || typeof genericName !== 'string' || genericName.trim().length === 0) {
      throw new Error('Generic Name cannot be empty.');
    }

    if (!productCode || typeof productCode !== 'string' || productCode.trim().length === 0) {
      const generated = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
      product.productCode = generated;
      product.code = generated;
    }

    const qty = Number(packSize);
    if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      throw new Error('Pack Size must be a positive integer (greater than 0, no decimals).');
    }

    const tpVal = Number(tp);
    if (isNaN(tpVal) || tpVal < 0) {
      throw new Error('Trade Price (TP) cannot be negative.');
    }

    const mrpVal = Number(mrp);
    if (isNaN(mrpVal) || mrpVal < 0) {
      throw new Error('Maximum Retail Price (MRP) cannot be negative.');
    }

    if (mrpVal < tpVal) {
      throw new Error('MRP cannot be less than Trade Price (TP).');
    }

    if (!division || typeof division !== 'string' || !['Himmel', 'PMS', 'MSA'].includes(division.trim())) {
      throw new Error('Division is required and must be either Himmel, PMS, or MSA.');
    }

    if (!groupName || typeof groupName !== 'string' || groupName.trim().length === 0) {
      throw new Error('Product Group is required.');
    }

    // Check duplicate registration_no
    const regNo = product.registrationNo || product.registration_no;
    if (regNo && typeof regNo === 'string' && regNo.trim().length > 0) {
      const duplicateRegQuery = product.id
        ? this.db.prepare('SELECT id FROM products WHERE LOWER(registration_no) = ? AND id != ?')
        : this.db.prepare('SELECT id FROM products WHERE LOWER(registration_no) = ?');
      
      const dupReg = product.id 
        ? duplicateRegQuery.get(regNo.trim().toLowerCase(), product.id) 
        : duplicateRegQuery.get(regNo.trim().toLowerCase());
        
      if (dupReg) {
        throw new Error('Registration Number must be unique.');
      }
    }

    // Check duplicate code
    const duplicateCodeQuery = product.id
      ? this.db.prepare('SELECT id FROM products WHERE product_code = ? AND id != ?')
      : this.db.prepare('SELECT id FROM products WHERE product_code = ?');
    
    const dupCode = product.id ? duplicateCodeQuery.get(productCode.trim(), product.id) : duplicateCodeQuery.get(productCode.trim());
    if (dupCode) {
      throw new Error('Product Code must be unique.');
    }
  }

  validateDelete(id) {
    if (!id) throw new Error('Product ID is required for deletion.');

    // Check if referenced by order_items
    const orderCount = this.db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id).count;
    // Check if referenced by product_targets
    const targetCount = this.db.prepare('SELECT COUNT(*) as count FROM product_targets WHERE product_id = ?').get(id).count;

    if (orderCount > 0 || targetCount > 0) {
      throw new Error('Product cannot be deleted because it is currently used in orders or targets.');
    }
  }
}

module.exports = ProductValidator;
