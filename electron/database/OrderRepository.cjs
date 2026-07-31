const logger = require('../logger.cjs');

class OrderRepository {
  constructor(db) {
    this.db = db;
  }

  _mapRow(row, items = []) {
    if (!row) return null;
    return {
      id: row.id,
      poNumber: row.order_number,
      orderNumber: row.order_number,
      poDate: row.order_date,
      orderDate: row.order_date,
      teamMemberId: row.team_member_id,
      teamMemberName: row.team_member_name || '',
      doctorId: row.doctor_id || null,
      doctorName: row.doctor_name || '',
      institutionId: row.institution_id || null,
      institutionName: row.institution_name || '',
      areaId: row.area_id,
      areaName: row.area_name || '',
      totalAmount: row.total_amount,
      status: row.status,
      remarks: row.remarks || '',
      createdBy: row.created_by || 'Admin',
      submittedAt: row.submitted_at || null,
      approvedBy: row.approved_by || null,
      approvedAt: row.approved_at || null,
      completedBy: row.completed_by || null,
      completedAt: row.completed_at || null,
      cancelledBy: row.cancelled_by || null,
      cancelledAt: row.cancelled_at || null,
      cancelReason: row.cancel_reason || null,
      createdAt: row.created_at,
      importId: row.import_id || null,
      items: items,
      products: items
    };
  }

