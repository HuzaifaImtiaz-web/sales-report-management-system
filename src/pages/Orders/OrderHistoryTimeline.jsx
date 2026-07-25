import React from 'react';
import { FiCheckCircle, FiClock, FiFileText, FiXCircle, FiUser } from 'react-icons/fi';

const formatDate = (isoString) => {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return isoString;
  }
};

const OrderHistoryTimeline = ({ order }) => {
  if (!order) return null;

  const events = [];

  // Created event
  events.push({
    title: 'Order Created',
    status: 'Draft',
    actor: order.createdBy || 'Admin',
    timestamp: formatDate(order.createdAt || order.poDate),
    icon: FiFileText,
    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800'
  });

  // Submitted event
  if (order.submittedAt || order.status === 'Pending' || order.status === 'Approved' || order.status === 'Completed') {
    events.push({
      title: 'Order Submitted',
      status: 'Pending',
      actor: order.createdBy || 'Sales Team',
      timestamp: formatDate(order.submittedAt) || 'Submitted',
      icon: FiClock,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/40'
    });
  }

  // Approved event
  if (order.approvedAt || order.approvedBy || order.status === 'Approved' || order.status === 'Completed') {
    events.push({
      title: 'Order Approved',
      status: 'Approved',
      actor: order.approvedBy || 'Manager',
      timestamp: formatDate(order.approvedAt) || 'Approved',
      icon: FiCheckCircle,
      color: 'text-sky-600 bg-sky-100 dark:bg-sky-950/40'
    });
  }

  // Completed event
  if (order.completedAt || order.completedBy || order.status === 'Completed') {
    events.push({
      title: 'Order Completed',
      status: 'Completed',
      actor: order.completedBy || 'Admin',
      timestamp: formatDate(order.completedAt) || 'Completed',
      icon: FiCheckCircle,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40'
    });
  }

  // Cancelled event
  if (order.status === 'Cancelled' || order.cancelledAt || order.cancelledBy) {
    events.push({
      title: 'Order Cancelled',
      status: 'Cancelled',
      actor: order.cancelledBy || 'System',
      timestamp: formatDate(order.cancelledAt) || 'Cancelled',
      reason: order.cancelReason,
      icon: FiXCircle,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-950/40'
    });
  }

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise p-5 space-y-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <FiClock className="w-3.5 h-3.5" /> Order History & Audit Timeline
      </h3>

      <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
        {events.map((ev, idx) => {
          const Icon = ev.icon;
          return (
            <div key={idx} className="relative group">
              <div className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0f172a] ${ev.color}`}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{ev.title}</span>
                  {ev.timestamp && (
                    <span className="text-[10px] text-gray-400 font-mono">{ev.timestamp}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  <FiUser className="w-3 h-3 text-gray-400" />
                  <span>By: <strong className="text-gray-700 dark:text-gray-300">{ev.actor}</strong></span>
                </div>
                {ev.reason && (
                  <div className="mt-1.5 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-150 dark:border-rose-800/40 text-[11px] text-rose-700 dark:text-rose-300">
                    <strong>Reason:</strong> {ev.reason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistoryTimeline;
