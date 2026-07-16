import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import TeamMembersForm from './TeamMembersForm';
import { teamMemberService } from '../../services/teamMemberService';

export default function TeamMembersFormPage() {
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
      teamMemberService.getTeamMemberById(id).then((item) => {
        setCurrentItem(item);
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = (form) => {
    teamMemberService.saveTeamMember(form).then(() => {
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
            onClick={() => navigate('/team')}
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
          <TeamMembersForm
            mode={mode}
            item={currentItem}
            onSave={handleSave}
            onCancel={() => navigate('/team')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