  findAll() {
    logger.info('SQL Trace: SELECT o.* FROM orders...');
    const rows = this.db.prepare(`
      SELECT o.*, 
             tm.name AS team_member_name, 
             d.name AS doctor_name, 
             i.name AS institution_name, 
             a.name AS area_name
      FROM orders o
      JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions i ON o.institution_id = i.id
      JOIN areas a ON o.area_id = a.id
      ORDER BY o.order_date DESC, o.order_number DESC
    `).all();

    // Fetch all order items and group them
    const items = this.db.prepare(`
      SELECT oi.*, p.brand_name AS product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
    `).all();

    const itemsByOrderId = {};
    items.forEach(item => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      });
    });

    return rows.map(r => this._mapRow(r, itemsByOrderId[r.id] || []));
  }

  findById(id) {
    logger.info(`SQL Trace: SELECT o.* FROM orders WHERE id = ${id}`);
    const row = this.db.prepare(`
      SELECT o.*, 
             tm.name AS team_member_name, 
             d.name AS doctor_name, 
             i.name AS institution_name, 
             a.name AS area_name
      FROM orders o
      JOIN team_members tm ON o.team_member_id = tm.id
      LEFT JOIN doctors d ON o.doctor_id = d.id
      LEFT JOIN institutions i ON o.institution_id = i.id
      JOIN areas a ON o.area_id = a.id
      WHERE o.id = ?
    `).get(id);

    if (!row) return null;

    const items = this.db.prepare(`
      SELECT oi.*, p.brand_name AS product_name 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    const mappedItems = items.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price
    }));

    return this._mapRow(row, mappedItems);
  }

  _resolveAreaId(o) {
    if (o.areaId) return o.areaId;
    if (o.teamMemberId) {
      const tm = this.db.prepare('SELECT area_id FROM team_members WHERE id = ?').get(o.teamMemberId);
      if (tm && tm.area_id) return tm.area_id;
    }
    const firstArea = this.db.prepare('SELECT id FROM areas LIMIT 1').get();
    if (firstArea) return firstArea.id;
    throw new Error('Order must be associated with an Area.');
  }

  create(o, currentUser = 'Admin') {
    const orderNumber = o.orderNumber || o.poNumber;
    const orderDate = o.orderDate || o.poDate;
    const items = o.items || o.products || [];
    logger.info(`SQL Trace: Creating order ${orderNumber}`);
    const areaId = this._resolveAreaId(o);
    const status = o.status || 'Pending';
    const createdBy = o.createdBy || currentUser;
    const submittedAt = new Date().toISOString();

    const stmtOrder = this.db.prepare(`
      INSERT INTO orders (order_number, order_date, team_member_id, doctor_id, institution_id, area_id, status, remarks, created_by, submitted_at, import_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const stmtItem = this.db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    let orderId;
    this.db.transaction(() => {
      const res = stmtOrder.run(
        orderNumber,
        orderDate,
        o.teamMemberId,
        o.doctorId || null,
        o.institutionId || null,
        areaId,
        status,
        o.remarks || null,
        createdBy,
        submittedAt,
        o.importId || null
      );
      orderId = res.lastInsertRowid;
      
      if (items && Array.isArray(items)) {
        items.forEach(item => {
          const qty = item.quantity || item.qty || 1;
          const rate = item.unitPrice || item.rate || 0;
          stmtItem.run(
            orderId,
            item.productId,
            qty,
            rate,
            qty * rate
          );
        });
      }
    })();

    return this.findById(orderId);
  }

  update(id, o) {
    logger.info(`SQL Trace: Updating order id = ${id}`);
    const existing = this.findById(id);
    if (!existing) {
      throw new Error('Order not found.');
    }
    if (existing.status === 'Completed') {
      throw new Error('Completed sales cannot be edited because they are finalized.');
    }
    const orderNumber = o.orderNumber || o.poNumber;
    const orderDate = o.orderDate || o.poDate;
    const items = o.items || o.products || [];
    const areaId = this._resolveAreaId(o);
    
    this.db.transaction(() => {
      this.db.prepare(`
        UPDATE orders 
        SET order_number = ?, order_date = ?, team_member_id = ?, doctor_id = ?, institution_id = ?, area_id = ?, status = ?, remarks = ?, import_id = ?
        WHERE id = ?
      `).run(
        orderNumber,
        orderDate,
        o.teamMemberId,
        o.doctorId || null,
        o.institutionId || null,
        areaId,
        o.status || 'Pending',
        o.remarks || null,
        o.importId || null,
        id
      );
      
      // Delete old items and insert new ones
      this.db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
      
      if (items && Array.isArray(items)) {
        const stmtItem = this.db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?)
        `);
        items.forEach(item => {
          const qty = item.quantity || item.qty || 1;
          const rate = item.unitPrice || item.rate || 0;
          stmtItem.run(
            id,
            item.productId,
            qty,
            rate,
            qty * rate
          );
        });
      }
    })();

    return this.findById(id);
  }

  changeStatus(id, newStatus, reason = null, username = 'Admin') {
    logger.info(`SQL Trace: Transitioning order id = ${id} to status = ${newStatus}`);
    const validStatuses = ['Pending', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: '${newStatus}'. Allowed statuses are Pending, Completed, Cancelled.`);
    }

    const nowIso = new Date().toISOString();
    let stmt;

    switch (newStatus) {
      case 'Pending':
        stmt = this.db.prepare(`
          UPDATE orders 
          SET status = 'Pending', submitted_at = COALESCE(submitted_at, ?) 
          WHERE id = ?
        `);
        stmt.run(nowIso, id);
        break;

      case 'Completed':
        stmt = this.db.prepare(`
          UPDATE orders 
          SET status = 'Completed', completed_by = ?, completed_at = ? 
          WHERE id = ?
        `);
        stmt.run(username, nowIso, id);
        break;

      case 'Cancelled':
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
          throw new Error('A valid cancellation reason is required.');
        }
        stmt = this.db.prepare(`
          UPDATE orders 
          SET status = 'Cancelled', cancelled_by = ?, cancelled_at = ?, cancel_reason = ? 
          WHERE id = ?
        `);
        stmt.run(username, nowIso, reason.trim(), id);
        break;

      default:
        throw new Error(`Unsupported status: ${newStatus}`);
    }

    return this.findById(id);
  }

  delete(id) {
    logger.info(`SQL Trace: DELETE FROM orders WHERE id = ${id}`);
    const order = this.findById(id);
    if (!order) return false;
    if (order.status === 'Completed') {
      throw new Error('Completed orders cannot be deleted because they affect financial reports and audit trails.');
    }
    const stmt = this.db.prepare('DELETE FROM orders WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

module.exports = OrderRepository;
