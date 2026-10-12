export const productService = {
  getAllProducts: async () => {
    const res = await window.api.products.getAll();
    if (res.success) return res.data.map((p) => ({ ...p, rate: p.packPrice }));
    throw new Error(res.error || 'Failed to fetch products');
  },

  getProductById: async (id) => {
    const res = await window.api.products.getById(id);
    if (res.success) return res.data ? { ...res.data, rate: res.data.packPrice } : null;
    throw new Error(res.error || 'Failed to fetch product');
  },

  saveProduct: async (product) => {
    const payload = {
      ...product,
      packPrice: product.packPrice || product.rate
    };
    const res = await window.api.products.save(payload);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return res.data;
    }
    throw new Error(res.error || 'Failed to save product');
  },

  deleteProduct: async (id) => {
    const res = await window.api.products.delete(id);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('himmel-db-change'));
      return productService.getAllProducts();
    }
    throw new Error(res.error || 'Failed to delete product');
  }
};
