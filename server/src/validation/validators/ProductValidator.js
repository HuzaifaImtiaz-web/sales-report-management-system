class ProductValidator {
  constructor(db) {
    this.db = db;
  }

  async validateSave(product) {
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
      const dupReg = product.id
        ? await this.db.get('SELECT id FROM products WHERE LOWER(registration_no) = ? AND id != ?', [regNo.toLowerCase(), product.id])
        : await this.db.get('SELECT id FROM products WHERE LOWER(registration_no) = ?', [regNo.toLowerCase()]);

      if (dupReg) {
        throw new Error('Registration Number must be unique.');
      }
    }

    // Check duplicate product_code
    const finalCode = (product.productCode || product.code || '').trim();
    if (finalCode) {
      const dupCode = product.id
        ? await this.db.get('SELECT id FROM products WHERE product_code = ? AND id != ?', [finalCode, product.id])
        : await this.db.get('SELECT id FROM products WHERE product_code = ?', [finalCode]);

      if (dupCode) {
        throw new Error('Product Code must be unique.');
      }
    }
  }

  async validateDelete(id) {
    if (!id) throw new Error('Product ID is required for deletion.');

    const counts = await this.db.get(`
      SELECT
        (SELECT COUNT(*) FROM order_items WHERE product_id = ?) AS orders,
        (SELECT COUNT(*) FROM product_targets WHERE product_id = ?) AS targets
    `, [id, id]);

    if (counts.orders > 0 || counts.targets > 0) {
      throw new Error('Product cannot be deleted because it is currently used in orders or targets.');
    }
  }
}

module.exports = ProductValidator;
