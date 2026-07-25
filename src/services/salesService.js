import { orderService } from './orderService';

export const salesService = {
  getAllSales: async () => {
    return orderService.getAllOrders();
  },

  getSaleById: async (id) => {
    return orderService.getOrderById(id);
  },

  saveSale: async (saleData) => {
    return orderService.saveOrder(saleData);
  },

  addSale: async (saleData) => {
    return orderService.addOrder(saleData);
  },

  changeStatus: async (id, newStatus, reason = '') => {
    return orderService.changeOrderStatus(id, newStatus, reason);
  },

  deleteSale: async (id) => {
    return orderService.deleteOrder(id);
  }
};

export default salesService;
