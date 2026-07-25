const logger = require('../../logger.cjs');

class OrderValidator {
  constructor(db) {
    this.db = db;
  }

  validateSave(order, currentRole = 'Admin') {
    const { id, orderNumber, orderDate, teamMemberId, items } = order;

    if (id) {
      const existing = this.db.prepare('SELECT status FROM orders WHERE id = ?').get(id);
      if (existing && (existing.status === 'Completed' || existing.status === 'Cancelled')) {
        throw new Error(`Orders in '${existing.status}' status are read-only and cannot be modified.`);
      }
    }

    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim().length === 0) {
      throw new Error('PO Number is required.');
    }

    if (!orderDate || typeof orderDate !== 'string' || orderDate.trim().length === 0) {
      throw new Error('Order Date is required.');
    }

    if (!teamMemberId) {
      throw new Error('Team Member is required.');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Order must contain at least one product.');
    }

    // Check duplicate PO Number
    const duplicateQuery = id
      ? this.db.prepare('SELECT id FROM orders WHERE order_number = ? AND id != ?')
      : this.db.prepare('SELECT id FROM orders WHERE order_number = ?');

    const dup = id 
      ? duplicateQuery.get(orderNumber.trim(), id)
      : duplicateQuery.get(orderNumber.trim());

    if (dup) {
      throw new Error('PO Number already exists.');
    }

    // Verify Order Date belongs to active Business Year
    const activeYear = this.db.prepare('SELECT id, year_name, start_date, end_date FROM business_years WHERE is_active = 1').get();
    if (!activeYear) {
      throw new Error('No active Business Year exists.');
    }

    const orderTime = new Date(orderDate).getTime();
    const startTime = new Date(activeYear.start_date).getTime();
    const endTime = new Date(activeYear.end_date).getTime();

    if (isNaN(orderTime)) {
      throw new Error('Invalid Order Date format.');
    }

    if (orderTime < startTime || orderTime > endTime) {
      throw new Error(`Order Date must belong to active Business Year: ${activeYear.year_name} (${activeYear.start_date} to ${activeYear.end_date}).`);
    }

    // Validate Items
    items.forEach((item, idx) => {
      if (!item.productId) {
        throw new Error(`Product is required for item at row ${idx + 1}.`);
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`Quantity must be a positive integer at row ${idx + 1}.`);
      }

      const price = Number(item.unitPrice);
      if (isNaN(price) || price < 0) {
        throw new Error(`Unit Price cannot be negative at row ${idx + 1}.`);
      }

      // Check product is active
      const product = this.db.prepare('SELECT id, is_active FROM products WHERE id = ?').get(item.productId);
      if (!product) {
        throw new Error(`Product at row ${idx + 1} does not exist.`);
      }
      if (product.is_active === 0) {
        throw new Error(`Product '${item.productName || item.productId}' is inactive and cannot be ordered.`);
      }
    });
  }

  validateStatusTransition(currentStatus, newStatus, currentRole = 'Admin', reason = '') {
    if (currentStatus === newStatus) return;

    // Block transitions out of terminal states
    if (currentStatus === 'Completed') {
      throw new Error('Completed orders are finalized and cannot transition to any other status.');
    }
    if (currentStatus === 'Cancelled') {
      throw new Error('Cancelled orders cannot transition to any other status.');
    }

    // Valid state transitions for simplified single-user workflow
    const validTransitions = {
      Pending: ['Completed', 'Cancelled']
    };

    const allowedNext = validTransitions[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'.`);
    }

    if (newStatus === 'Cancelled' && (!reason || typeof reason !== 'string' || reason.trim().length === 0)) {
      throw new Error('A cancellation reason must be provided when cancelling an order.');
    }
  }

  validateDelete(id, currentRole = 'Admin') {
    if (!id) throw new Error('Order ID is required for deletion.');
    
    const order = this.db.prepare('SELECT status FROM orders WHERE id = ?').get(id);
    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status === 'Completed') {
      throw new Error('Completed orders cannot be deleted because they affect financial reports and audit trails.');
    }
  }
}

module.exports = OrderValidator;

