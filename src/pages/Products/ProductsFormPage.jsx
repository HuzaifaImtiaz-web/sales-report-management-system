import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProductsForm from './ProductsForm';
import { productService } from '../../services/productService';
import Toast from '../../components/common/Toast';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function ProductsFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setIsDirty, confirmNavigation } = useUnsavedChanges();
  
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    if (pathname.includes('/new')) return 'add';
    if (pathname.endsWith('/edit')) return 'edit';
    return 'view';
  }, [pathname]);

  useEffect(() => {
    if (id) {
      productService.getProductById(id).then((item) => {
        setCurrentItem(item);
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    return () => {
      setIsDirty(false);
    };
  }, [setIsDirty]);

  const handleSave = (form) => {
    setToast(null);
    return productService.saveProduct(form)
      .then(() => {
        setIsDirty(false);
        if (mode === 'add') {
          setToast({ message: 'Record saved successfully.', type: 'success' });
          setFormKey((prev) => prev + 1);
          setTimeout(() => {
            const firstInput = document.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
          }, 50);
          return true;
        } else {
          navigate('/products', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
          return true;
        }
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save product.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/products');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Product' : mode === 'edit' ? 'Edit Product' : 'Product Details';
  const shortDesc = mode === 'add'
    ? 'Create a new pharmaceutical product in the system.'
    : mode === 'edit'
    ? 'Modify the details of an existing product.'
    : 'View the pharmaceutical product details.';

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
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-150 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-950 dark:text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-555 font-medium mt-0.5">
              {shortDesc}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8">
          <ProductsForm
            key={formKey}
            mode={mode}
            item={currentItem}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
