import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthGuard from '../components/common/AuthGuard';
import GuestGuard from '../components/common/GuestGuard';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/Auth/Login';
import SignUp from '../pages/Auth/SignUp';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetSuccess from '../pages/Auth/ResetSuccess';
import DashboardPlaceholder from '../pages/Dashboard/DashboardPlaceholder';
import Orders from '../pages/Orders/Orders';
import Institutions from '../pages/Institutions/Institutions';
import Products from '../pages/Products/Products';
import Doctors from '../pages/Doctors/Doctors';
import Areas from '../pages/Areas/Areas';
import TeamMembers from '../pages/TeamMembers/TeamMembers';
import Groups from '../pages/Groups/Groups';
import ProductTargets from '../pages/ProductTargets/ProductTargets';
import SalesEntry from '../pages/SalesEntry/SalesEntry';
import Reports from '../pages/Reports/Reports';
import ImportExcel from '../pages/ImportExcel/ImportExcel';
import ExportCenter from '../pages/ExportCenter/ExportCenter';
import Settings from '../pages/Settings/Settings';

export const routes = [
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Login />
      </GuestGuard>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestGuard>
        <SignUp />
      </GuestGuard>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <GuestGuard>
        <ForgotPassword />
      </GuestGuard>
    ),
  },
  {
    path: '/reset-success',
    element: (
      <GuestGuard>
        <ResetSuccess />
      </GuestGuard>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardPlaceholder />
      </AuthGuard>
    ),
  },
  {
    path: '/products',
    element: (
      <AuthGuard>
        <Products />
      </AuthGuard>
    ),
  },
  {
    path: '/doctors',
    element: (
      <AuthGuard>
        <Doctors />
      </AuthGuard>
    ),
  },
  {
    path: '/areas',
    element: (
      <AuthGuard>
        <Areas />
      </AuthGuard>
    ),
  },
  {
    path: '/team',
    element: (
      <AuthGuard>
        <TeamMembers />
      </AuthGuard>
    ),
  },
  {
    path: '/groups',
    element: (
      <AuthGuard>
        <Groups />
      </AuthGuard>
    ),
  },
  {
    path: '/sales',
    element: (
      <AuthGuard>
        <SalesEntry />
      </AuthGuard>
    ),
  },
  {
    path: '/orders',
    element: (
      <AuthGuard>
        <Orders />
      </AuthGuard>
    ),
  },
  {
    path: '/orders/:id',
    element: (
      <AuthGuard>
        <Orders />
      </AuthGuard>
    ),
  },
  {
    path: '/orders/:id/edit',
    element: (
      <AuthGuard>
        <Orders />
      </AuthGuard>
    ),
  },
  {
    path: '/institutions',
    element: (
      <AuthGuard>
        <Institutions />
      </AuthGuard>
    ),
  },
  {
    path: '/institutions/new',
    element: (
      <AuthGuard>
        <Institutions />
      </AuthGuard>
    ),
  },
  {
    path: '/institutions/:id',
    element: (
      <AuthGuard>
        <Institutions />
      </AuthGuard>
    ),
  },
  {
    path: '/institutions/:id/edit',
    element: (
      <AuthGuard>
        <Institutions />
      </AuthGuard>
    ),
  },
  {
    path: '/targets',
    element: (
      <AuthGuard>
        <ProductTargets />
      </AuthGuard>
    ),
  },
  {
    path: '/reports',
    element: (
      <AuthGuard>
        <Reports />
      </AuthGuard>
    ),
  },
  {
    path: '/import',
    element: (
      <AuthGuard>
        <ImportExcel />
      </AuthGuard>
    ),
  },
  {
    path: '/export',
    element: (
      <AuthGuard>
        <ExportCenter />
      </AuthGuard>
    ),
  },
  {
    path: '/settings',
    element: (
      <AuthGuard>
        <Settings />
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
