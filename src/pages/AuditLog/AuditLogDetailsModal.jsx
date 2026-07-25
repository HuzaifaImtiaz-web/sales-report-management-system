import React from 'react';
import { FiX, FiClock, FiUser, FiLayers, FiActivity, FiArrowRight, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { calculateDiff } from '../../services/auditService';

export default function AuditLogDetailsModal({ log, onClose }) {
  if (!log) return null;

  const diffs = calculateDiff(log.oldValue, log.newValue);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
              <FiActivity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Audit Record #{log.id}
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-primary/10 text-brand-primary">
                  {log.action}
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Detailed field inspection and diff log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                <FiUser className="inline mr-1" /> Performed By
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{log.performedBy || 'System'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                <FiLayers className="inline mr-1" /> Module
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{log.module}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                Entity Identifier
              </span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{log.entityId ? `${log.entityType} #${log.entityId}` : log.entityType}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                <FiClock className="inline mr-1" /> Timestamp
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{formatTimestamp(log.performedAt)}</span>
            </div>
          </div>

          {/* Changed Fields Diff View */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              Changed Fields ({diffs.length})
            </h4>

            {diffs.length === 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500">
                No direct property modifications detected (or non-structural record trigger).
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="py-2.5 px-3.5 font-bold">Field</th>
                      <th className="py-2.5 px-3.5 font-bold text-rose-600 dark:text-rose-400">Previous Value</th>
                      <th className="py-2.5 px-3.5 font-bold text-center w-8"></th>
                      <th className="py-2.5 px-3.5 font-bold text-emerald-600 dark:text-emerald-400">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {diffs.map((d, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 font-medium">
                        <td className="py-2.5 px-3.5 font-mono text-gray-900 dark:text-white capitalize font-bold">
                          {d.field}
                        </td>
                        <td className="py-2.5 px-3.5 text-rose-700 dark:text-rose-300 font-mono bg-rose-50/40 dark:bg-rose-950/20">
                          {d.oldValue}
                        </td>
                        <td className="py-2.5 px-1 text-center text-gray-400">
                          <FiArrowRight className="w-3.5 h-3.5 inline" />
                        </td>
                        <td className="py-2.5 px-3.5 text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-50/40 dark:bg-emerald-950/20">
                          {d.newValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Raw Values Collapsible / JSON Inspection */}
          <details className="text-xs group">
            <summary className="cursor-pointer font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors py-1">
              Raw Log Payload (JSON)
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 font-mono text-[11px]">
              <div className="p-3 bg-gray-900 text-gray-100 rounded-xl overflow-x-auto">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">old_value:</span>
                <pre>{JSON.stringify(log.oldValue, null, 2) || 'null'}</pre>
              </div>
              <div className="p-3 bg-gray-900 text-gray-100 rounded-xl overflow-x-auto">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block mb-1">new_value:</span>
                <pre>{JSON.stringify(log.newValue, null, 2) || 'null'}</pre>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primaryDark transition-all"
          >
            Close Detail View
          </button>
        </div>
      </div>
    </div>
  );
}
