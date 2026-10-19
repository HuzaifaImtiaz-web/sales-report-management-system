import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FormShell } from '../../components/layout/FormPanel';
import InstitutionsForm from './InstitutionsForm';
import { institutionService } from '../../services/institutionService';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function InstitutionsFormPage() {
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
      institutionService.getInstitutionById(id).then((item) => {
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
    return institutionService.saveInstitution(form)
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
          navigate('/institutions', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save institution.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/institutions');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Institution' : mode === 'edit' ? 'Edit Institution' : 'Institution Details';
  const shortDesc = mode === 'add'
    ? 'Configure institution / hospital profile and location settings.'
    : mode === 'edit'
    ? 'Modify hospital profiles, location settings, and contact person.'
    : 'View hospital profile settings and details.';

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
      <InstitutionsForm
        key={formKey}
        mode={mode}
        item={currentItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </FormShell>
  );
}
