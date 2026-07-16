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

export const orderService = {
  getAllOrders: async () => {
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
    const list = await orderService.getAllOrders();
    return list.find(o => o.id === Number(id)) || null;
  },

  saveOrdersList: async (orders) => {
    localStorage.setItem('himmel_orders', JSON.stringify(orders));
    return orders;
  },

  saveOrder: async (order) => {
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
    return newList;
  },

  addOrder: async (order) => {
    // Inserts at the top
    const list = await orderService.getAllOrders();
    const maxId = list.length > 0 ? Math.max(...list.map(o => o.id)) : 0;
    const newOrder = {
      ...order,
      id: maxId + 1
    };
    const newList = [newOrder, ...list];
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
    return newOrder;
  },

  deleteOrder: async (id) => {
    const list = await orderService.getAllOrders();
    const newList = list.filter(o => o.id !== Number(id));
    localStorage.setItem('himmel_orders', JSON.stringify(newList));
    return newList;
  }
};
