import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FormShell } from '../../components/layout/FormPanel';
import AreasForm from './AreasForm';
import { areaService } from '../../services/areaService';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function AreasFormPage() {
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
      areaService.getAreaById(id).then((item) => {
        setCurrentItem(item);
        setLoading(false);
      }).catch((err) => {
      setToast({ message: err.message || 'This record could not be loaded. Check your connection and try again.', type: 'error' });
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
    return areaService.saveArea(form)
      .then(() => {
        setIsDirty(false);
        if (mode === 'add') {
          setToast({ message: 'Record saved successfully.', type: 'success' });
          setFormKey((prev) => prev + 1);
          setTimeout(() => {
            const firstInput = (document.querySelector('[role=dialog] input, [role=dialog] select, [role=dialog] textarea') || document.querySelector('input, select, textarea'));
            if (firstInput) firstInput.focus();
          }, 50);
        } else {
          navigate('/areas', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save area.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/areas');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Area' : mode === 'edit' ? 'Edit Area' : 'Area Details';
  const shortDesc = mode === 'add'
    ? 'Configure operational areas and zones for distribution.'
    : mode === 'edit'
      ? 'Modify operational area configuration and regional settings.'
      : 'View operational area settings and distribution details.';

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
      <AreasForm
        key={formKey}
        mode={mode}
        item={currentItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </FormShell>
  );
}
