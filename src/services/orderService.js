const mapToFrontend = (o) => {
  if (!o) return null;
  const products = (o.items || []).map(item => ({
    productId: item.productId,
    name: item.productName,
    qty: item.quantity,
    rate: item.unitPrice
  }));
  const totalQty = products.reduce((acc, p) => acc + p.qty, 0);

  return {
    id: o.id,
    poNumber: o.orderNumber,
    poDate: o.orderDate,
    institutionId: o.institutionId,
    institution: o.institutionName,
    doctorId: o.doctorId,
    doctor: o.doctorName,
    areaId: o.areaId,
    area: o.areaName,
    teamMemberId: o.teamMemberId,
    teamMember: o.teamMemberName,
    products: products,
    totalQty: totalQty,
    totalAmount: o.totalAmount,
    status: o.status,
    createdBy: o.createdBy || 'Admin',
    submittedAt: o.submittedAt || null,
    approvedBy: o.approvedBy || null,
    approvedAt: o.approvedAt || null,
    completedBy: o.completedBy || null,
    completedAt: o.completedAt || null,
    cancelledBy: o.cancelledBy || null,
    cancelledAt: o.cancelledAt || null,
    cancelReason: o.cancelReason || null,
    createdAt: o.createdAt || null,
    remarks: o.remarks || ''
  };
};

const mapToBackend = (order) => {
  const items = (order.products || []).map(p => ({
    productId: p.productId,
    quantity: p.qty,
    unitPrice: p.rate,
    totalPrice: p.qty * p.rate
  }));

  return {
    id: order.id,
    orderNumber: order.poNumber,
    orderDate: order.poDate,
    teamMemberId: order.teamMemberId,
    doctorId: order.doctorId,
    institutionId: order.institutionId,
    areaId: order.areaId,
    status: order.status || 'Pending',
    createdBy: order.createdBy,
    remarks: order.remarks,
    items: items
  };
};

export const orderService = {
  getAllOrders: async () => {
    const res = await window.api.orders.getAll();
    if (res.success) return res.data.map(mapToFrontend);
    throw new Error(res.error || 'Failed to fetch orders');
  },

  getOrderById: async (id) => {
    const res = await window.api.orders.getById(id);
    if (res.success) return mapToFrontend(res.data);
    throw new Error(res.error || 'Failed to fetch order');
  },

  saveOrder: async (order) => {
    const res = await window.api.orders.save(mapToBackend(order));
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return mapToFrontend(res.data);
    }
    throw new Error(res.error || 'Failed to save order');
  },

  changeOrderStatus: async (id, newStatus, reason = '') => {
    const res = await window.api.orders.changeStatus(id, newStatus, reason);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return mapToFrontend(res.data);
    }
    throw new Error(res.error || `Failed to transition status to ${newStatus}`);
  },

  addOrder: async (order) => {
    const res = await window.api.orders.save(mapToBackend(order));
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return mapToFrontend(res.data);
    }
    throw new Error(res.error || 'Failed to add order');
  },

  deleteOrder: async (id) => {
    const res = await window.api.orders.delete(id);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return orderService.getAllOrders();
    }
    throw new Error(res.error || 'Failed to delete order');
  }
};
