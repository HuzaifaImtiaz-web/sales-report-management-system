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
import Toast from '../../components/common/Toast';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function OrdersFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setIsDirty, confirmNavigation } = useUnsavedChanges();

  const [products, setProducts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    if (pathname.endsWith('/edit')) return 'edit';
    if (id) return 'view';
    return 'add';
  }, [pathname, id]);

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

  useEffect(() => {
    return () => {
      setIsDirty(false);
    };
  }, [setIsDirty]);

  const handleSave = (form) => {
    setToast(null);
    return orderService.saveOrder(form)
      .then((saved) => {
        setIsDirty(false);
        if (mode === 'add') {
          setToast({ message: `Order PO ${saved.poNumber || form.poNumber} saved as Pending successfully.`, type: 'success' });
          setFormKey((prev) => prev + 1);
          setTimeout(() => {
            const firstInput = (document.querySelector('[role=dialog] input, [role=dialog] select, [role=dialog] textarea') || document.querySelector('input, select, textarea'));
            if (firstInput) firstInput.focus();
          }, 50);
        } else {
          navigate('/sales', {
            state: { toast: { message: 'Order updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save order.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      if (mode === 'add') {
        setIsDirty(false);
        setFormKey((prev) => prev + 1);
      } else {
        navigate('/sales');
      }
    });
  };

  const pageTitle = mode === 'add' ? 'Sales Entry' : mode === 'edit' ? 'Edit Order' : 'Order Details';
  const shortDesc = mode === 'add'
    ? 'Record a new order in three short steps.'
    : mode === 'edit'
    ? 'Change the order details or products.'
    : 'Order details, products and prices.';

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
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="flex items-center gap-4">
          {mode !== 'add' && (
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer text-xs font-semibold"
            >
              ← Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-ink dark:text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-555 font-medium mt-0.5">
              {shortDesc}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-brand-navyCard border border-gray-200 dark:border-brand-navyLine rounded-enterprise shadow-sm p-6 sm:p-8">
          <OrdersForm
            key={formKey}
            mode={mode}
            item={currentItem}
            products={products}
            doctors={doctors}
            institutions={institutions}
            areas={areas}
            teamMembers={teamMembers}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
