import { productService } from './productService';
import { doctorService } from './doctorService';
import { institutionService } from './institutionService';
import { areaService } from './areaService';
import { teamMemberService } from './teamMemberService';
import { orderService } from './orderService';

export const searchService = {
  globalSearch: async (query) => {
    if (!query || query.trim().length === 0) {
      return {
        products: [],
        doctors: [],
        institutions: [],
        areas: [],
        teamMembers: [],
        orders: []
      };
    }

    if (window.api && window.api.search && window.api.search.global) {
      const res = await window.api.search.global(query);
      if (res.success) return res.data;
    }

    // Client-side fallback search
    const q = query.toLowerCase().trim();

    const [prods, docs, insts, areas, team, orders] = await Promise.all([
      productService.getAllProducts().catch(() => []),
      doctorService.getAllDoctors().catch(() => []),
      institutionService.getAllInstitutions().catch(() => []),
      areaService.getAllAreas().catch(() => []),
      teamMemberService.getAllTeamMembers().catch(() => []),
      orderService.getAllOrders().catch(() => [])
    ]);

    const filteredProds = (prods || [])
      .filter(p => (p.brandName || p.name || '').toLowerCase().includes(q) || (p.productCode || p.code || '').toLowerCase().includes(q) || (p.genericName || '').toLowerCase().includes(q))
      .slice(0, 5);

    const filteredDocs = (docs || [])
      .filter(d => (d.name || '').toLowerCase().includes(q) || (d.specialization || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q))
      .slice(0, 5);

    const filteredInsts = (insts || [])
      .filter(i => (i.name || '').toLowerCase().includes(q) || (i.type || '').toLowerCase().includes(q) || (i.code || '').toLowerCase().includes(q))
      .slice(0, 5);

    const filteredAreas = (areas || [])
      .filter(a => (a.name || '').toLowerCase().includes(q) || (a.code || '').toLowerCase().includes(q))
      .slice(0, 5);

    const filteredTeam = (team || [])
      .filter(t => (t.name || '').toLowerCase().includes(q) || (t.role || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q))
      .slice(0, 5);

    const filteredOrders = (orders || [])
      .filter(o => (o.poNumber || o.orderNumber || '').toLowerCase().includes(q) || (o.doctor || o.doctorName || '').toLowerCase().includes(q) || (o.institution || o.institutionName || '').toLowerCase().includes(q) || (o.status || '').toLowerCase().includes(q))
      .slice(0, 5);

    return {
      products: filteredProds,
      doctors: filteredDocs,
      institutions: filteredInsts,
      areas: filteredAreas,
      teamMembers: filteredTeam,
      orders: filteredOrders
    };
  }
};

export default searchService;
