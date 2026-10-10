const ORDER_SELECT = `
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
`;

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

  _mapItem(item) {
    return {
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price
    };
  }

  async findAll() {
    const rows = await this.db.all(`${ORDER_SELECT} ORDER BY o.order_date DESC, o.order_number DESC`);

    const items = await this.db.all(`
      SELECT oi.*, p.brand_name AS product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      ORDER BY oi.id ASC
    `);

    const itemsByOrderId = {};
    items.forEach((item) => {
      if (!itemsByOrderId[item.order_id]) {
        itemsByOrderId[item.order_id] = [];
      }
      itemsByOrderId[item.order_id].push(this._mapItem(item));
    });

    return rows.map((r) => this._mapRow(r, itemsByOrderId[r.id] || []));
  }

  async findById(id) {
    const row = await this.db.get(`${ORDER_SELECT} WHERE o.id = ?`, [id]);
    if (!row) return null;

    const items = await this.db.all(`
      SELECT oi.*, p.brand_name AS product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [id]);

    return this._mapRow(row, items.map((item) => this._mapItem(item)));
  }

  async _resolveAreaId(o) {
    if (o.areaId) return o.areaId;
    if (o.teamMemberId) {
      const tm = await this.db.get('SELECT area_id FROM team_members WHERE id = ?', [o.teamMemberId]);
      if (tm && tm.area_id) return tm.area_id;
    }
    const firstArea = await this.db.get('SELECT id FROM areas ORDER BY id ASC LIMIT 1');
    if (firstArea) return firstArea.id;
    throw new Error('Order must be associated with an Area.');
  }

  async _insertItems(tx, orderId, items) {
    if (!items || !Array.isArray(items)) return;
    for (const item of items) {
      const qty = item.quantity || item.qty || 1;
      const rate = item.unitPrice || item.rate || 0;
      await tx.run(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, qty, rate, qty * rate]
      );
    }
  }

  async create(o, currentUser = 'Admin') {
    const orderNumber = o.orderNumber || o.poNumber;
    const orderDate = o.orderDate || o.poDate;
    const items = o.items || o.products || [];
    const areaId = await this._resolveAreaId(o);
    const status = o.status || 'Pending';
    const createdBy = o.createdBy || currentUser;
    const submittedAt = new Date().toISOString();

    const orderId = await this.db.transaction(async (tx) => {
      const row = await tx.get(`
        INSERT INTO orders (order_number, order_date, team_member_id, doctor_id, institution_id, area_id, status, remarks, created_by, submitted_at, import_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `, [
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
      ]);
      await this._insertItems(tx, row.id, items);
      return row.id;
    });

    return this.findById(orderId);
  }

  async update(id, o) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Order not found.');
    }
    if (existing.status === 'Completed') {
      throw new Error('Completed sales cannot be edited because they are finalized.');
    }
    const orderNumber = o.orderNumber || o.poNumber;
    const orderDate = o.orderDate || o.poDate;
    const items = o.items || o.products || [];
    const areaId = await this._resolveAreaId(o);

    await this.db.transaction(async (tx) => {
      await tx.run(`
        UPDATE orders
        SET order_number = ?, order_date = ?, team_member_id = ?, doctor_id = ?, institution_id = ?, area_id = ?, status = ?, remarks = ?, import_id = ?
        WHERE id = ?
      `, [
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
      ]);

      // Delete old items and insert new ones
      await tx.run('DELETE FROM order_items WHERE order_id = ?', [id]);
      await this._insertItems(tx, id, items);
    });

    return this.findById(id);
  }

  async changeStatus(id, newStatus, reason = null, username = 'Admin') {
    const validStatuses = ['Pending', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: '${newStatus}'. Allowed statuses are Pending, Completed, Cancelled.`);
    }

    const nowIso = new Date().toISOString();

    switch (newStatus) {
      case 'Pending':
        await this.db.run(
          `UPDATE orders SET status = 'Pending', submitted_at = COALESCE(submitted_at, ?) WHERE id = ?`,
          [nowIso, id]
        );
        break;

      case 'Completed':
        await this.db.run(
          `UPDATE orders SET status = 'Completed', completed_by = ?, completed_at = ? WHERE id = ?`,
          [username, nowIso, id]
        );
        break;

      case 'Cancelled':
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
          throw new Error('A valid cancellation reason is required.');
        }
        await this.db.run(
          `UPDATE orders SET status = 'Cancelled', cancelled_by = ?, cancelled_at = ?, cancel_reason = ? WHERE id = ?`,
          [username, nowIso, reason.trim(), id]
        );
        break;

      default:
        throw new Error(`Unsupported status: ${newStatus}`);
    }

    return this.findById(id);
  }

  async delete(id) {
    const order = await this.findById(id);
    if (!order) return false;
    if (order.status === 'Completed') {
      throw new Error('Completed orders cannot be deleted because they affect financial reports and audit trails.');
    }
    const res = await this.db.run('DELETE FROM orders WHERE id = ?', [id]);
    return res.changes > 0;
  }
}

module.exports = OrderRepository;
