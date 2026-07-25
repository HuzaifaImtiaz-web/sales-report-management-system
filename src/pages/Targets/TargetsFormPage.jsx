import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import TargetsForm from './TargetsForm';
import { targetService } from '../../services/targetService';
import { productService } from '../../services/productService';
import { areaService } from '../../services/areaService';
import { teamMemberService } from '../../services/teamMemberService';
import Toast from '../../components/common/Toast';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';

export default function TargetsFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setIsDirty, confirmNavigation } = useUnsavedChanges();

  const [currentItem, setCurrentItem] = useState(null);
  const [businessYearsList, setBusinessYearsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [teamMembersList, setTeamMembersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState(null);

  const mode = useMemo(() => {
    if (pathname.includes('/new')) return 'add';
    if (pathname.endsWith('/edit')) return 'edit';
    return 'view';
  }, [pathname]);

  useEffect(() => {
    const promises = [
      targetService.getBusinessYears(),
      productService.getAllProducts(),
      areaService.getAllAreas(),
      teamMemberService.getAllTeamMembers()
    ];

    if (id) {
      promises.push(targetService.getTargetById(id));
    }

    Promise.all(promises).then(([years, products, areas, team, targetItem]) => {
      setBusinessYearsList(years);
      setProductsList(products);
      setAreasList(areas);
      setTeamMembersList(team);
      if (id && targetItem) {
        setCurrentItem(targetItem);
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
    return targetService.saveTarget(form)
      .then(() => {
        setIsDirty(false);
        if (mode === 'add') {
          setToast({ message: 'Record saved successfully.', type: 'success' });
          setFormKey((prev) => prev + 1);
          setTimeout(() => {
            const firstInput = document.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
          }, 50);
        } else {
          navigate('/targets', {
            state: { toast: { message: 'Record updated successfully.', type: 'success' } }
          });
        }
        return true;
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to save targets.', type: 'error' });
        return false;
      });
  };

  const handleCancel = () => {
    confirmNavigation(() => {
      navigate('/targets');
    });
  };

  const pageTitle = mode === 'add' ? 'New Target' : mode === 'edit' ? 'Edit Target' : 'Target Details';
  const shortDesc = mode === 'add'
    ? 'Configure new product sales goals and annual targeting split.'
    : mode === 'edit'
    ? 'Modify sales target quantities, area distributions, and team allocations.'
    : 'View product sales targets, performance splits, and annual goals.';

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
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-155 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-700 transition-colors"
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
          <TargetsForm
            key={formKey}
            mode={mode}
            item={currentItem}
            businessYearsList={businessYearsList}
            productsList={productsList}
            areasList={areasList}
            teamMembersList={teamMembersList}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
