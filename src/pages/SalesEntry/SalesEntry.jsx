import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { FiPlus, FiTrash2, FiSave, FiShoppingBag } from 'react-icons/fi';
import { productService } from '../../services/productService';
import { doctorService } from '../../services/doctorService';
import { institutionService } from '../../services/institutionService';
import { areaService } from '../../services/areaService';
import { teamMemberService } from '../../services/teamMemberService';
import { orderService } from '../../services/orderService';

const SalesEntry = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lists state
  const [products, setProducts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Form State
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [institution, setInstitution] = useState('');
  const [doctor, setDoctor] = useState('');
  const [area, setArea] = useState('');
  const [teamMember, setTeamMember] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState([]);

  // Generate random PO Number on mount and load data
  useEffect(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPoNumber(`PO-2026-${rand}`);

    Promise.all([
      productService.getAllProducts(),
      doctorService.getAllDoctors(),
      institutionService.getAllInstitutions(),
      areaService.getAllAreas(),
      teamMemberService.getAllTeamMembers()
    ]).then(([productsData, doctorsData, institutionsData, areasData, teamData]) => {
      const activeProds = productsData.filter(p => p.status === 'Active');
      const activeDocs = doctorsData.filter(d => d.status === 'Active');
      const activeInsts = institutionsData.filter(i => i.status === 'Active');
      const activeAreas = areasData.filter(a => a.status === 'Active');
      const activeTeam = teamData.filter(t => t.status === 'Active');

      setProducts(activeProds);
      setDoctors(activeDocs);
      setInstitutions(activeInsts);
      setAreas(activeAreas);
      setTeamMembers(activeTeam);

      // Set default form values
      if (activeInsts.length > 0) setInstitution(activeInsts[0].name);
      if (activeDocs.length > 0) setDoctor(activeDocs[0].name);
      if (activeAreas.length > 0) setArea(activeAreas[0].name);
      if (activeTeam.length > 0) setTeamMember(activeTeam[0].name);

      if (activeProds.length > 0) {
        setItems([{ productId: activeProds[0].id, quantity: 10, rate: activeProds[0].packPrice || activeProds[0].rate || 500 }]);
      }

      setLoading(false);
    });
  }, []);

  const handleProductChange = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === Number(prodId));
    if (!selectedProd) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      rate: selectedProd.packPrice || selectedProd.rate || 500
    };
    setItems(newItems);
  };

  const handleQtyChange = (index, qty) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, Number(qty) || 0);
    setItems(newItems);
  };

  const handleRateChange = (index, rate) => {
    const newItems = [...items];
    newItems[index].rate = Math.max(0, Number(rate) || 0);
    setItems(newItems);
  };

  const addProductRow = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1, rate: products[0].packPrice || products[0].rate || 500 }]);
    }
  };

  const removeProductRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const totalVials = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setToast({ message: 'Please enter PO Number.', type: 'error' });
      return;
    }

    const orderData = {
      poNumber,
      poDate,
      institution,
      doctor,
      area,
      teamMember,
      remarks,
      products: items.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return {
          name: prod ? prod.name : 'Unknown Product',
          qty: item.quantity,
          rate: item.rate
        };
      }),
      totalQty: totalVials,
      totalAmount: grandTotal,
      status: 'Pending'
    };

    orderService.addOrder(orderData).then(() => {
      setToast({ message: 'Purchase Order saved successfully!', type: 'success' });
      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    });
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Sales Entry">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Sales Entry">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-905 dark:text-white uppercase tracking-wider">
            Create Purchase Order
          </h1>
          <p className="text-xs text-gray-450 dark:text-gray-550 font-medium mt-1">
            Fill in the details to record a new purchase order.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Order Info Card */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-850">
              <FiShoppingBag className="w-4 h-4 text-brand-primary" />
              <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Order Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">PO Number *</label>
                <input
                  type="text"
                  required
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">PO Date *</label>
                <input
                  type="date"
                  required
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Institution *</label>
                <select
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Doctor *</label>
                <select
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Area *</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  {areas.map((a) => (
                    <option key={a.id || a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Team Member *</label>
                <select
                  value={teamMember}
                  onChange={(e) => setTeamMember(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-205 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  {teamMembers.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-850">
              <div className="flex items-center gap-2">
                <FiShoppingBag className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Products List</h3>
              </div>
              <button
                type="button"
                onClick={addProductRow}
                className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="md:col-span-5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Rate (Rs)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.rate}
                        onChange={(e) => handleRateChange(index, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 text-right pb-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total</span>
                      <span className="text-xs font-extrabold text-brand-primary">Rs {(item.quantity * item.rate).toLocaleString()}</span>
                    </div>

                    <div className="md:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        disabled={items.length <= 1}
                        className="w-8 h-8 rounded-lg border border-red-100 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-feedback-error disabled:opacity-30 flex items-center justify-center transition-colors"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total Block */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-enterprise flex items-center justify-between border border-gray-150 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Grand Total</span>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Total Quantity</p>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-white mt-0.5">{totalVials.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Grand Total Value</p>
                  <p className="text-sm font-extrabold text-brand-primary mt-0.5">Rs {grandTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 space-y-3">
            <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Remarks & Special Instructions</label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Urgent delivery needed, specific timing..."
              className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-gray-202 dark:border-gray-700 rounded-lg outline-none resize-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-655 dark:text-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-bold rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <FiSave className="w-3.5 h-3.5" />
              Save Purchase Order
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SalesEntry;
