import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiCircle, FiCalendar, FiBell, FiClock, FiCheck, FiPlus, FiTrash2 } from 'react-icons/fi';

const NotificationPanel = () => {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  
  const [reminders, setReminders] = useState([]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderType, setNewReminderType] = useState('meeting');
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data from DB
  const fetchAllData = async () => {
    try {
      // 1. Fetch Tasks
      let dbTasks = [];
      if (window.api && window.api.tasks) {
        const res = await window.api.tasks.getAll().catch(() => null);
        if (res && res.success) {
          dbTasks = res.data || [];
        }
      } else {
        const saved = localStorage.getItem('himmel_tasks');
        if (saved) {
          try {
            dbTasks = JSON.parse(saved);
          } catch (e) {}
        }
      }
      setTasks(dbTasks);

      // 2. Fetch Reminders
      let dbReminders = [];
      if (window.api && window.api.reminders) {
        const res = await window.api.reminders.getAll().catch(() => null);
        if (res && res.success) {
          dbReminders = res.data || [];
        }
      } else {
        const saved = localStorage.getItem('himmel_reminders');
        if (saved) {
          try {
            dbReminders = JSON.parse(saved);
          } catch (e) {}
        }
      }
      setReminders(dbReminders);

      // 3. Fetch Live Database Events for Notifications
      const dbNotifications = [];
      let doctors = [];
      if (window.api && window.api.doctors) {
        const res = await window.api.doctors.getAll().catch(() => null);
        if (res && res.success) {
          doctors = res.data || [];
        }
      }
      let orders = [];
      if (window.api && window.api.orders) {
        const res = await window.api.orders.getAll().catch(() => null);
        if (res && res.success) {
          orders = res.data || [];
        }
      }

      if (doctors && doctors.length > 0) {
        doctors.forEach((doc) => {
          dbNotifications.push({
            id: `doc-${doc.id}`,
            text: `Dr. ${doc.name} registered in ${doc.area || 'system'}`,
            time: 'Doctor Signup',
            rawId: doc.id
          });
        });
      }
      if (orders && orders.length > 0) {
        orders.forEach((ord) => {
          dbNotifications.push({
            id: `ord-${ord.id}`,
            text: `Order ${ord.orderNumber || ord.order_number} submitted for Rs ${(ord.totalAmount || ord.total_amount || 0).toLocaleString()}`,
            time: 'Sales entry',
            rawId: ord.id
          });
        });
      }

      // Sort notifications to show latest events first (largest rawId first)
      dbNotifications.sort((a, b) => b.rawId - a.rawId);
      setNotifications(dbNotifications.slice(0, 8));
    } catch (err) {
      console.error('Error fetching sidebar notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handlers for tasks list
  const handleToggleTask = async (id) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;
    const updatedTask = { ...taskToToggle, done: !taskToToggle.done };

    if (window.api && window.api.tasks) {
      await window.api.tasks.save(updatedTask).catch(() => {});
      fetchAllData();
    } else {
      const updated = tasks.map(t => t.id === id ? updatedTask : t);
      setTasks(updated);
      localStorage.setItem('himmel_tasks', JSON.stringify(updated));
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.api && window.api.tasks) {
      await window.api.tasks.delete(id).catch(() => {});
      fetchAllData();
    } else {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem('himmel_tasks', JSON.stringify(updated));
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      text: newTaskText.trim(),
      done: false
    };

    if (window.api && window.api.tasks) {
      await window.api.tasks.save(newTask).catch(() => {});
      fetchAllData();
    } else {
      const updated = [...tasks, { ...newTask, id: Date.now() }];
      setTasks(updated);
      localStorage.setItem('himmel_tasks', JSON.stringify(updated));
    }
    setNewTaskText('');
  };

  // Handlers for reminders
  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    const newReminder = {
      title: newReminderTitle.trim(),
      time: 'Just now',
      type: newReminderType
    };

    if (window.api && window.api.reminders) {
      await window.api.reminders.save(newReminder).catch(() => {});
      fetchAllData();
    } else {
      const updated = [...reminders, { ...newReminder, id: Date.now() }];
      setReminders(updated);
      localStorage.setItem('himmel_reminders', JSON.stringify(updated));
    }
    setNewReminderTitle('');
    setIsAddingReminder(false);
  };

  const handleDeleteReminder = async (id) => {
    if (window.api && window.api.reminders) {
      await window.api.reminders.delete(id).catch(() => {});
      fetchAllData();
    } else {
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      localStorage.setItem('himmel_reminders', JSON.stringify(updated));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Today's Tasks */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-brand-primary" />
            Today&apos;s Tasks
          </h3>
          <span className="text-[9px] font-bold text-white bg-brand-primary px-1.5 py-0.5 rounded-full">
            {tasks.filter(t => !t.done).length}
          </span>
        </div>
        
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium py-2">No tasks remaining today.</p>
        ) : (
          <ul className="space-y-3 mb-4" aria-label="Tasks list">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2.5 text-xs text-gray-705 dark:text-gray-200 font-semibold group">
                <button 
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  className="flex items-start gap-2.5 text-left flex-1"
                >
                  {task.done ? (
                    <span className="w-4 h-4 rounded-full bg-green-50 dark:bg-green-900/30 text-feedback-success flex items-center justify-center flex-shrink-0 mt-0.5 border border-green-150 dark:border-green-800/50">
                      <FiCheck className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <FiCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={task.done ? 'line-through text-gray-400 dark:text-gray-500 font-medium' : ''}>{task.text}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-455 hover:text-feedback-error rounded transition-opacity"
                  title="Delete task"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add Task Input Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add new task..."
            className="flex-1 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-55 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded outline-none focus:border-brand-primary/40 focus:ring-1 focus:ring-brand-primary/10 transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            className="p-1.5 text-white bg-brand-primary hover:bg-brand-primaryDark rounded transition-colors flex items-center justify-center"
            title="Add task"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Upcoming Reminders */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Upcoming Reminders</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingReminder(!isAddingReminder)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-brand-primary"
            title="Add reminder"
          >
            <FiPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAddingReminder && (
          <form onSubmit={handleAddReminder} className="mb-4 p-3 bg-gray-55 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-lg space-y-2">
            <input
              type="text"
              required
              value={newReminderTitle}
              onChange={(e) => setNewReminderTitle(e.target.value)}
              placeholder="Reminder title..."
              className="w-full px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded outline-none placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={newReminderType}
                onChange={(e) => setNewReminderType(e.target.value)}
                className="text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded px-2 py-1 outline-none text-gray-750 dark:text-gray-300"
              >
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
              </select>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingReminder(false)}
                  className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}

        {reminders.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium py-2">No upcoming reminders.</p>
        ) : (
          <div className="space-y-3.5">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-3">
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
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(reminder.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-450 hover:text-feedback-error rounded transition-opacity"
                  title="Delete reminder"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      <div className="bg-white dark:bg-[#0f172a] border border-gray-155 dark:border-gray-800 rounded-enterprise shadow-soft p-5 transition-all duration-200 hover:shadow-premium dark:hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-55 dark:border-gray-800 pb-2.5">
          <FiBell className="w-4 h-4 text-brand-primary" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Notifications</h3>
        </div>
        
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium py-2">No new notifications.</p>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-650 dark:text-gray-300 font-semibold leading-relaxed">{notif.text}</p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1 uppercase tracking-wider">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationPanel;
