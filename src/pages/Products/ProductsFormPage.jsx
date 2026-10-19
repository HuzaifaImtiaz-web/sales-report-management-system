import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FormShell } from '../../components/layout/FormPanel';
import ProductsForm from './ProductsForm';
import { productService } from '../../services/productService';
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
            const firstInput = (document.querySelector('[role=dialog] input, [role=dialog] select, [role=dialog] textarea') || document.querySelector('input, select, textarea'));
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
    return <FormShell title={pageTitle} description={shortDesc} loading onClose={handleCancel} />;
  }

  return (
    <FormShell
      title={pageTitle}
      description={shortDesc}
      onClose={handleCancel}
      toast={toast}
      onToastClose={() => setToast(null)}
    >
      <ProductsForm
        key={formKey}
        mode={mode}
        item={currentItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </FormShell>
  );
}
