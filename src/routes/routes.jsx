import React from 'react';
import { Navigate } from 'react-router-dom';

// Pages
import DashboardPlaceholder from '../pages/Dashboard/DashboardPlaceholder';
import Products from '../pages/Products/Products';
import ProductsFormPage from '../pages/Products/ProductsFormPage';
import Doctors from '../pages/Doctors/Doctors';
import DoctorsFormPage from '../pages/Doctors/DoctorsFormPage';
import Institutions from '../pages/Institutions/Institutions';
import InstitutionsFormPage from '../pages/Institutions/InstitutionsFormPage';
import Areas from '../pages/Areas/Areas';
import AreasFormPage from '../pages/Areas/AreasFormPage';
import TeamMembers from '../pages/TeamMembers/TeamMembers';
import TeamMembersFormPage from '../pages/TeamMembers/TeamMembersFormPage';
import Groups from '../pages/Groups/Groups';
import GroupsFormPage from '../pages/Groups/GroupsFormPage';
import Targets from '../pages/Targets/Targets';
import TargetsFormPage from '../pages/Targets/TargetsFormPage';
import Orders from '../pages/Orders/Orders';
import OrdersFormPage from '../pages/Orders/OrdersFormPage';
import SalesEntry from '../pages/SalesEntry/SalesEntry';
import Reports from '../pages/Reports/Reports';
import ExportCenter from '../pages/ExportCenter/ExportCenter';
import Settings from '../pages/Settings/Settings';
import Login from '../pages/Login/Login';
import UserManagement from '../pages/Users/UserManagement';
import AuditLog from '../pages/AuditLog/AuditLog';

import ProtectedRoute from '../components/common/ProtectedRoute';

const protect = (element, permission) => <ProtectedRoute requiredPermission={permission}>{element}</ProtectedRoute>;

export const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: protect(<DashboardPlaceholder />),
  },

  // Products Routes
  {
    path: '/products',
    element: protect(<Products />, 'products.view'),
  },
  {
    path: '/products/new',
    element: protect(<ProductsFormPage />, 'products.create'),
  },
  {
    path: '/products/:id',
    element: protect(<ProductsFormPage />, 'products.view'),
  },
  {
    path: '/products/:id/edit',
    element: protect(<ProductsFormPage />, 'products.edit'),
  },

  // Doctors Routes
  {
    path: '/doctors',
    element: protect(<Doctors />, 'doctors.view'),
  },
  {
    path: '/doctors/new',
    element: protect(<DoctorsFormPage />, 'doctors.create'),
  },
  {
    path: '/doctors/:id',
    element: protect(<DoctorsFormPage />, 'doctors.view'),
  },
  {
    path: '/doctors/:id/edit',
    element: protect(<DoctorsFormPage />, 'doctors.edit'),
  },

  // Areas Routes
  {
    path: '/areas',
    element: protect(<Areas />, 'areas.view'),
  },
  {
    path: '/areas/new',
    element: protect(<AreasFormPage />, 'areas.create'),
  },
  {
    path: '/areas/:id',
    element: protect(<AreasFormPage />, 'areas.view'),
  },
  {
    path: '/areas/:id/edit',
    element: protect(<AreasFormPage />, 'areas.edit'),
  },

  // Team Members Routes
  {
    path: '/team',
    element: protect(<TeamMembers />, 'teamMembers.view'),
  },
  {
    path: '/team/new',
    element: protect(<TeamMembersFormPage />, 'teamMembers.create'),
  },
  {
    path: '/team/:id',
    element: protect(<TeamMembersFormPage />, 'teamMembers.view'),
  },
  {
    path: '/team/:id/edit',
    element: protect(<TeamMembersFormPage />, 'teamMembers.edit'),
  },

  // Groups Routes
  {
    path: '/groups',
    element: protect(<Groups />, 'groups.view'),
  },
  {
    path: '/groups/new',
    element: protect(<GroupsFormPage />, 'groups.create'),
  },
  {
    path: '/groups/:id',
    element: protect(<GroupsFormPage />, 'groups.view'),
  },
  {
    path: '/groups/:id/edit',
    element: protect(<GroupsFormPage />, 'groups.edit'),
  },

  // Sales Entry Routes
  {
    path: '/sales',
    element: protect(<SalesEntry />),
  },

  // Orders Routes
  {
    path: '/orders',
    element: protect(<OrdersFormPage />, 'orders.create'),
  },
  {
    path: '/orders/new',
    element: protect(<OrdersFormPage />, 'orders.create'),
  },
  {
    path: '/orders/:id',
    element: protect(<OrdersFormPage />, 'orders.view'),
  },
  {
    path: '/orders/:id/edit',
    element: protect(<OrdersFormPage />, 'orders.edit'),
  },

  // Institutions Routes
  {
    path: '/institutions',
    element: protect(<Institutions />, 'institutions.view'),
  },
  {
    path: '/institutions/new',
    element: protect(<InstitutionsFormPage />, 'institutions.create'),
  },
  {
    path: '/institutions/:id',
    element: protect(<InstitutionsFormPage />, 'institutions.view'),
  },
  {
    path: '/institutions/:id/edit',
    element: protect(<InstitutionsFormPage />, 'institutions.edit'),
  },

  // Target Routes
  {
    path: '/targets',
    element: protect(<Targets />, 'targets.view'),
  },
  {
    path: '/targets/new',
    element: protect(<TargetsFormPage />, 'targets.create'),
  },
  {
    path: '/targets/:id',
    element: protect(<TargetsFormPage />, 'targets.view'),
  },
  {
    path: '/targets/:id/edit',
    element: protect(<TargetsFormPage />, 'targets.edit'),
  },

  {
    path: '/reports',
    element: protect(<Reports />, 'reports.view'),
  },
  {
    path: '/export',
    element: protect(<ExportCenter />, 'reports.export'),
  },
  {
    path: '/settings',
    element: protect(<Settings />),
  },
  {
    path: '/audit-logs',
    element: protect(<AuditLog />, 'audit.view'),
  },
  {
    path: '/users',
    element: protect(<UserManagement />, 'settings.users'),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
