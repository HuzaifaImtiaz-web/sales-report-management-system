import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FormShell } from '../../components/layout/FormPanel';
import TeamMembersForm from './TeamMembersForm';
import { teamMemberService } from '../../services/teamMemberService';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function TeamMembersFormPage() {
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
      teamMemberService.getTeamMemberById(id).then((item) => {
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
    return teamMemberService.saveTeamMember(form)
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
          navigate('/team', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save team member.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/team');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Team Member' : mode === 'edit' ? 'Edit Team Member' : 'Team Member Details';
  const shortDesc = mode === 'add'
    ? 'Add a new member profile to the sales team.'
    : mode === 'edit'
      ? 'Modify sales team member profiles and regional settings.'
      : 'View sales team member details and contact info.';

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
      <TeamMembersForm
        key={formKey}
        mode={mode}
        item={currentItem}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </FormShell>
  );
}
