import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Toast from '../../components/common/Toast';
import { FiPlus, FiTrash2, FiSave, FiX, FiShoppingBag, FiInfo } from 'react-icons/fi';

const PRODUCTS = [
  { id: 1, name: 'Amoxicillin 500mg', unit: 'Vials', rate: 450 },
  { id: 2, name: 'Paracetamol 650mg', unit: 'Vials', rate: 120 },
  { id: 3, name: 'Metformin 850mg', unit: 'Vials', rate: 380 },
  { id: 4, name: 'Lipitor 10mg', unit: 'Vials', rate: 950 },
  { id: 5, name: 'Ibuprofen 400mg', unit: 'Vials', rate: 90 },
  { id: 6, name: 'Omeprazole 20mg', unit: 'Vials', rate: 520 },
  { id: 7, name: 'Augmentin 625mg', unit: 'Vials', rate: 1100 },
  { id: 8, name: 'Azithromycin 250mg', unit: 'Vials', rate: 670 },
  { id: 9, name: 'Ventolin Inhaler', unit: 'Vials', rate: 850 },
  { id: 10, name: 'Crestor 10mg', unit: 'Vials', rate: 1350 }
];

const DOCTORS = [
  { id: 1, name: 'Dr. Ayesha Khan', hospital: 'Mayo Hospital' },
  { id: 2, name: 'Dr. Hamid Raza', hospital: 'Jinnah Hospital' },
  { id: 3, name: 'Dr. Nadia Siddiqui', hospital: 'Shifa International' },
  { id: 4, name: 'Dr. Farhan Latif', hospital: 'Holy Family Hospital' },
  { id: 5, name: 'Dr. Saima Riaz', hospital: 'FIC Faisalabad' },
  { id: 6, name: 'Dr. Tariq Mehmood', hospital: 'Nishtar Hospital' },
  { id: 7, name: 'Dr. Bilal Aslam', hospital: 'Lady Reading Hospital' }
];

const INSTITUTIONS = [
  { id: 1, name: 'Mayo Hospital' },
  { id: 2, name: 'Jinnah Hospital' },
  { id: 3, name: 'Shifa International' },
  { id: 4, name: 'Holy Family Hospital' },
  { id: 5, name: 'FIC Faisalabad' },
  { id: 6, name: 'Nishtar Hospital' }
];

const AREAS = [
  'Lahore Central',
  'Karachi South',
  'Islamabad F-10',
  'Rawalpindi Cantt',
  'Faisalabad City',
  'Multan Cantonment',
  'Peshawar University'
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Ahmed Shah' },
  { id: 2, name: 'Zainab Fatima' },
  { id: 3, name: 'Usman Ali' },
  { id: 4, name: 'Mariam Khan' },
  { id: 5, name: 'Bilal Siddiqui' }
];

const SalesEntry = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  // Form State
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [institution, setInstitution] = useState('Mayo Hospital');
  const [doctor, setDoctor] = useState('Dr. Ayesha Khan');
  const [area, setArea] = useState('Lahore Central');
  const [teamMember, setTeamMember] = useState('Ahmed Shah');
  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState([
    { productId: 1, quantity: 10, rate: 450 }
  ]);

  // Generate random PO Number on mount
  useEffect(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPoNumber(`PO-2026-${rand}`);
  }, []);

  const handleProductChange = (index, prodId) => {
    const selectedProd = PRODUCTS.find((p) => p.id === Number(prodId));
    if (!selectedProd) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      rate: selectedProd.rate
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
    setItems([...items, { productId: 1, quantity: 1, rate: 450 }]);
  };

  const removeProductRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalVials = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSave = (e) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setToast({ message: 'Please enter PO Number.', type: 'error' });
      return;
    }

    const orderData = {
      id: Date.now(),
      poNumber,
      poDate,
      institution,
      doctor,
      area,
      teamMember,
      remarks,
      products: items.map((item) => {
        const prod = PRODUCTS.find((p) => p.id === item.productId);
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

    // Save to localStorage so Orders module can read it
    const existingOrders = JSON.parse(localStorage.getItem('himmel_orders') || '[]');
    localStorage.setItem('himmel_orders', JSON.stringify([orderData, ...existingOrders]));

    setToast({ message: 'Purchase Order saved successfully!', type: 'success' });

    setTimeout(() => {
      navigate('/orders');
    }, 1000);
  };

  return (
    <DashboardLayout pageTitle="Sales Entry">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
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
                  {INSTITUTIONS.map((inst) => (
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
                  {DOCTORS.map((d) => (
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
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
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
                  {TEAM_MEMBERS.map((t) => (
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
                const prod = PRODUCTS.find((p) => p.id === item.productId);
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="md:col-span-5">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Quantity (Vials)</label>
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
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Total Vials</p>
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
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-650 dark:text-gray-300 rounded-lg transition-colors"
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
