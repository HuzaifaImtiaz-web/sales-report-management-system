const INITIAL_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-2026-0901',
    poDate: '2026-07-12',
    institution: 'Mayo Hospital',
    doctor: 'Dr. Ayesha Khan',
    area: 'Lahore Central',
    teamMember: 'Ahmed Shah',
    products: [
      { name: 'Amoxicillin 500mg', qty: 50, rate: 450 },
      { name: 'Paracetamol 650mg', qty: 100, rate: 120 }
    ],
    totalQty: 150,
    totalAmount: 34500,
    status: 'Pending',
    remarks: 'Urgent delivery required before 15 Jul.'
  },
  {
    id: 2,
    poNumber: 'PO-2026-0902',
    poDate: '2026-07-12',
    institution: 'Jinnah Hospital',
    doctor: 'Dr. Hamid Raza',
    area: 'Karachi South',
    teamMember: 'Zainab Fatima',
    products: [
      { name: 'Metformin 850mg', qty: 200, rate: 380 },
      { name: 'Lipitor 10mg', qty: 60, rate: 950 }
    ],
    totalQty: 260,
    totalAmount: 133000,
    status: 'Pending',
    remarks: 'Deliver to clinic annex, not main entrance.'
  },
  {
    id: 3,
    poNumber: 'PO-2026-0903',
    poDate: '2026-07-11',
    institution: 'Shifa International',
    doctor: 'Dr. Nadia Siddiqui',
    area: 'Islamabad F-10',
    teamMember: 'Usman Ali',
    products: [
      { name: 'Ibuprofen 400mg', qty: 80, rate: 90 },
      { name: 'Omeprazole 20mg', qty: 120, rate: 520 },
      { name: 'Crestor 10mg', qty: 40, rate: 1350 }
    ],
    totalQty: 240,
    totalAmount: 123600,
    status: 'Completed',
    remarks: 'Morning delivery preferred.'
  }
];

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
    if (window.api && window.api.orders) {
      const res = await window.api.orders.getAll();
      if (res.success) return res.data.map(mapToFrontend);
      throw new Error(res.error || 'Failed to fetch orders');
    }
    const saved = localStorage.getItem('himmel_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse orders', e);
      }
    }
    return INITIAL_ORDERS;
  },

  getOrderById: async (id) => {
    if (window.api && window.api.orders) {
      const res = await window.api.orders.getById(id);
      if (res.success) return mapToFrontend(res.data);
      throw new Error(res.error || 'Failed to fetch order');
    }
    const list = await orderService.getAllOrders();
    return list.find(o => o.id === Number(id)) || null;
  },

  saveOrdersList: async (orders) => {
    if (window.api && window.api.orders) {
      throw new Error('Bulk list save not supported over IPC');
    }
    localStorage.setItem('himmel_orders', JSON.stringify(orders));
    return orders;
  },

  saveOrder: async (order) => {
    if (window.api && window.api.orders) {
      const payload = mapToBackend(order);
      const res = await window.api.orders.save(payload);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return mapToFrontend(res.data);
      }
      throw new Error(res.error || 'Failed to save order');
    }
    const list = await orderService.getAllOrders();
    let newList;
    if (order.id) {
      newList = list.map(o => o.id === order.id ? order : o);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(o => o.id)) : 0;
      const newOrder = {
        ...order,
        id: maxId + 1
      };
      newList = [newOrder, ...list];
    }
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return newList;
  },

  changeOrderStatus: async (id, newStatus, reason = '') => {
    if (window.api && window.api.orders && window.api.orders.changeStatus) {
      const res = await window.api.orders.changeStatus(id, newStatus, reason);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return mapToFrontend(res.data);
      }
      throw new Error(res.error || `Failed to transition status to ${newStatus}`);
    }
    const list = await orderService.getAllOrders();
    const target = list.find(o => o.id === Number(id));
    if (target) {
      target.status = newStatus;
      if (reason) target.cancelReason = reason;
      localStorage.setItem('himmel_orders', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return target;
    }
    throw new Error('Order not found');
  },

  addOrder: async (order) => {
    if (window.api && window.api.orders) {
      const payload = mapToBackend(order);
      const res = await window.api.orders.save(payload);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return mapToFrontend(res.data);
      }
      throw new Error(res.error || 'Failed to add order');
    }
    const list = await orderService.getAllOrders();
    const maxId = list.length > 0 ? Math.max(...list.map(o => o.id)) : 0;
    const newOrder = {
      ...order,
      id: maxId + 1
    };
    const newList = [newOrder, ...list];
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return newOrder;
  },

  deleteOrder: async (id) => {
    if (window.api && window.api.orders) {
      const res = await window.api.orders.delete(id);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('himmel-db-change'));
        return orderService.getAllOrders();
      }
      throw new Error(res.error || 'Failed to delete order');
    }
    const list = await orderService.getAllOrders();
    const newList = list.filter(o => o.id !== Number(id));
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
    window.dispatchEvent(new CustomEvent('himmel-db-change'));
    return newList;
  }
};
