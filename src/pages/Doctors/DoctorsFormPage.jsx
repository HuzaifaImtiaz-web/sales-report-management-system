import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FormShell } from '../../components/layout/FormPanel';
import DoctorsForm from './DoctorsForm';
import { doctorService } from '../../services/doctorService';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function DoctorsFormPage() {
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
      doctorService.getDoctorById(id).then((item) => {
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
    return doctorService.saveDoctor(form)
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
          navigate('/doctors', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save doctor.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/doctors');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Doctor' : mode === 'edit' ? 'Edit Doctor' : 'Doctor Details';
  const shortDesc = mode === 'add'
    ? 'Add a new physician profile to the database.'
    : mode === 'edit'
    ? 'Modify physician details and contact information.'
    : 'View physician profile details.';

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
      <DoctorsForm
        key={formKey}
        mode={mode}
        item={currentItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </FormShell>
  );
}
