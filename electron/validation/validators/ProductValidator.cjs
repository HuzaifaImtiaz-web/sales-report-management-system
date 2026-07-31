const logger = require('../../logger.cjs');

class ProductValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(product) {
    if (!product || typeof product !== 'object') {
      throw new Error('Invalid product data provided.');
    }

    const brandName = (product.brandName || product.name || '').trim();
    if (!brandName) {
      throw new Error('Product Name cannot be empty.');
    }

    const productCode = (product.productCode || product.code || '').trim();
    if (!productCode) {
      const generated = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
      product.productCode = generated;
      product.code = generated;
    }

    // Check duplicate registration_no if provided
    const regNo = (product.registrationNo || product.registration_no || '').trim();
    if (regNo) {
      const duplicateRegQuery = product.id
        ? this.db.prepare('SELECT id FROM products WHERE LOWER(registration_no) = ? AND id != ?')
        : this.db.prepare('SELECT id FROM products WHERE LOWER(registration_no) = ?');
      
      const dupReg = product.id 
        ? duplicateRegQuery.get(regNo.toLowerCase(), product.id) 
        : duplicateRegQuery.get(regNo.toLowerCase());
        
      if (dupReg) {
        throw new Error('Registration Number must be unique.');
      }
    }

    // Check duplicate product_code
    const finalCode = (product.productCode || product.code || '').trim();
    if (finalCode) {
      const duplicateCodeQuery = product.id
        ? this.db.prepare('SELECT id FROM products WHERE product_code = ? AND id != ?')
        : this.db.prepare('SELECT id FROM products WHERE product_code = ?');
      
      const dupCode = product.id 
        ? duplicateCodeQuery.get(finalCode, product.id) 
        : duplicateCodeQuery.get(finalCode);

      if (dupCode) {
        throw new Error('Product Code must be unique.');
      }
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
