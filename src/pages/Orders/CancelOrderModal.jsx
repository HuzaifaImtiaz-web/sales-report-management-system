import React from 'react';
import PromptDialog from '../../components/common/dialogs/PromptDialog';

const CancelOrderModal = ({ order, onCancel, onConfirm }) => {
  return (
    <PromptDialog
      open={Boolean(order)}
      title="Cancel Order"
      message={`Are you sure you want to cancel Purchase Order ${order?.poNumber || ''}? This action cannot be undone.`}
      placeholder="Enter cancellation reason (required)..."
      confirmText="Cancel Order"
      cancelText="Close"
      confirmVariant="danger"
      required={true}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default CancelOrderModal;
