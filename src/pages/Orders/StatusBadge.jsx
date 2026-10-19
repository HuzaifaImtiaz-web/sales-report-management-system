import React from 'react';

// Order status label: soft colour plus the word, so it never depends on colour alone.
const STATUS_CLASS = {
  Draft: 'badge-neutral',
  Pending: 'badge-pending',
  Approved: 'badge-neutral',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
};

const StatusBadge = ({ status }) => (
  <span className={STATUS_CLASS[status] || 'badge-neutral'}>
    {status || 'Unknown'}
  </span>
);

export default StatusBadge;
