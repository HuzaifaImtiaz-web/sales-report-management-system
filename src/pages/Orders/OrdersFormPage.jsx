import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import OrdersForm from './OrdersForm';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { doctorService } from '../../services/doctorService';
import { institutionService } from '../../services/institutionService';
import { areaService } from '../../services/areaService';
import { teamMemberService } from '../../services/teamMemberService';

export default function OrdersFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const mode = useMemo(() => {
    if (pathname.includes('/new')) return 'add';
    if (pathname.endsWith('/edit')) return 'edit';
    return 'view';
  }, [pathname]);

  useEffect(() => {
    Promise.all([
      productService.getAllProducts(),
      doctorService.getAllDoctors(),
      institutionService.getAllInstitutions(),
      areaService.getAllAreas(),
      teamMemberService.getAllTeamMembers(),
      id ? orderService.getOrderById(id) : Promise.resolve(null)
    ]).then(([productsData, doctorsData, instData, areasData, teamData, orderData]) => {
      setProducts(productsData);
      setDoctors(doctorsData);
      setInstitutions(instData);
      setAreas(areasData);
      setTeamMembers(teamData);
      if (orderData) {
        setCurrentItem(orderData);
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = (form) => {
    orderService.saveOrder(form).then(() => {
      navigate('/orders');
    });
  };

  const pageTitle = mode === 'add' ? 'New Purchase Order' : mode === 'edit' ? 'Edit Purchase Order' : 'Purchase Order Details';
  const shortDesc = mode === 'add'
    ? 'Configure a new purchase order configuration.'
    : mode === 'edit'
    ? 'Modify purchase order items, remarks, and settings.'
    : 'View purchase order details, quantities, rates, and items list.';

  if (loading) {
    return (
      <DashboardLayout pageTitle={pageTitle}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle={pageTitle}>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-155 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-905 dark:text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-555 font-medium mt-0.5">
              {shortDesc}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8">
          <OrdersForm
            mode={mode}
            item={currentItem}
            products={products}
            doctors={doctors}
            institutions={institutions}
            areas={areas}
            teamMembers={teamMembers}
            onSave={handleSave}
            onCancel={() => navigate('/orders')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
