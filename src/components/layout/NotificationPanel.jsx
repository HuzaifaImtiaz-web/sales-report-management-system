import React from 'react';
import { FiCheckCircle, FiCircle, FiCalendar, FiBell, FiClock, FiCheck } from 'react-icons/fi';

const TASKS = [
  { id: 1, text: 'Review June Area Targets', done: true },
  { id: 2, text: 'Follow up with Dr. Hamid Raza', done: false },
  { id: 3, text: 'Sign off Multan sales report', done: false },
  { id: 4, text: 'Update product price listings', done: false },
];

const REMINDERS = [
  { id: 1, title: 'Q2 Sales Review Meet', time: 'Today, 2:00 PM', type: 'meeting' },
  { id: 2, title: 'Lahore Target Deadline', time: 'Jul 15, 5:00 PM', type: 'deadline' },
];

const NOTIFICATIONS = [
  { id: 1, text: 'Zara Hussain submitted June report', time: '10 mins ago' },
  { id: 2, text: 'New doctor registered in Lahore Central', time: '1 hr ago' },
  { id: 3, text: 'Product list database synchronized', time: '3 hrs ago' },
];

const NotificationPanel = () => {
  return (
    <div className="space-y-6">
      
      {/* Today's Tasks */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-brand-primary" />
            Today&apos;s Tasks
          </h3>
          <span className="text-[9px] font-bold text-white bg-brand-primary px-1.5 py-0.5 rounded-full">
            {TASKS.filter(t => !t.done).length}
          </span>
        </div>
        <ul className="space-y-3" aria-label="Tasks list">
          {TASKS.map((task) => (
            <li key={task.id} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-200 font-semibold">
              {task.done ? (
                <span className="w-4 h-4 rounded-full bg-green-50 dark:bg-green-900/30 text-feedback-success flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-150 dark:border-green-800/50">
                  <FiCheck className="w-2.5 h-2.5" />
                </span>
              ) : (
                <FiCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
              )}
              <span className={task.done ? 'line-through text-gray-400 dark:text-gray-500 font-medium' : ''}>{task.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <FiCalendar className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Upcoming Reminders</h3>
        </div>
        <div className="space-y-3.5">
          {REMINDERS.map((reminder) => (
            <div key={reminder.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                reminder.type === 'meeting' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500'
              }`}>
                <FiClock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">{reminder.title}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{reminder.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <FiBell className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Notifications</h3>
        </div>
        <div className="space-y-3.5">
          {NOTIFICATIONS.map((notif) => (
            <div key={notif.id} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold leading-relaxed">{notif.text}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default NotificationPanel;
