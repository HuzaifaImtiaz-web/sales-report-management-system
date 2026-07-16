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
import ImportExcel from '../pages/ImportExcel/ImportExcel';
import ExportCenter from '../pages/ExportCenter/ExportCenter';
import Settings from '../pages/Settings/Settings';

export const routes = [
  {
    path: '/dashboard',
    element: <DashboardPlaceholder />,
  },

  // Products Routes
  {
    path: '/products',
    element: <Products />,
  },
  {
    path: '/products/new',
    element: <ProductsFormPage />,
  },
  {
    path: '/products/:id',
    element: <ProductsFormPage />,
  },
  {
    path: '/products/:id/edit',
    element: <ProductsFormPage />,
  },

  // Doctors Routes
  {
    path: '/doctors',
    element: <Doctors />,
  },
  {
    path: '/doctors/new',
    element: <DoctorsFormPage />,
  },
  {
    path: '/doctors/:id',
    element: <DoctorsFormPage />,
  },
  {
    path: '/doctors/:id/edit',
    element: <DoctorsFormPage />,
  },

  // Areas Routes
  {
    path: '/areas',
    element: <Areas />,
  },
  {
    path: '/areas/new',
    element: <AreasFormPage />,
  },
  {
    path: '/areas/:id',
    element: <AreasFormPage />,
  },
  {
    path: '/areas/:id/edit',
    element: <AreasFormPage />,
  },

  // Team Members Routes
  {
    path: '/team',
    element: <TeamMembers />,
  },
  {
    path: '/team/new',
    element: <TeamMembersFormPage />,
  },
  {
    path: '/team/:id',
    element: <TeamMembersFormPage />,
  },
  {
    path: '/team/:id/edit',
    element: <TeamMembersFormPage />,
  },

  // Groups Routes
  {
    path: '/groups',
    element: <Groups />,
  },
  {
    path: '/groups/new',
    element: <GroupsFormPage />,
  },
  {
    path: '/groups/:id',
    element: <GroupsFormPage />,
  },
  {
    path: '/groups/:id/edit',
    element: <GroupsFormPage />,
  },

  // Sales Entry
  {
    path: '/sales',
    element: <SalesEntry />,
  },

  // Orders Routes
  {
    path: '/orders',
    element: <Orders />,
  },
  {
    path: '/orders/:id',
    element: <OrdersFormPage />,
  },
  {
    path: '/orders/:id/edit',
    element: <OrdersFormPage />,
  },

  // Institutions Routes
  {
    path: '/institutions',
    element: <Institutions />,
  },
  {
    path: '/institutions/new',
    element: <InstitutionsFormPage />,
  },
  {
    path: '/institutions/:id',
    element: <InstitutionsFormPage />,
  },
  {
    path: '/institutions/:id/edit',
    element: <InstitutionsFormPage />,
  },

  // Target Routes
  {
    path: '/targets',
    element: <Targets />,
  },
  {
    path: '/targets/new',
    element: <TargetsFormPage />,
  },
  {
    path: '/targets/:id',
    element: <TargetsFormPage />,
  },
  {
    path: '/targets/:id/edit',
    element: <TargetsFormPage />,
  },

  {
    path: '/reports',
    element: <Reports />,
  },
  {
    path: '/import',
    element: <ImportExcel />,
  },
  {
    path: '/export',
    element: <ExportCenter />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
