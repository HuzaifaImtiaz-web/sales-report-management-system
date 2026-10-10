// Tasks and reminders from the notification panel. Each user only sees their own.
class TaskRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll(userId) {
    return this.db.all('SELECT id, text, is_done AS done FROM tasks WHERE user_id = ? ORDER BY id ASC', [userId]);
  }

  async save(task, userId) {
    if (task.id) {
      await this.db.run(
        'UPDATE tasks SET text = ?, is_done = ? WHERE id = ? AND user_id = ?',
        [task.text, task.done ? 1 : 0, task.id, userId]
      );
      return task;
    }
    const row = await this.db.get(
      'INSERT INTO tasks (user_id, text, is_done) VALUES (?, ?, ?) RETURNING id',
      [userId, task.text, task.done ? 1 : 0]
    );
    return { id: row.id, text: task.text, done: task.done };
  }

  async delete(id, userId) {
    await this.db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  }
}

class ReminderRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll(userId) {
    return this.db.all(
      'SELECT id, title, reminder_time AS time, type FROM reminders WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );
  }

  async save(reminder, userId) {
    if (reminder.id) {
      await this.db.run(
        'UPDATE reminders SET title = ?, reminder_time = ?, type = ? WHERE id = ? AND user_id = ?',
        [reminder.title, reminder.time, reminder.type, reminder.id, userId]
      );
      return reminder;
    }
    const row = await this.db.get(
      'INSERT INTO reminders (user_id, title, reminder_time, type) VALUES (?, ?, ?, ?) RETURNING id',
      [userId, reminder.title, reminder.time, reminder.type || 'meeting']
    );
    return { id: row.id, title: reminder.title, time: reminder.time, type: reminder.type };
  }

  async delete(id, userId) {
    await this.db.run('DELETE FROM reminders WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  }
}

module.exports = { TaskRepository, ReminderRepository };
