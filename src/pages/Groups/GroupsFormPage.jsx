import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import GroupsForm from './GroupsForm';
import { groupService } from '../../services/groupService';

export default function GroupsFormPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [currentItem, setCurrentItem] = useState(null);
  const [loading, setLoading] = useState(id ? true : false);

  const mode = useMemo(() => {
    if (pathname.includes('/new')) return 'add';
    if (pathname.endsWith('/edit')) return 'edit';
    return 'view';
  }, [pathname]);

  useEffect(() => {
    if (id) {
      groupService.getGroupById(id).then((item) => {
        setCurrentItem(item);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = (form) => {
    groupService.saveGroup(form).then(() => {
      navigate('/groups');
    });
  };

  const pageTitle = mode === 'add' ? 'Add Group' : mode === 'edit' ? 'Edit Group' : 'Group Details';
  const shortDesc = mode === 'add'
    ? 'Configure product groups and medical classifications.'
    : mode === 'edit'
    ? 'Modify product group classifications and descriptions.'
    : 'View product group details and classifications.';

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-155 dark:hover:bg-gray-800 rounded-lg text-gray-550 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-905 dark:text-white tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              {shortDesc}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-800 rounded-enterprise shadow-sm p-6 sm:p-8">
          <GroupsForm
            mode={mode}
            item={currentItem}
            onSave={handleSave}
            onCancel={() => navigate('/groups')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
