import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';
import GuestGuard from '../components/GuestGuard';

// Pages
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import ResetSuccess from '../pages/ResetSuccess';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';
import PlaceholderPage from '../pages/PlaceholderPage';
import PendingOrders from '../pages/PendingOrders';
import Products from '../pages/Products';
import Doctors from '../pages/Doctors';
import Areas from '../pages/Areas';
import TeamMembers from '../pages/TeamMembers';
import Groups from '../pages/Groups';
import ProductTargets from '../pages/ProductTargets';
import SalesEntry from '../pages/SalesEntry';
import Reports from '../pages/Reports';
import ImportExcel from '../pages/ImportExcel';
import ExportCenter from '../pages/ExportCenter';



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
    path: '/pending-orders',
    element: (
      <AuthGuard>
        <PendingOrders />
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
        <PlaceholderPage title="Settings" />
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
