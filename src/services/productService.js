const INITIAL_PRODUCTS = [
  { id: 1,  name: 'Amoxicillin 500mg',  category: 'Antibiotics',      packSizeQty: 10, packSizeUnit: 'Vials',    packSize: '10 Vials',    packPrice: 4500,  rate: 4500,  perUnitPrice: 450,  status: 'Active',   description: 'Broad-spectrum antibiotic for bacterial infections.' },
  { id: 2,  name: 'Paracetamol 650mg',  category: 'Analgesics',       packSizeQty: 20, packSizeUnit: 'Tablets',  packSize: '20 Tablets',  packPrice: 2400,  rate: 2400,  perUnitPrice: 120,  status: 'Active',   description: 'Pain reliever and fever reducer.' },
  { id: 3,  name: 'Metformin 850mg',    category: 'Antidiabetics',    packSizeQty: 30, packSizeUnit: 'Capsules', packSize: '30 Capsules', packPrice: 11400, rate: 11400, perUnitPrice: 380,  status: 'Active',   description: 'Oral diabetes medication.' },
  { id: 4,  name: 'Lipitor 10mg',       category: 'Cardiovascular',   packSizeQty: 10, packSizeUnit: 'Tablets',  packSize: '10 Tablets',  packPrice: 9500,  rate: 9500,  perUnitPrice: 950,  status: 'Active',   description: 'Cholesterol-lowering statin medication.' },
  { id: 5,  name: 'Ibuprofen 400mg',    category: 'Analgesics',       packSizeQty: 20, packSizeUnit: 'Tablets',  packSize: '20 Tablets',  packPrice: 1800,  rate: 1800,  perUnitPrice: 90,   status: 'Inactive', description: 'Anti-inflammatory pain relief.' },
  { id: 6,  name: 'Omeprazole 20mg',    category: 'Gastrointestinal', packSizeQty: 10, packSizeUnit: 'Capsules', packSize: '10 Capsules', packPrice: 5200,  rate: 5200,  perUnitPrice: 520,  status: 'Active',   description: 'Proton pump inhibitor for acid reflux.' },
  { id: 7,  name: 'Augmentin 625mg',    category: 'Antibiotics',      packSizeQty: 14, packSizeUnit: 'Tablets',  packSize: '14 Tablets',  packPrice: 15400, rate: 15400, perUnitPrice: 1100, status: 'Active',   description: 'Antibiotic combination for resistant infections.' },
  { id: 8,  name: 'Azithromycin 250mg', category: 'Antibiotics',      packSizeQty: 6,  packSizeUnit: 'Tablets',  packSize: '6 Tablets',   packPrice: 4020,  rate: 4020,  perUnitPrice: 670,  status: 'Active',   description: 'Macrolide antibiotic.' },
  { id: 9,  name: 'Ventolin Inhaler',   category: 'Respiratory',      packSizeQty: 1,  packSizeUnit: 'Inhalers', packSize: '1 Inhalers',  packPrice: 850,   rate: 850,   perUnitPrice: 850,  status: 'Inactive', description: 'Bronchodilator for asthma relief.' },
  { id: 10, name: 'Crestor 10mg',       category: 'Cardiovascular',   packSizeQty: 10, packSizeUnit: 'Tablets',  packSize: '10 Tablets',  packPrice: 13500, rate: 13500, perUnitPrice: 1350, status: 'Active',   description: 'Statin for lowering LDL cholesterol.' },
];

const normalizeProductsList = (rawProducts) => {
  return rawProducts.map(p => {
    if (p.code && !p.packSizeQty) {
      let qty = 10;
      let unitType = 'Tablets';
      if (p.name.toLowerCase().includes('amoxicillin')) { qty = 10; unitType = 'Vials'; }
      else if (p.name.toLowerCase().includes('paracetamol')) { qty = 20; unitType = 'Tablets'; }
      else if (p.name.toLowerCase().includes('metformin')) { qty = 30; unitType = 'Capsules'; }
      else if (p.name.toLowerCase().includes('omeprazole')) { qty = 10; unitType = 'Capsules'; }
      else if (p.name.toLowerCase().includes('augmentin')) { qty = 14; unitType = 'Tablets'; }
      else if (p.name.toLowerCase().includes('azithromycin')) { qty = 6; unitType = 'Tablets'; }
      else if (p.name.toLowerCase().includes('ventolin')) { qty = 1; unitType = 'Inhalers'; }
      else if (p.name.toLowerCase().includes('crestor')) { qty = 10; unitType = 'Tablets'; }
      else if (p.unit === 'Vial' || p.unit === 'Vials') { qty = 10; unitType = 'Vials'; }
      
      const packPrice = Number(p.rate) || 500;
      const perUnitPrice = Number((packPrice / qty).toFixed(2));
      
      return {
        id: p.id,
        name: p.name,
        category: p.category || 'Antibiotics',
        packSizeQty: qty,
        packSizeUnit: unitType,
        packSize: `${qty} ${unitType}`,
        packPrice: packPrice,
        rate: packPrice,
        perUnitPrice: perUnitPrice,
        status: p.status || 'Active',
        description: p.description || ''
      };
    }
    return p;
  });
};

export const productService = {
  getAllProducts: async () => {
    const saved = localStorage.getItem('products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeProductsList(parsed);
      } catch (e) {
        console.error('Failed to parse products', e);
      }
    }
    return INITIAL_PRODUCTS;
  },

  getProductById: async (id) => {
    const list = await productService.getAllProducts();
    return list.find(p => p.id === Number(id)) || null;
  },

  saveProductsList: async (products) => {
    localStorage.setItem('products', JSON.stringify(products));
    return products;
  },

  saveProduct: async (product) => {
    const list = await productService.getAllProducts();
    let newList;
    if (product.id) {
      newList = list.map(p => p.id === product.id ? product : p);
    } else {
      const maxId = list.length > 0 ? Math.max(...list.map(p => p.id)) : 0;
      const newProduct = {
        ...product,
        id: maxId + 1
      };
      newList = [newProduct, ...list];
    }
    localStorage.setItem('products', JSON.stringify(newList));
    return newList;
  },

  deleteProduct: async (id) => {
    const list = await productService.getAllProducts();
    const newList = list.filter(p => p.id !== Number(id));
    localStorage.setItem('products', JSON.stringify(newList));
    return newList;
  }
};
